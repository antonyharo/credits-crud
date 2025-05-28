import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

// === ENV ===
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// === SUPABASE CLIENT ===
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// === HANDLER ===
export async function POST(req) {
    const payload = await req.text();
    const headerList = headers();

    const svixHeaders = {
        "svix-id": headerList.get("svix-id"),
        "svix-timestamp": headerList.get("svix-timestamp"),
        "svix-signature": headerList.get("svix-signature"),
    };

    const webhook = new Webhook(CLERK_WEBHOOK_SECRET);

    let evt;
    try {
        evt = webhook.verify(payload, svixHeaders);
    } catch (err) {
        console.error("[Webhook] Assinatura inválida:", err);
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
        );
    }

    const eventType = evt.type;
    const user = evt.data;

    if (eventType === "user.created") {
        const fullName = `${user.first_name || ""} ${
            user.last_name || ""
        }`.trim();
        const email = user.email_addresses?.[0]?.email_address || "";
        const userId = user.id;

        const { data: existingUser, error: selectError } = await supabase
            .from("users")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (selectError && selectError.code !== "PGRST116") {
            console.error("[Supabase] Erro ao buscar usuário:", selectError);
            return NextResponse.json(
                { error: "Erro ao buscar usuário" },
                { status: 500 }
            );
        }

        if (!existingUser) {
            const { error: insertError } = await supabase.from("users").insert({
                user_id: userId,
                full_name: fullName,
                email: email,
                credits: 10,
            });

            if (insertError) {
                console.error(
                    "[Supabase] Erro ao inserir usuário:",
                    insertError
                );
                return NextResponse.json(
                    { error: "Erro ao criar usuário" },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: `Evento ignorado: ${eventType}` });
}
