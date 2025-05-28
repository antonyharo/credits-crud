"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileInput from "@/components/file-input";

export default function Home() {
    const { userId, getToken } = useAuth();
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    // Função para adicionar ou editar uma task
    const handleUpload = async () => {
        setLoading(true);
        
        const token = await getToken({ template: "supabase" });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        formData.append("token", token);

        // Editando uma tarefa existente
        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log(data);

            if (response.ok) {
                setSuccessMessage("File uploaded successfully!");
            } else {
                setErrorMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            console.log(error);
            setErrorMessage(`Error while uploading.`);
        }

        setLoading(false);
        setTimeout(() => setSuccessMessage(""), 3000);
        setTimeout(() => setErrorMessage(""), 3000);
    };

    return (
        <div className="p-6 mx-auto space-y-4 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold mb-1">Upload a file here</h1>

            <FileInput handleFileChange={handleFileChange} />

            <Button
                variant="default"
                size="lg"
                onClick={handleUpload}
                className="text-1xl font-medium"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" />
                        Analisando...
                    </>
                ) : (
                    <>Upload</>
                )}
            </Button>

            {successMessage && (
                <div className="bg-green-100 text-green-700 p-2 rounded">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-100 text-red-700 p-2 rounded">
                    {errorMessage}
                </div>
            )}
        </div>
    );
}
