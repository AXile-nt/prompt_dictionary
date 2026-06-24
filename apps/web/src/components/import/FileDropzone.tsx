import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelected: (filename: string, content: string) => void;
}

export default function FileDropzone({ onFileSelected }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileSelected(file.name, content);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,.md,.txt,.csv"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) readFile(e.target.files[0]); }}
      />
      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="font-medium text-foreground">拖拽文件到此处或点击上传</p>
      <p className="text-sm text-muted-foreground mt-1">支持 JSON, Markdown, TXT, CSV</p>
    </div>
  );
}
