import { useState } from "react";
import FileDropzone from "@/components/import/FileDropzone";
import ImportPreview from "@/components/import/ImportPreview";
import { AlertCircle, CheckCircle } from "lucide-react";

type ImportStep = "upload" | "preview" | "importing" | "done";

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);

  const handleFileSelected = async (filename: string, content: string) => {
    setErrors([]);
    try {
      const res = await fetch("/api/import/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setParsedItems(data.data.items);
        setJobId(data.data.job.id);
        if (data.data.errors?.length) setErrors(data.data.errors);
        setStep("preview");
      } else {
        setErrors([data.error || "解析失败"]);
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "上传失败"]);
    }
  };

  const handleConfirm = async (items: any[]) => {
    setStep("importing");
    try {
      const res = await fetch(`/api/import/${jobId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setStep("done");
      } else {
        setErrors([data.error || "导入失败"]);
        setStep("preview");
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "导入失败"]);
      setStep("preview");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setParsedItems([]);
    setJobId("");
    setErrors([]);
    setResult(null);
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-6">导入提示词</h2>

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 mb-4">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{err}</p>
            </div>
          ))}
        </div>
      )}

      {step === "upload" && <FileDropzone onFileSelected={handleFileSelected} />}

      {step === "preview" && (
        <ImportPreview items={parsedItems} onConfirm={handleConfirm} onCancel={handleReset} loading={false} />
      )}

      {step === "importing" && (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">正在导入...</p>
        </div>
      )}

      {step === "done" && result && (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-medium mb-2">导入完成</h3>
          <p className="text-sm text-muted-foreground">
            成功导入 {result.imported} 条{result.failed > 0 ? `，${result.failed} 条失败` : ""}
          </p>
          <button onClick={handleReset} className="mt-4 h-9 rounded-md border border-input px-4 text-sm hover:bg-accent">
            继续导入
          </button>
        </div>
      )}
    </div>
  );
}
