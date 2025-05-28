import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function FileInput({ handleFileChange }) {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState(null);

    const handleChange = (event) => {
        if (event.target.files.length > 0) {
            setFileName(event.target.files[0].name);
        }
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(event) => {
                    handleChange(event);
                    handleFileChange(event);
                }}
            />

            <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="w-4 h-4 mr-1" /> Selecionar Arquivo
            </Button>

            {fileName && (
                <p className="text-sm text-gray-500 mt-2.5">{fileName}</p>
            )}
        </div>
    );
}
