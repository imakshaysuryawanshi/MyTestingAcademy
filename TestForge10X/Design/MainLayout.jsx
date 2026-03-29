import React, { useState } from "react";

export default function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [active, setActive] = useState("dashboard");

    const menu = [
        "dashboard",
        "jira",
        "url",
        "testplan",
        "testcases",
        "code",
        "coverage",
        "userstories",
        "settings",
    ];

    return (
        <div className="flex h-screen bg-[#0B0F14] text-[#E5E7EB]">

            {/* Sidebar */}
            <div
                className={`${collapsed ? "w-16" : "w-64"
                    } bg-[#0F141B] transition-all duration-300 flex flex-col`}
            >
                {/* Logo */}
                <div className="p-4 text-xl font-bold text-[#00E5FF]">
                    {collapsed ? "TFX" : "TestForgeX"}
                </div>

                {/* Menu */}
                <div className="flex-1 space-y-2 px-2">
                    {menu.map((item) => (
                        <div
                            key={item}
                            onClick={() => setActive(item)}
                            className={`p-2 rounded-lg cursor-pointer capitalize ${active === item
                                ? "bg-[#1F2A37] text-[#00E5FF]"
                                : "hover:bg-[#1A2330]"
                                }`}
                        >
                            {collapsed ? item[0].toUpperCase() : item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Section */}
            <div className="flex-1 flex flex-col">

                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-[#1F2A37]">

                    {/* Toggle Button */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-[#00E5FF]"
                    >
                        ☰
                    </button>

                    <div className="text-sm text-gray-400">
                        AI QA Platform
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">

                    {active === "dashboard" && <Dashboard />}
                    {active === "jira" && <Jira />}
                    {active === "url" && <URLAnalyzer />}
                    {active === "testplan" && <TestPlan />}
                    {active === "testcases" && <TestCases />}
                    {active === "code" && <CodeGen />}
                    {active === "coverage" && <Coverage />}
                    {active === "userstories" && <UserStories />}
                    {active === "settings" && <Settings />}

                </div>
            </div>
        </div>
    );
}

/* ---------------- Pages ---------------- */

function Card({ title, value }) {
    return (
        <div className="bg-[#121821] p-4 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="text-gray-400 text-sm">{title}</div>
            <div className="text-xl font-bold mt-2">{value}</div>
        </div>
    );
}

function Dashboard() {
    return (
        <div>
            <h1 className="text-2xl mb-4">Dashboard</h1>

            <div className="grid grid-cols-3 gap-4">
                <Card title="Test Cases" value="120" />
                <Card title="Test Plans" value="12" />
                <Card title="Coverage" value="78%" />
            </div>

            <div className="mt-6 space-x-4">
                <button className="bg-[#00E5FF] text-black px-4 py-2 rounded-lg">
                    Import from Jira
                </button>
                <button className="border border-[#00E5FF] px-4 py-2 rounded-lg">
                    Analyze URL
                </button>
            </div>
        </div>
    );
}

function Jira() {
    return (
        <div>
            <h1 className="text-xl mb-4">Jira Sync</h1>
            <input className="input" placeholder="Jira URL" />
            <input className="input mt-2" placeholder="Email" />
            <input className="input mt-2" placeholder="API Token" />
            <button className="btn mt-4">Fetch Stories</button>
        </div>
    );
}

function URLAnalyzer() {
    return (
        <div>
            <h1 className="text-xl mb-4">URL Analyzer</h1>
            <input className="input" placeholder="Enter URL" />
            <button className="btn mt-4">Analyze</button>
        </div>
    );
}

function TestPlan() {
    return <h1>Test Plan Page</h1>;
}

function TestCases() {
    return <h1>Test Cases Dashboard</h1>;
}

function CodeGen() {
    return <h1>Code Generator</h1>;
}

function Coverage() {
    return <h1>Coverage Analysis</h1>;
}

function UserStories() {
    return <h1>User Stories Generator</h1>;
}

function Settings() {
    return <h1>Settings</h1>;
}

/* ---------------- Reusable Styles ---------------- */

const styles = `
.input {
  width: 100%;
  padding: 10px;
  background: #121821;
  border: 1px solid #1F2A37;
  border-radius: 8px;
  color: white;
}

.btn {
  background: #00E5FF;
  color: black;
  padding: 10px 16px;
  border-radius: 8px;
}
`;

document.head.insertAdjacentHTML(
    "beforeend",
    `<style>${styles}</style>`
);