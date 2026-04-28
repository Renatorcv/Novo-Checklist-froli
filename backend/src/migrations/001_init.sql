-- ============================================================
-- Migration 001 – Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  avatar_url  TEXT,
  role        VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  color       VARCHAR(20) DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Checklists
CREATE TABLE IF NOT EXISTS checklists (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES users(id),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  category     VARCHAR(80),
  priority     VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status       VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active','archived','template')),
  due_date     DATE,
  cover_color  VARCHAR(20) DEFAULT '#6366f1',
  pinned       BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_to  UUID REFERENCES users(id) ON DELETE SET NULL,
  title        VARCHAR(500) NOT NULL,
  notes        TEXT,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  due_date     TIMESTAMPTZ,
  priority     VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  position     INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(60) NOT NULL,
  color        VARCHAR(20) DEFAULT '#6366f1',
  UNIQUE (workspace_id, name)
);

-- Checklist Tags (many-to-many)
CREATE TABLE IF NOT EXISTS checklist_tags (
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  tag_id       UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (checklist_id, tag_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type  VARCHAR(30),
  entity_id    UUID,
  action       VARCHAR(50),
  payload      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checklists_workspace ON checklists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_checklist ON tasks(checklist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activity_workspace ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_workspaces_upd BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_checklists_upd BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_tasks_upd BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
