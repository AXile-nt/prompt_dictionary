import { Moon, Sun, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SearchBar from "@/components/search/SearchBar";

export default function TopBar() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <SearchBar />
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title={isDark ? "切换浅色模式" : "切换深色模式"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="设置"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
