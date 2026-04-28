const router = require("express").Router();
const { authenticate } = require("../middlewares/auth");
const authCtrl = require("../controllers/authController");
const clCtrl   = require("../controllers/checklistController");
const taskCtrl = require("../controllers/taskController");
const wsCtrl   = require("../controllers/workspaceController");

// ── Auth ─────────────────────────────────────────────────────────────────
router.post("/auth/register", authCtrl.register);
router.post("/auth/login",    authCtrl.login);
router.get ("/auth/me",       authenticate, authCtrl.me);
router.put ("/auth/me",       authenticate, authCtrl.updateProfile);

// ── Workspaces ────────────────────────────────────────────────────────────
router.get ("/workspaces",              authenticate, wsCtrl.list);
router.post("/workspaces",              authenticate, wsCtrl.create);
router.put ("/workspaces/:id",          authenticate, wsCtrl.update);
router.delete("/workspaces/:id",        authenticate, wsCtrl.remove);
router.get ("/workspaces/:id/members",  authenticate, wsCtrl.members);
router.post("/workspaces/:id/invite",   authenticate, wsCtrl.invite);

// ── Checklists ────────────────────────────────────────────────────────────
router.get   ("/checklists",              authenticate, clCtrl.list);
router.get   ("/checklists/stats",        authenticate, clCtrl.stats);
router.get   ("/checklists/:id",          authenticate, clCtrl.get);
router.post  ("/checklists",              authenticate, clCtrl.create);
router.put   ("/checklists/:id",          authenticate, clCtrl.update);
router.delete("/checklists/:id",          authenticate, clCtrl.remove);
router.post  ("/checklists/:id/duplicate",authenticate, clCtrl.duplicate);

// ── Tasks ─────────────────────────────────────────────────────────────────
router.get   ("/checklists/:checklistId/tasks",          authenticate, taskCtrl.list);
router.post  ("/checklists/:checklistId/tasks",          authenticate, taskCtrl.create);
router.put   ("/checklists/:checklistId/tasks/reorder",  authenticate, taskCtrl.reorder);
router.put   ("/checklists/:checklistId/tasks/toggle-all", authenticate, taskCtrl.toggleAll);
router.put   ("/tasks/:id",    authenticate, taskCtrl.update);
router.delete("/tasks/:id",    authenticate, taskCtrl.remove);

module.exports = router;
