import { useState } from "react";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
import ApplicantProfile from "./ApplicantProfile";

export default function ApplicantInformation() {
  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);
  const contentPadding = getSidebarContentPadding(collapsed);

  return (
    <main className={`min-h-screen bg-slate-100 pt-24 ${contentPadding}`}>
      <SuperAdminSidebar
        activeTab="applicant-info"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        role="applicant"
      />

      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5">
            <h1 className="oas-page-title">Applicant Information</h1>
            <p className="oas-page-description">
              Update your personal, education, eligibility, and training details.
            </p>
          </header>

          <ApplicantProfile embedded mode="information" autoEdit />
        </div>
      </section>
    </main>
  );
}
