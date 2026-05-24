import { useState } from "react";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
import ApplicantProfile from "./ApplicantProfile";

export default function ApplicantDocuments() {
  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);
  const contentPadding = getSidebarContentPadding(collapsed);

  return (
    <main className={`min-h-screen bg-slate-100 pt-24 ${contentPadding}`}>
      <SuperAdminSidebar
        activeTab="documents"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        role="applicant"
      />

      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5">
            <h1 className="oas-page-title">Requirements / Documents</h1>
            <p className="oas-page-description">
              Upload, replace, view, or remove your application documents anytime.
            </p>
          </header>

          <ApplicantProfile embedded mode="documents" autoEdit />
        </div>
      </section>
    </main>
  );
}
