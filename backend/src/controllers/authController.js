const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../config/db");

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length)
      return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const { rows } = await query(
      "INSERT INTO users(id,name,email,password) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,created_at",
      [id, name, email, hash]
    );
    const user = rows[0];
    // Create default workspace
    const wsId = uuidv4();
    await query(
      "INSERT INTO workspaces(id,name,owner_id) VALUES($1,$2,$3)",
      [wsId, `${name}'s Workspace`, id]
    );
    await query(
      "INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,'owner')",
      [wsId, id]
    );

    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      "SELECT id,name,email,password,role,avatar_url FROM users WHERE email=$1",
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid credentials" });

    const { password: _, ...safeUser } = user;
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  const { rows } = await query(
    "SELECT id,name,email,role,avatar_url,created_at FROM users WHERE id=$1",
    [req.user.id]
  );
  res.json(rows[0] || {});
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    const { rows } = await query(
      "UPDATE users SET name=$1, avatar_url=$2 WHERE id=$3 RETURNING id,name,email,role,avatar_url",
      [name, avatar_url, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
