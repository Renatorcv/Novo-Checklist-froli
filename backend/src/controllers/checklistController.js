const { query } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// ── Helpers ────────────────────────────────────────────────────────────────
async function getUserWorkspaces(userId) {
  const { rows } = await query(
    `SELECT workspace_id FROM workspace_members WHERE user_id=$1`,
    [userId]
  );
  return rows.map((r) => r.workspace_id);
}

// ── CRUD Checklists ────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const wsIds = await getUserWorkspaces(req.user.id);
    if (!wsIds.length) return res.json([]);
    const { search, category, priority, status = "active" } = req.query;

    let sql = `
      SELECT c.*, 
        COUNT(t.id) FILTER (WHERE t.completed=false) AS pending_count,
        COUNT(t.id) AS total_count,
        u.name AS creator_name,
        w.name AS workspace_name
      FROM checklists c
      LEFT JOIN tasks t ON t.checklist_id = c.id
      LEFT JOIN users u ON u.id = c.created_by
      LEFT JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.workspace_id = ANY($1) AND c.status = $2
    `;
    const params = [wsIds, status];
    let idx = 3;

    if (search) { sql += ` AND c.title ILIKE $${idx}`; params.push(`%${search}%`); idx++; }
    if (category) { sql += ` AND c.category = $${idx}`; params.push(category); idx++; }
    if (priority) { sql += ` AND c.priority = $${idx}`; params.push(priority); idx++; }

    sql += ` GROUP BY c.id, u.name, w.name ORDER BY c.pinned DESC, c.created_at DESC`;

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT c.*, u.name AS creator_name, w.name AS workspace_name
       FROM checklists c
       LEFT JOIN users u ON u.id = c.created_by
       LEFT JOIN workspaces w ON w.id = c.workspace_id
       WHERE c.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { workspace_id, title, description, category, priority, due_date, cover_color } = req.body;
    const id = uuidv4();
    const { rows } = await query(
      `INSERT INTO checklists(id,workspace_id,created_by,title,description,category,priority,due_date,cover_color)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, workspace_id, req.user.id, title, description, category, priority || "medium", due_date, cover_color || "#6366f1"]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const fields = ["title","description","category","priority","due_date","cover_color","pinned","status"];
    const updates = [];
    const params = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f}=$${idx}`);
        params.push(req.body[f]);
        idx++;
      }
    }
    if (!updates.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE checklists SET ${updates.join(",")} WHERE id=$${idx} RETURNING *`,
      params
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await query("DELETE FROM checklists WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const { rows: cl } = await query("SELECT * FROM checklists WHERE id=$1", [req.params.id]);
    if (!cl.length) return res.status(404).json({ error: "Not found" });
    const orig = cl[0];
    const newId = uuidv4();
    const { rows: newCl } = await query(
      `INSERT INTO checklists(id,workspace_id,created_by,title,description,category,priority,cover_color)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [newId, orig.workspace_id, req.user.id, `${orig.title} (copy)`, orig.description, orig.category, orig.priority, orig.cover_color]
    );
    // Copy tasks
    const { rows: tasks } = await query("SELECT * FROM tasks WHERE checklist_id=$1 ORDER BY position", [orig.id]);
    for (const t of tasks) {
      await query(
        `INSERT INTO tasks(id,checklist_id,title,notes,priority,position) VALUES($1,$2,$3,$4,$5,$6)`,
        [uuidv4(), newId, t.title, t.notes, t.priority, t.position]
      );
    }
    res.status(201).json(newCl[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Stats ──────────────────────────────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const wsIds = await getUserWorkspaces(req.user.id);
    if (!wsIds.length) return res.json({ total: 0, completed: 0, pending: 0, overdue: 0 });
    const { rows } = await query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE pending_count=0 AND total_count>0) AS completed,
        COUNT(*) FILTER (WHERE pending_count>0) AS in_progress,
        COUNT(*) FILTER (WHERE due_date < NOW() AND pending_count>0) AS overdue
       FROM (
         SELECT c.id, c.due_date,
           COUNT(t.id) FILTER (WHERE t.completed=false) AS pending_count,
           COUNT(t.id) AS total_count
         FROM checklists c
         LEFT JOIN tasks t ON t.checklist_id=c.id
         WHERE c.workspace_id=ANY($1) AND c.status='active'
         GROUP BY c.id
       ) s`,
      [wsIds]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
