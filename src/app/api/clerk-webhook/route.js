// app/api/clerk-webhook/route.ts
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET; // Você define isso no painel da Clerk

export async function POST(req) {
    const payload = await req.text(); // precisa ser texto bruto para validar a assinatura
    const headerList = headers();

    const svix_id = headerList.get("svix-id");
    const svix_timestamp = headerList.get("svix-timestamp");
    const svix_signature = headerList.get("svix-signature");

    const webhook = new Webhook(CLERK_WEBHOOK_SECRET);

    let evt;
    try {
        evt = webhook.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Falha ao verificar assinatura do webhook:", err);
        return NextResponse.json({ error: "Unauthorized" }, { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
        const user = evt.data;

        const fullName = `${user.first_name || ""} ${
            user.last_name || ""
        }`.trim();
        const email = user.email_addresses?.[0]?.email_address ?? "";
        const userId = user.id;

        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (!existingUser) {
            const { error } = await supabase.from("users").insert({
                user_id: userId,
                full_name: fullName,
                email: email,
                credits: 10,
            });

            if (error) {
                console.error("Erro ao inserir usuário:", error.message);
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Evento ignorado" });
}
