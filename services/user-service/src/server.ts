import app from "./app";
import { pool } from "./db";
import fs from "fs";

const PORT = process.env.PORT || 4001;

(async () => {
  try {
    const initSql = fs.readFileSync("../init/init.sql", "utf8");
    console.log(initSql)
    await pool.query(initSql);
    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ Failed to initialize DB:", err);
  }
})();

app.listen(PORT, () => console.log(`User-service running on port ${PORT} 🚀`));