import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RadioProvider } from "./context/RadioProvider";
import { RadioPage } from "./pages/RadioPage";
import "./style.css";

const AdminPage = lazy(() => import("./pages/AdminPage"));

declare global {
  interface Window {
    __claudioRoot?: ReturnType<typeof createRoot>;
  }
}

const container = document.getElementById("root") as HTMLElement;
const root = window.__claudioRoot || createRoot(container);
window.__claudioRoot = root;

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <RadioProvider>
        <Routes>
          <Route path="/" element={<RadioPage />} />
          <Route path="/admin" element={
            <Suspense fallback={<div className="shell"><p className="empty-note">加载管理界面…</p></div>}>
              <AdminPage />
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RadioProvider>
    </BrowserRouter>
  </React.StrictMode>
);
