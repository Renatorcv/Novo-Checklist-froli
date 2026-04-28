const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "checklistuser",
  password: process.env.DB_PASSWORD || "checklistpass",
  database: process.env.DB_NAME || "checklistpro",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = { pool, query: (text, params) => pool.query(text, params) };
