import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId, getToken } = await auth();        
        const token = await getToken({ template: "supabase" });

        const supabase = supabaseClient(token);

        const { data: tasks } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", userId);

        return NextResponse.json(tasks, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Erro ao buscar tarefas" },
            { status: 500 }
        );
    }
}
