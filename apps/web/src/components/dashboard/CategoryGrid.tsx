import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  promptCount: number;
}

export default function CategoryGrid() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FolderOpen className="h-8 w-8 mb-2" />
        <p className="text-sm">No categories</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => navigate(`/categories/${category.slug}`)}
          className="rounded-lg border border-border bg-card p-3 text-left transition-shadow hover:shadow-md"
        >
          <p className="text-sm font-medium text-foreground truncate">{category.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {category.promptCount} {category.promptCount === 1 ? "prompt" : "prompts"}
          </p>
        </button>
      ))}
    </div>
  );
}
