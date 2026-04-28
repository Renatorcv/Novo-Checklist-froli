const { query } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.list = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT w.*, wm.role AS my_role,
         COUNT(DISTINCT wm2.user_id) AS member_count,
         COUNT(DISTINCT c.id) AS checklist_count
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id=w.id AND wm.user_id=$1
       LEFT JOIN workspace_members wm2 ON wm2.workspace_id=w.id
       LEFT JOIN checklists c ON c.workspace_id=w.id AND c.status='active'
       GROUP BY w.id, wm.role
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const id = uuidv4();
    const { rows } = await query(
      "INSERT INTO workspaces(id,name,description,owner_id,color) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [id, name, description, req.user.id, color||"#6366f1"]
    );
    await query(
      "INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,'owner')",
      [id, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const { rows } = await query(
      "UPDATE workspaces SET name=$1,description=$2,color=$3 WHERE id=$4 RETURNING *",
      [name, description, color, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await query("DELETE FROM workspaces WHERE id=$1 AND owner_id=$2", [req.params.id, req.user.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.members = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, wm.role, wm.joined_at
       FROM workspace_members wm
       JOIN users u ON u.id=wm.user_id
       WHERE wm.workspace_id=$1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.invite = async (req, res) => {
  try {
    const { email, role = "member" } = req.body;
    const { rows: users } = await query("SELECT id FROM users WHERE email=$1", [email]);
    if (!users.length) return res.status(404).json({ error: "User not found" });
    await query(
      "INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
      [req.params.id, users[0].id, role]
    );
    res.json({ message: "Invited" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
