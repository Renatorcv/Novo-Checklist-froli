import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Senha mínimo 6 caracteres");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao criar conta");
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
          <p className="text-gray-400 mt-2">Crie sua conta gratuita</p>
        </div>

        <form onSubmit={handle} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nome</label>
            <input className="input" placeholder="Seu nome" required
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
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
            <UserPlus size={18} />
            {loading ? "Criando..." : "Criar Conta"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-4">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary-400 hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
