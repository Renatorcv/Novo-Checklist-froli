import React, { useEffect, useState } from "react";
import { workspaceApi } from "../services/api";
import toast from "react-hot-toast";
import { Plus, Users, CheckSquare, Trash2, X } from "lucide-react";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1" });
  const [inviteWs, setInviteWs]     = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [members, setMembers]       = useState([]);

  const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6"];

  useEffect(() => {
    workspaceApi.list().then(setWorkspaces);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const ws = await workspaceApi.create(form);
    setWorkspaces(prev => [ws, ...prev]);
    setShowForm(false);
    toast.success("Workspace criado!");
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir workspace e todos os seus dados?")) return;
    await workspaceApi.remove(id);
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    toast.success("Excluído");
  };

  const openInvite = async (ws) => {
    setInviteWs(ws);
    const m = await workspaceApi.members(ws.id);
    setMembers(m);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await workspaceApi.invite(inviteWs.id, { email: inviteEmail });
      toast.success("Membro adicionado!");
      const m = await workspaceApi.members(inviteWs.id);
      setMembers(m);
      setInviteEmail("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro");
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Novo Workspace
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map(ws => (
          <div key={ws.id} className="card p-5"
            style={{ borderLeft: `4px solid ${ws.color}` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{ws.name}</h3>
                {ws.description && <p className="text-gray-400 text-sm mt-1">{ws.description}</p>}
              </div>
              <span className="badge bg-primary-600/20 text-primary-400 shrink-0">{ws.my_role}</span>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><CheckSquare size={14}/> {ws.checklist_count} checklists</span>
              <span className="flex items-center gap-1"><Users size={14}/> {ws.member_count} membros</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => openInvite(ws)} className="btn-ghost text-sm py-1.5 flex-1 justify-center">
                <Users size={14} /> Membros
              </button>
              {ws.my_role === "owner" && (
                <button onClick={() => handleDelete(ws.id)} className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-dark-600 transition">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Novo Workspace</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5"><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className="input" placeholder="Nome do workspace" required
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <textarea className="input" rows={2} placeholder="Descrição..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <div>
                <label className="text-sm font-medium block mb-2">Cor</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button"
                      onClick={() => setForm({...form, color: c})}
                      className={`w-8 h-8 rounded-full transition-transform ${form.color===c?"scale-125 ring-2 ring-white":""}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {inviteWs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{inviteWs.name} — Membros</h2>
              <button onClick={() => setInviteWs(null)} className="btn-ghost p-1.5"><X size={18}/></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl bg-dark-600">
                  <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                  <span className="badge bg-dark-500 text-gray-400">{m.role}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input className="input flex-1" type="email" placeholder="Email do usuário"
                value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
              <button type="submit" className="btn-primary px-4">Convidar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
