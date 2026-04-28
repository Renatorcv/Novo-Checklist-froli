const { query } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.list = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*, u.name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.checklist_id=$1
       ORDER BY t.position ASC, t.created_at ASC`,
      [req.params.checklistId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, notes, priority, due_date, assigned_to, parent_id, position } = req.body;
    const id = uuidv4();
    const { rows } = await query(
      `INSERT INTO tasks(id,checklist_id,parent_id,assigned_to,title,notes,priority,due_date,position)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, req.params.checklistId, parent_id||null, assigned_to||null, title, notes, priority||"medium", due_date||null, position||0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const allowed = ["title","notes","priority","due_date","assigned_to","position","completed","parent_id"];
    const updates = [];
    const params = [];
    let idx = 1;
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        updates.push(`${f}=$${idx}`);
        params.push(req.body[f]);
        idx++;
      }
    }
    // auto-set completed_at
    if (req.body.completed !== undefined) {
      updates.push(`completed_at=$${idx}`);
      params.push(req.body.completed ? new Date() : null);
      idx++;
    }
    if (!updates.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE tasks SET ${updates.join(",")} WHERE id=$${idx} RETURNING *`,
      params
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await query("DELETE FROM tasks WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reorder = async (req, res) => {
  try {
    // req.body.tasks = [{id, position}]
    const client = (await require("../config/db").pool.connect());
    await client.query("BEGIN");
    for (const { id, position } of req.body.tasks) {
      await client.query("UPDATE tasks SET position=$1 WHERE id=$2", [position, id]);
    }
    await client.query("COMMIT");
    client.release();
    res.json({ message: "Reordered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleAll = async (req, res) => {
  try {
    const { completed } = req.body;
    await query(
      `UPDATE tasks SET completed=$1, completed_at=$2 WHERE checklist_id=$3`,
      [completed, completed ? new Date() : null, req.params.checklistId]
    );
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
