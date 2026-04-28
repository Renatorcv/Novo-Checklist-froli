import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { checklistApi, workspaceApi } from "../services/api";
import toast from "react-hot-toast";
import {
  Plus, Search, MoreVertical, Copy, Trash2, Archive,
  Pin, Calendar, CheckSquare, ArrowRight, X
} from "lucide-react";

const PRIORITY_BADGE = {
  low:      "bg-green-500/20 text-green-400",
  medium:   "bg-yellow-500/20 text-yellow-400",
  high:     "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

function ChecklistCard({ cl, onDelete, onDuplicate, onArchive, onPin }) {
  const [menu, setMenu] = useState(false);
  const pct = cl.total_count > 0
    ? Math.round(((cl.total_count - cl.pending_count) / cl.total_count) * 100) : 0;

  return (
    <div className="card p-5 hover:border-primary-600/50 transition group relative">
      {/* Color bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: cl.cover_color }} />

      <div className="flex items-start justify-between gap-2 mt-1">
        <Link to={`/checklists/${cl.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {cl.pinned && <Pin size={12} className="text-primary-400" />}
            <h3 className="font-semibold truncate group-hover:text-primary-400 transition">{cl.title}</h3>
          </div>
          {cl.description && (
            <p className="text-gray-500 text-sm line-clamp-2 mb-3">{cl.description}</p>
          )}
        </Link>
        <div className="relative shrink-0">
          <button onClick={() => setMenu(!menu)} className="btn-ghost p-1.5">
            <MoreVertical size={16} />
          </button>
          {menu && (
            <div className="absolute right-0 top-8 bg-dark-600 border border-dark-500 rounded-xl shadow-xl z-10 py-1 w-44"
              onMouseLeave={() => setMenu(false)}>
              {[
                { icon: Copy,    label: "Duplicar",  action: () => onDuplicate(cl.id) },
                { icon: Pin,     label: cl.pinned ? "Desafixar" : "Fixar", action: () => onPin(cl) },
                { icon: Archive, label: "Arquivar",  action: () => onArchive(cl.id) },
                { icon: Trash2,  label: "Excluir",   action: () => onDelete(cl.id), danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} onClick={() => { action(); setMenu(false); }}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-dark-500 transition
                    ${danger ? "text-red-400" : "text-gray-300"}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`badge ${PRIORITY_BADGE[cl.priority]}`}>{cl.priority}</span>
        {cl.category && (
          <span className="badge bg-dark-500 text-gray-400">{cl.category}</span>
        )}
        {cl.due_date && (
          <span className="badge bg-dark-500 text-gray-400 flex items-center gap-1">
            <Calendar size={10} />
            {new Date(cl.due_date).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-dark-500 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-primary-500 transition-all"
            style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {Number(cl.total_count) - Number(cl.pending_count)}/{cl.total_count} • {pct}%
        </span>
      </div>
    </div>
  );
}

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm] = useState({
    workspace_id: "", title: "", description: "", category: "",
    priority: "medium", due_date: "", cover_color: "#6366f1"
  });

  const load = async () => {
    setLoading(true);
    const [cl, ws] = await Promise.all([
      checklistApi.list({ search }),
      workspaceApi.list(),
    ]);
    setChecklists(cl);
    setWorkspaces(ws);
    if (!form.workspace_id && ws.length) setForm(f => ({ ...f, workspace_id: ws[0].id }));
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const cl = await checklistApi.create(form);
      setChecklists(prev => [cl, ...prev]);
      setShowForm(false);
      toast.success("Checklist criado!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este checklist?")) return;
    await checklistApi.remove(id);
    setChecklists(prev => prev.filter(c => c.id !== id));
    toast.success("Excluído");
  };

  const handleDuplicate = async (id) => {
    const cl = await checklistApi.duplicate(id);
    setChecklists(prev => [cl, ...prev]);
    toast.success("Duplicado!");
  };

  const handleArchive = async (id) => {
    await checklistApi.update(id, { status: "archived" });
    setChecklists(prev => prev.filter(c => c.id !== id));
    toast.success("Arquivado");
  };

  const handlePin = async (cl) => {
    const updated = await checklistApi.update(cl.id, { pinned: !cl.pinned });
    setChecklists(prev => prev.map(c => c.id === cl.id ? { ...c, pinned: updated.pinned } : c));
  };

  const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444"];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Checklists</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Novo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className="input pl-10" placeholder="Buscar checklists..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : checklists.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {checklists.map(cl => (
            <ChecklistCard key={cl.id} cl={cl}
              onDelete={handleDelete} onDuplicate={handleDuplicate}
              onArchive={handleArchive} onPin={handlePin} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <CheckSquare size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Nenhum checklist encontrado</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">
            <Plus size={16} /> Criar primeiro checklist
          </button>
        </div>
      )}

      {/* Modal Create */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Novo Checklist</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Workspace</label>
                <select className="input" value={form.workspace_id}
                  onChange={e => setForm({...form, workspace_id: e.target.value})} required>
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input className="input" required placeholder="Nome do checklist"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea className="input" rows={2} placeholder="Descrição opcional..."
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <input className="input" placeholder="ex: Product, Dev..."
                    value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridade</label>
                  <select className="input" value={form.priority}
                    onChange={e => setForm({...form, priority: e.target.value})}>
                    {["low","medium","high","critical"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Prazo</label>
                  <input className="input" type="date"
                    value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor</label>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {COLORS.map(c => (
                      <button key={c} type="button"
                        onClick={() => setForm({...form, cover_color: c})}
                        className={`w-7 h-7 rounded-full transition-transform ${form.cover_color===c?"scale-125 ring-2 ring-white":""}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
