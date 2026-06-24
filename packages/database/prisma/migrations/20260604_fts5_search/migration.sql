-- P2: Create FTS5 virtual table for full-text search on prompts
-- Note: Prisma uses PascalCase table names for SQLite (e.g., "Prompt" not "prompts")

CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
  title,
  description,
  content,
  content=Prompt,
  content_rowid=rowid
);

-- AFTER INSERT trigger
CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON Prompt BEGIN
  INSERT INTO prompts_fts(rowid, title, description, content)
  VALUES (new.rowid, new.title, new.description, new.content);
END;

-- AFTER UPDATE trigger (delete old + insert new)
CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON Prompt BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description, content)
  VALUES ('delete', old.rowid, old.title, old.description, old.content);
  INSERT INTO prompts_fts(rowid, title, description, content)
  VALUES (new.rowid, new.title, new.description, new.content);
END;

-- AFTER DELETE trigger
CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON Prompt BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description, content)
  VALUES ('delete', old.rowid, old.title, old.description, old.content);
END;

-- Backfill existing data
INSERT INTO prompts_fts(rowid, title, description, content)
SELECT rowid, title, description, content FROM Prompt;
