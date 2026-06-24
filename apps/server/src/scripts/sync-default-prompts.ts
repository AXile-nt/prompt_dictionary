import { prisma } from "@prompt-dictionary/database";
import dotenv from "dotenv";
import { syncDefaultPrompts } from "../sync/prompts-chat";

dotenv.config({ path: "../../.env" });

syncDefaultPrompts()
  .then((result) => {
    console.log(JSON.stringify(result.stats, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
