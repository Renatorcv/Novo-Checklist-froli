import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  update: (data) => api.put("/auth/me", data).then((r) => r.data),
};

// ── Workspaces ────────────────────────────────────────────────────────────
export const workspaceApi = {
  list: () => api.get("/workspaces").then((r) => r.data),
  create: (data) => api.post("/workspaces", data).then((r) => r.data),
  update: (id, data) => api.put(`/workspaces/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/workspaces/${id}`).then((r) => r.data),
  members: (id) => api.get(`/workspaces/${id}/members`).then((r) => r.data),
  invite: (id, data) => api.post(`/workspaces/${id}/invite`, data).then((r) => r.data),
};

// ── Checklists ────────────────────────────────────────────────────────────
export const checklistApi = {
  list: (params) => api.get("/checklists", { params }).then((r) => r.data),
  stats: () => api.get("/checklists/stats").then((r) => r.data),
  get: (id) => api.get(`/checklists/${id}`).then((r) => r.data),
  create: (data) => api.post("/checklists", data).then((r) => r.data),
  update: (id, data) => api.put(`/checklists/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/checklists/${id}`).then((r) => r.data),
  duplicate: (id) => api.post(`/checklists/${id}/duplicate`).then((r) => r.data),
};

// ── Tasks ─────────────────────────────────────────────────────────────────
export const taskApi = {
  list: (checklistId) => api.get(`/checklists/${checklistId}/tasks`).then((r) => r.data),
  create: (checklistId, data) => api.post(`/checklists/${checklistId}/tasks`, data).then((r) => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
  reorder: (checklistId, tasks) => api.put(`/checklists/${checklistId}/tasks/reorder`, { tasks }).then((r) => r.data),
  toggleAll: (checklistId, completed) => api.put(`/checklists/${checklistId}/tasks/toggle-all`, { completed }).then((r) => r.data),
};

export default api;
