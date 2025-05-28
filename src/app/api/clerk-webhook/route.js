import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error(
            "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env"
        );
    }

    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error occurred -- no svix headers", {
            status: 400,
        });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Error verifying webhook", {
            status: 400,
        });
    }

    const eventType = evt.type;

    try {
        if (eventType === "user.created" || eventType === "user.updated") {
            const { id, email_addresses, first_name, last_name } = evt.data;
            const email = email_addresses[0].email_address;
            const fullName = `${first_name} ${last_name}`;

            // Upsert user data into Supabase
            const { error } = await supabase.from("users").upsert(
                {
                    user_id: id,
                    email,
                    full_name: fullName,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id",
                }
            );

            if (error) throw error;
        } else if (eventType === "user.deleted") {
            const { id } = evt.data;

            // Delete user from Supabase
            const { error } = await supabase
                .from("users")
                .delete()
                .eq("user_id", id);

            if (error) throw error;
        }

        return new Response("", { status: 200 });
    } catch (error) {
        console.error("Error handling webhook:", error);
        return new Response("Error handling webhook", { status: 500 });
    }
}
