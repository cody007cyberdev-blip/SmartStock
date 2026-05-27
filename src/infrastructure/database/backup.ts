import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

export function createBackup() {
  const backupDir = join(process.cwd(), "data", "backups");
  
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = join(backupDir, `smartstock-backup-${timestamp}.db`);
  const dbFile = join(process.cwd(), "smartstock.db");

  if (existsSync(dbFile)) {
    try {
      execSync(`cp ${dbFile} ${backupFile}`);
      console.log(`✅ Backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error("❌ Failed to create backup:", error);
      throw error;
    }
  } else {
    console.warn("⚠️ No database file found to backup.");
    return null;
  }
}
