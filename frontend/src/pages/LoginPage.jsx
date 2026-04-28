import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-3xl font-bold">Checklist<span className="text-primary-400">Pro</span></h1>
          <p className="text-gray-400 mt-2">Entre na sua conta</p>
        </div>

        <form onSubmit={handle} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">E-mail</label>
            <input className="input" type="email" placeholder="seu@email.com" required
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Senha</label>
            <input className="input" type="password" placeholder="••••••••" required
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
            <LogIn size={18} />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-4">
          Não tem conta?{" "}
          <Link to="/register" className="text-primary-400 hover:underline">Criar conta</Link>
        </p>
        <p className="text-center text-gray-600 text-xs mt-4">
          Demo: admin@checklistpro.com / Admin@123
        </p>
      </div>
    </div>
  );
}
