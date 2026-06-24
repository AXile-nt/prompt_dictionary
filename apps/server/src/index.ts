import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler";
import promptsRouter from "./routes/prompts";
import searchRouter from "./routes/search";
import categoriesRouter from "./routes/categories";
import syncRouter from "./routes/sync";
import importRouter from "./routes/import";
import settingsRouter from "./routes/settings";

dotenv.config({ path: "../../.env" });

const app: express.Application = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/prompts", promptsRouter);
app.use("/api/search", searchRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/sync", syncRouter);
app.use("/api/import", importRouter);
app.use("/api/settings", settingsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
