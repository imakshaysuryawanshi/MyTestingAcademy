import React from "react";

export default function Card({ title, value, icon: Icon }) {
    return (
        <div className="bg-card p-6 rounded-2xl shadow-lg hover:shadow-cyan-500/10 border border-border transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className="text-textMuted text-sm font-medium tracking-wide uppercase">{title}</div>
                {Icon && <Icon className="text-accent" size={24} />}
            </div>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {value}
            </div>
        </div>
    );
}
