import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Kanban, 
  Link2, 
  FileText, 
  ListChecks, 
  Code, 
  ShieldCheck, 
  Users, 
  Settings,
  History,
  FlaskConical,
  Menu,
  Sun,
  Moon
} from "lucide-react";
import { useAppStore } from "../store/AppContext";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useAppStore();

  const menu = [
    { name: "dashboard", label: "Dashboard",   path: "/",          icon: LayoutDashboard },
    { name: "jira",      label: "Jira Sync",    path: "/jira",      icon: Kanban },
    { name: "url",       label: "URL Analyzer", path: "/url",       icon: Link2 },
    { name: "stories",   label: "User Stories",      path: "/stories",   icon: Users },
    { name: "testplan",  label: "Test Plans",         path: "/testplans", icon: FileText },
    { name: "scenarios", label: "Test Scenarios",     path: "/scenarios", icon: FlaskConical },
    { name: "testcases", label: "Test Cases",  path: "/testcases", icon: ListChecks },
    { name: "code",      label: "Code Gen",    path: "/codegen",   icon: Code },
    { name: "coverage",  label: "Coverage",    path: "/coverage",  icon: ShieldCheck },
    { name: "history",   label: "History",     path: "/history",   icon: History },
    { name: "settings",  label: "Settings",    path: "/settings",  icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background text-textMain overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-sidebar border-r border-border transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-center border-b border-border px-3">
          {collapsed ? (
            <img
              src="/logo.png"
              alt="TFX"
              className="w-9 h-9 object-contain mix-blend-lighten opacity-90"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="TestForgeX"
                className="w-8 h-8 object-contain mix-blend-lighten opacity-90 flex-shrink-0"
              />
              <span className="text-lg font-bold tracking-wide text-white">
                TestForge<span className="text-accent">X</span>
              </span>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1.5 px-3 custom-scrollbar">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center rounded-xl p-3 transition-colors ${
                    isActive
                      ? "bg-card text-accent border border-border shadow-sm"
                      : "text-textMuted hover:bg-[#1A2330] hover:text-white"
                  } ${collapsed ? "justify-center" : "justify-start space-x-3"}`
                }
              >
                <Icon size={20} />
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 bg-background border-b border-border">
          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 -ml-2 rounded-lg text-textMuted hover:text-accent hover:bg-card transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-2">
            <button
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               className="p-2 rounded-lg text-textMuted hover:text-accent hover:bg-card transition-colors"
               title="Toggle Theme"
             >
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="text-xs font-semibold bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-full uppercase tracking-widest ml-4">
              AI QA Platform
            </div>
          </div>
        </div>

        {/* Content area: Rendered child routes will appear here */}
        <div className="flex-1 overflow-auto bg-[#080B0F] p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
