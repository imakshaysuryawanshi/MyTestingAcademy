import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Jira from "./pages/Jira";
import URLAnalyzer from "./pages/URLAnalyzer";
import TestPlan from "./pages/TestPlan";
import TestCases from "./pages/TestCases";
import CodeGen from "./pages/CodeGen";
import Coverage from "./pages/Coverage";
import UserStories from "./pages/UserStories";
import Settings from "./pages/Settings";
import HistoryPage from "./pages/History";
import Scenarios from "./pages/Scenarios";
import APIScenarios from "./pages/APIScenarios";
import APITestCases from "./pages/APITestCases";

// Placeholders for remaining pages
const Placeholder = ({ title }) => (
  <div className="h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold text-white">{title}</h1>
      <p className="text-textMuted text-lg">Coming in the next phase</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="jira" element={<Jira />} />
          <Route path="url" element={<URLAnalyzer />} />
          <Route path="testplans" element={<TestPlan />} />
          <Route path="testcases" element={<TestCases />} />
          <Route path="codegen" element={<CodeGen />} />
          <Route path="coverage" element={<Coverage />} />
          <Route path="stories" element={<UserStories />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="api-scenarios" element={<APIScenarios />} />
          <Route path="api-testcases" element={<APITestCases />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
