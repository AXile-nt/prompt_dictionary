const API_BASE = "/api";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export interface PromptListParams {
  q?: string;
  category?: string;
  source?: string;
  tags?: string;
  favorite?: boolean;
  sort?: "best" | "updated" | "usage" | "created";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const api = {
  getPrompts: (params: PromptListParams = {}) =>
    request<any[]>(`/prompts${buildQueryString(params)}`),

  getPrompt: (id: string) =>
    request<any>(`/prompts/${id}`),

  createPrompt: (data: any) =>
    request<any>("/prompts", { method: "POST", body: JSON.stringify(data) }),

  updatePrompt: (id: string, data: any) =>
    request<any>(`/prompts/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deletePrompt: (id: string) =>
    request<any>(`/prompts/${id}`, { method: "DELETE" }),

  copyPrompt: (id: string) =>
    request<any>(`/prompts/${id}/copy`, { method: "POST" }),

  toggleFavorite: (id: string) =>
    request<any>(`/prompts/${id}/favorite`, { method: "POST" }),

  recordUsage: (id: string) =>
    request<any>(`/prompts/${id}/use`, { method: "POST" }),
};
