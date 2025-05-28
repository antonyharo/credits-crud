import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req) {
    try {
        const { id } = await req.json();
        const { userId, getToken } = await auth(req);

        if (!userId) {
            return NextResponse.json(
                { error: "Usuário não autenticado" },
                { status: 401 }
            );
        }

        const taskId = Number(id);
        if (isNaN(taskId)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const token = await getToken({ template: "supabase" });
        const supabase = supabaseClient(token);

        // Verifica se a tarefa pertence ao usuário antes de deletar
        const { data: existingTask, error: fetchError } = await supabase
            .from("tasks")
            .select("user_id")
            .eq("id", taskId)
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

        // Deleta a tarefa
        const { error: deleteError } = await supabase
            .from("tasks")
            .delete()
            .eq("id", taskId);

        if (deleteError) {
            return NextResponse.json(
                { error: `Erro ao deletar: ${deleteError.message}` },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Tarefa deletada com sucesso" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Erro ao processar requisição: " + error.message },
            { status: 500 }
        );
    }
}
