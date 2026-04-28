import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import toast from "react-hot-toast";
import { Save, User } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm]   = useState({ name: user?.name || "", avatar_url: user?.avatar_url || "" });
  const [saving, setSaving] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.update(form);
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-700 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-gray-400">{user?.email}</p>
            <span className="badge bg-primary-600/20 text-primary-400 mt-1 inline-block">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handle} className="space-y-3 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input className="input" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL do Avatar</label>
            <input className="input" placeholder="https://..." value={form.avatar_url}
              onChange={e => setForm({...form, avatar_url: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              <Save size={16} /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => { logout(); window.location.href="/login"; }}
              className="bg-red-600/20 text-red-400 hover:bg-red-600/30 font-medium px-4 py-2 rounded-xl transition flex items-center gap-2">
              Sair
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
