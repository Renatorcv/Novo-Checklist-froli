require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function migrate() {
  const client = await pool.connect();
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        run_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const dir = __dirname;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        "SELECT id FROM _migrations WHERE filename = $1",
        [file]
      );
      if (rows.length) {
        console.log(`⏭  Already applied: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations(filename) VALUES($1)", [file]);
      await client.query("COMMIT");
      console.log(`✅  Applied: ${file}`);
    }
    console.log("🎉  Migrations complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
