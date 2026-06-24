import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ title = "Dashboard", userName, userRole, children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Header title={title} userName={userName} userRole={userRole} />
        <main className="dashboard-content">{children}</main>
        <footer className="dashboard-footer">
          <span>© {new Date().getFullYear()} Powered by HubbleHox</span>
        </footer>
      </div>
    </div>
  );
}
