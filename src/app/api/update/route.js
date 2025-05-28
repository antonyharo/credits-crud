import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function PUT(req) {
    try {
        const { id, title, description, completed } = await req.json();
        const { userId, getToken } = await auth(req);

        if (!userId) {
            return NextResponse.json(
                { error: "Usuário não autenticado" },
                { status: 401 }
            );
        }

        const token = await getToken({ template: "supabase" });
        const supabase = supabaseClient(token);

        // Verifica se a tarefa pertence ao usuário autenticado
        const { data: existingTask, error: fetchError } = await supabase
            .from("tasks")
            .select("user_id")
            .eq("id", id)
            .single();

        if (fetchError || !existingTask) {
            return NextResponse.json(
                { error: "Tarefa não encontrada" },
                { status: 404 }
            );
        }

        if (existingTask.user_id !== userId) {
            return NextResponse.json(
                { error: "Usuário não autorizado" },
                { status: 403 }
            );
        }

        // Atualiza a tarefa
        const { data, error } = await supabase
            .from("tasks")
            .update({ title, description, completed })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: `Erro ao atualizar: ${error.message}` },
                { status: 400 }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Erro ao processar requisição" },
            { status: 500 }
        );
    }
}
