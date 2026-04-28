import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { checklistApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CheckSquare, Clock, AlertTriangle, TrendingUp, ArrowRight, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PRIORITY_COLORS = { low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-3xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]         = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([checklistApi.stats(), checklistApi.list({ status: "active" })])
      .then(([s, cl]) => { setStats(s); setChecklists(cl); })
      .finally(() => setLoading(false));
  }, []);

  const chartData = checklists.slice(0, 6).map(c => ({
    name: c.title.substring(0, 12) + "…",
    total: Number(c.total_count),
    pending: Number(c.pending_count),
    done: Number(c.total_count) - Number(c.pending_count),
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Olá, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-gray-400 mt-1">Aqui está o resumo das suas tarefas</p>
        </div>
        <Link to="/checklists" className="btn-primary">
          <Plus size={18} /> Novo Checklist
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare}  label="Total" value={stats?.total || 0}
          color="bg-primary-600" sub="checklists ativos" />
        <StatCard icon={TrendingUp}   label="Em Progresso" value={stats?.in_progress || 0}
          color="bg-blue-600" sub="em andamento" />
        <StatCard icon={CheckSquare}  label="Concluídos" value={stats?.completed || 0}
          color="bg-green-600" sub="finalizados" />
        <StatCard icon={AlertTriangle} label="Atrasados" value={stats?.overdue || 0}
          color="bg-red-600" sub="precisam atenção" />
      </div>

      {/* Chart + Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Progresso por Checklist</h2>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={12}>
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#1c1c1f", border: "1px solid #2e2e33", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="done" fill="#6366f1" name="Concluídas" radius={[4,4,0,0]} />
                <Bar dataKey="pending" fill="#374151" name="Pendentes" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              Sem dados ainda
            </div>
          )}
        </div>

        {/* Recent Checklists */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recentes</h2>
            <Link to="/checklists" className="text-primary-400 text-sm flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {checklists.slice(0, 5).map(cl => {
              const pct = cl.total_count > 0
                ? Math.round(((cl.total_count - cl.pending_count) / cl.total_count) * 100)
                : 0;
              return (
                <Link key={cl.id} to={`/checklists/${cl.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-600 transition group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: cl.cover_color + "33", color: cl.cover_color }}>
                    {cl.title[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cl.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-dark-500 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-primary-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{pct}%</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-400" />
                </Link>
              );
            })}
            {!checklists.length && (
              <p className="text-gray-500 text-sm text-center py-6">
                Nenhum checklist ainda.{" "}
                <Link to="/checklists" className="text-primary-400 hover:underline">Criar agora!</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
