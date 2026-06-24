import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BookOpen, FileText, Star, Clock, Download, Settings,
  RefreshCw, ChevronDown, ChevronRight, Layers, Plus,
} from "lucide-react";

const mainNavItems = [
  { to: "/", label: "全部提示词", icon: BookOpen, end: true },
  { to: "/default-prompts", label: "默认模板", icon: FileText },
  { to: "/my-prompts", label: "我的提示词", icon: Plus },
  { to: "/favorites", label: "收藏夹", icon: Star },
  { to: "/recent", label: "最近使用", icon: Clock },
];

const bottomNavItems = [
  { to: "/import", label: "导入", icon: Download },
  { to: "/sync", label: "同步", icon: RefreshCw },
  { to: "/settings", label: "设置", icon: Settings },
];

export default function Sidebar() {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [categories, setCategories] = useState<{ slug: string; name: string; promptCount?: number }[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Layers className="mr-2 h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">Prompt 字典</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <span>分类</span>
            {categoriesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {categoriesOpen && (
            <div className="mt-1 space-y-0.5">
              {categories.map((cat) => (
                <NavLink
                  key={cat.slug}
                  to={`/categories/${cat.slug}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                      isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    )
                  }
                >
                  <span>{cat.name}</span>
                  {cat.promptCount !== undefined && (
                    <span className="text-xs text-muted-foreground">{cat.promptCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-border px-2 py-3 space-y-1">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
