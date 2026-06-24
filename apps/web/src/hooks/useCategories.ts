import { useState, useEffect, useCallback } from "react";

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string, slug: string, description?: string) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description }),
    });
    const data = await res.json();
    if (data.success) {
      await fetchCategories();
      return data.data;
    }
    throw new Error(data.error || "Failed to create category");
  };

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      await fetchCategories();
      return true;
    }
    throw new Error(data.error || "Failed to delete category");
  };

  return { categories, loading, refetch: fetchCategories, createCategory, deleteCategory };
}
