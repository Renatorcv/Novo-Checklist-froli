import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, CheckSquare, FolderOpen, User,
  LogOut, Menu, X, ChevronRight, Bell, Search
} from "lucide-react";

const nav = [
  { to: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { to: "/checklists",  icon: CheckSquare,     label: "Checklists" },
  { to: "/workspaces",  icon: FolderOpen,      label: "Workspaces" },
  { to: "/profile",     icon: User,            label: "Perfil" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        bg-dark-800 border-r border-dark-600
        transition-all duration-300
        ${open ? "w-64" : "w-16"} md:w-64 md:relative
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-600">
          <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center text-lg shrink-0">✅</div>
          <span className={`font-bold text-white text-lg whitespace-nowrap ${open ? "block" : "hidden"} md:block`}>
            Checklist<span className="text-primary-400">Pro</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                 ${isActive
                   ? "bg-primary-600/20 text-primary-400"
                   : "text-gray-400 hover:bg-dark-600 hover:text-white"}`
              }
            >
              <Icon size={20} className="shrink-0" />
              <span className={`font-medium whitespace-nowrap ${open ? "block" : "hidden"} md:block`}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-dark-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 ${open ? "block" : "hidden"} md:block`}>
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost p-2 rounded-lg hidden md:flex">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-4 px-4 border-b border-dark-600 bg-dark-800/80 backdrop-blur">
          <button onClick={() => setOpen(!open)} className="md:hidden btn-ghost p-2">
            {open ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <div className="flex-1" />
          <button className="btn-ghost p-2">
            <Bell size={18} />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
