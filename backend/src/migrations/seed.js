require("dotenv").config();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/db");

async function seed() {
  const client = await pool.connect();
  try {
    const adminId = uuidv4();
    const memberId = uuidv4();
    const wsId = uuidv4();

    const hashedAdmin = await bcrypt.hash("Admin@123", 12);
    const hashedMember = await bcrypt.hash("Member@123", 12);

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO users(id,name,email,password,role) VALUES($1,$2,$3,$4,'admin') ON CONFLICT DO NOTHING`,
      [adminId, "Admin User", "admin@checklistpro.com", hashedAdmin]
    );
    await client.query(
      `INSERT INTO users(id,name,email,password,role) VALUES($1,$2,$3,$4,'member') ON CONFLICT DO NOTHING`,
      [memberId, "Jane Member", "jane@checklistpro.com", hashedMember]
    );

    await client.query(
      `INSERT INTO workspaces(id,name,description,owner_id,color) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [wsId, "My Workspace", "Default workspace", adminId, "#6366f1"]
    );
    await client.query(
      `INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,'owner') ON CONFLICT DO NOTHING`,
      [wsId, adminId]
    );
    await client.query(
      `INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,'member') ON CONFLICT DO NOTHING`,
      [wsId, memberId]
    );

    const clId = uuidv4();
    await client.query(
      `INSERT INTO checklists(id,workspace_id,created_by,title,description,category,priority) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [clId, wsId, adminId, "🚀 Project Launch Checklist", "Everything needed to launch", "Product", "high"]
    );

    const taskTitles = [
      "Define project scope and goals",
      "Design UI mockups",
      "Set up CI/CD pipeline",
      "Write unit tests",
      "Deploy to staging environment",
      "Perform QA review",
      "Go live! 🎉",
    ];
    for (let i = 0; i < taskTitles.length; i++) {
      await client.query(
        `INSERT INTO tasks(id,checklist_id,title,position,completed) VALUES($1,$2,$3,$4,$5)`,
        [uuidv4(), clId, taskTitles[i], i, i < 3]
      );
    }

    await client.query("COMMIT");
    console.log("🌱  Seed complete.");
    console.log("  admin@checklistpro.com / Admin@123");
    console.log("  jane@checklistpro.com  / Member@123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
