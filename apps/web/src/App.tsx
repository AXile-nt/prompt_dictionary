import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import PromptListPage from "./pages/PromptListPage";
import PromptDetailPage from "./pages/PromptDetailPage";
import PromptForm from "./components/prompts/PromptForm";
import SyncPage from "./pages/SyncPage";
import ImportPage from "./pages/ImportPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="prompts" element={<PromptListPage />} />
        <Route path="prompts/:id" element={<PromptDetailPage />} />
        <Route path="prompts/:id/edit" element={<PromptForm mode="edit" />} />
        <Route path="my-prompts" element={<PromptListPage />} />
        <Route path="default-prompts" element={<PromptListPage />} />
        <Route path="favorites" element={<PromptListPage />} />
        <Route path="recent" element={<PromptListPage />} />
        <Route path="categories/:slug" element={<PromptListPage />} />
        <Route path="new" element={<PromptForm mode="create" />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">页面开发中...</p>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
