import { useState } from "react";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import ApplicantProfile from "./ApplicantProfile";

export default function ApplicantInformation() {
  const [collapsed, setCollapsed] = useState(false);
  const contentPadding = collapsed ? "lg:pl-20" : "lg:pl-72";

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
            <p className="oas-page-kicker">Applicant</p>
            <h1 className="oas-page-title mt-2">Applicant Information</h1>
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
