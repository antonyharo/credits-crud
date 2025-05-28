import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import crypto from "crypto";
import path from "path";

const generateFilePath = (file) => {
    const now = new Date();
    const [day, month, year] = now.toLocaleDateString("pt-BR").split("/");
    const ext = path.extname(file.name);
    const baseName = path
        .basename(file.name, ext)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    return `uploads/${year}/${month}/${day}/${crypto.randomUUID()}-${baseName}${ext}`;
};

const uploadFile = async (file, token) => {
    try {
        if (!file) throw new Error("Arquivo inválido.");

        const supabase = supabaseClient(token);

        const filePath = generateFilePath(file);
        const { data, error } = await supabase.storage
            .from("uploads")
            .upload(filePath, file);

        if (error)
            throw new Error(
                `Erro ao fazer upload do arquivo: ${error.message}`
            );

        return supabase.storage.from("uploads").getPublicUrl(filePath).data
            .publicUrl;
    } catch (error) {
        console.error("Erro no upload:", error);
        throw error;
    }
};

export async function POST(req) {
    try {
        console.log("Recebendo requisição para salvar análise...");

        const formData = await req.formData();
        const token = formData.get("token");
        const userId = formData.get("userId");
        const file = formData.get("file");

        if (!userId) {
            return NextResponse.json(
                { error: "Usuário não autenticado." },
                { status: 401 }
            );
        }

        console.log("Dados validados. Processando upload do arquivo...");
        const fileUrl = file ? await uploadFile(file, token) : null;

        console.log("Upload concluído.", fileUrl);

        return NextResponse.json(
            { fileUrl, message: "Upload realizado com sucesso." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erro inesperado:", error);
        return NextResponse.json(
            { error: "Erro interno no servidor." },
            { status: 500 }
        );
    }
}
