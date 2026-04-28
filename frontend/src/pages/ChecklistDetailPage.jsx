import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { checklistApi, taskApi } from "../services/api";
import toast from "react-hot-toast";
import { Plus, Trash2, ChevronLeft, CheckSquare, Square, MoreVertical, X, GripVertical } from "lucide-react";

const PRIORITY_DOT = { low: "bg-green-500", medium: "bg-yellow-500", high: "bg-orange-500", critical: "bg-red-500" };

function TaskItem({ task, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(task.title);

  const save = () => {
    if (title.trim() && title !== task.title) onUpdate(task.id, { title });
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl group hover:bg-dark-600 transition
      ${task.completed ? "opacity-60" : ""}`}>
      <button onClick={() => onToggle(task)} className="shrink-0">
        {task.completed
          ? <CheckSquare size={20} className="text-primary-500" />
          : <Square size={20} className="text-gray-500" />}
      </button>
      {editing ? (
        <input className="input flex-1 py-1 text-sm" value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={save} onKeyDown={e => e.key==="Enter" && save()} autoFocus />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 text-sm cursor-text ${task.completed ? "line-through text-gray-500" : ""}`}>
          {task.title}
        </span>
      )}
      <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
      <button onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition p-1">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function ChecklistDetailPage() {
  const { id } = useParams();
  const [checklist, setChecklist] = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [newTask, setNewTask]     = useState("");
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    const [cl, ts] = await Promise.all([checklistApi.get(id), taskApi.list(id)]);
    setChecklist(cl); setTasks(ts);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const t = await taskApi.create(id, { title: newTask, position: tasks.length });
    setTasks(prev => [...prev, t]);
    setNewTask("");
  };

  const toggleTask = async (task) => {
    const updated = await taskApi.update(task.id, { completed: !task.completed });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  };

  const deleteTask = async (taskId) => {
    await taskApi.remove(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateTask = async (taskId, data) => {
    const updated = await taskApi.update(taskId, data);
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
  };

  const toggleAll = async (completed) => {
    await taskApi.toggleAll(id, completed);
    setTasks(prev => prev.map(t => ({ ...t, completed })));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!checklist) return <div className="text-gray-400">Checklist não encontrado</div>;

  const completedCount = tasks.filter(t => t.completed).length;
  const pct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <Link to="/checklists" className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition">
          <ChevronLeft size={16} /> Voltar
        </Link>
        <div className="card p-6" style={{ borderTop: `4px solid ${checklist.cover_color}` }}>
          <h1 className="text-2xl font-bold">{checklist.title}</h1>
          {checklist.description && (
            <p className="text-gray-400 mt-2">{checklist.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 bg-dark-500 rounded-full h-2">
              <div className="h-2 rounded-full bg-primary-500 transition-all duration-500"
                style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-medium">{completedCount}/{tasks.length}</span>
            <span className="text-sm text-primary-400 font-bold">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {tasks.length > 0 && (
        <div className="flex gap-2">
          <button onClick={() => toggleAll(true)}
            className="btn-ghost text-sm py-1.5">
            <CheckSquare size={14} /> Marcar todos
          </button>
          <button onClick={() => toggleAll(false)}
            className="btn-ghost text-sm py-1.5">
            <Square size={14} /> Desmarcar todos
          </button>
        </div>
      )}

      {/* Tasks */}
      <div className="card divide-y divide-dark-600">
        {tasks.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <CheckSquare size={40} className="mx-auto mb-3 text-gray-600" />
            <p>Nenhuma tarefa ainda. Adicione abaixo!</p>
          </div>
        )}
        {tasks.map(t => (
          <TaskItem key={t.id} task={t}
            onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} />
        ))}
      </div>

      {/* Add Task */}
      <form onSubmit={addTask} className="flex gap-3">
        <input className="input flex-1" placeholder="Adicionar tarefa… (Enter para salvar)"
          value={newTask} onChange={e => setNewTask(e.target.value)} />
        <button type="submit" disabled={!newTask.trim()} className="btn-primary px-5">
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
}
