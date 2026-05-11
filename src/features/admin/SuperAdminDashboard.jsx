import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Loader2,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

const sumCounts = (items = []) =>
  items.reduce((total, item) => total + Number(item.count || 0), 0);

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState({
    users: [],
    jobs: [],
    applications: [],
  });
  const [managementUsers, setManagementUsers] = useState([]);
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");

  const loadDashboard = async () => {
    const [overviewResult, usersResult] = await Promise.all([
      apiRequest("/api/superadmin/overview"),
      apiRequest("/api/superadmin/users"),
    ]);

    setOverview({
      users: overviewResult.users || [],
      jobs: overviewResult.jobs || [],
      applications: overviewResult.applications || [],
    });
    setManagementUsers(usersResult.users || []);
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      apiRequest("/api/superadmin/overview"),
      apiRequest("/api/superadmin/users"),
    ])
      .then(([overviewResult, usersResult]) => {
        if (!isMounted) return;

        setOverview({
          users: overviewResult.users || [],
          jobs: overviewResult.jobs || [],
          applications: overviewResult.applications || [],
        });
        setManagementUsers(usersResult.users || []);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateAdminForm = (field, value) => {
    setAdminForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormMessage("");
    setIsCreating(true);

    try {
      const result = await apiRequest("/api/superadmin/admins", {
        method: "POST",
        body: JSON.stringify(adminForm),
      });

      setManagementUsers((current) => [result.user, ...current]);
      setAdminForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
      setFormMessage("Admin account created successfully.");
      await loadDashboard();
    } catch (err) {
      setFormError(err.message || "Failed to create admin account.");
    } finally {
      setIsCreating(false);
    }
  };

  const totals = useMemo(
    () => ({
      users: sumCounts(overview.users),
      jobs: sumCounts(overview.jobs),
      applications: sumCounts(overview.applications),
    }),
    [overview]
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-950">
            Superadmin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            System-wide monitoring for users, postings, and applications.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading system overview...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <Users className="h-7 w-7 text-blue-700" />
                <p className="mt-3 text-sm text-slate-500">Users</p>
                <p className="text-3xl font-bold text-slate-900">
                  {totals.users}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <BriefcaseBusiness className="h-7 w-7 text-blue-700" />
                <p className="mt-3 text-sm text-slate-500">Job Postings</p>
                <p className="text-3xl font-bold text-slate-900">
                  {totals.jobs}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <Shield className="h-7 w-7 text-green-700" />
                <p className="mt-3 text-sm text-slate-500">Applications</p>
                <p className="text-3xl font-bold text-slate-900">
                  {totals.applications}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {[
                ["Users by Role", overview.users, "role"],
                ["Jobs by Status", overview.jobs, "status"],
                ["Applications by Status", overview.applications, "status"],
              ].map(([title, items, labelKey]) => (
                <section
                  key={title}
                  className="rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-bold text-slate-900">{title}</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <p className="p-5 text-sm text-slate-500">No data yet.</p>
                    ) : (
                      items.map((item) => (
                        <div
                          key={`${title}-${item[labelKey]}`}
                          className="flex items-center justify-between px-5 py-4 text-sm"
                        >
                          <span className="font-medium capitalize text-slate-700">
                            {String(item[labelKey]).replaceAll("_", " ")}
                          </span>
                          <span className="font-bold text-slate-900">
                            {item.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-700" />
                    <h2 className="font-bold text-slate-900">
                      Create Admin Account
                    </h2>
                  </div>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-4 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        First Name
                      </label>
                      <input
                        value={adminForm.firstName}
                        onChange={(event) =>
                          updateAdminForm("firstName", event.target.value)
                        }
                        className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Last Name
                      </label>
                      <input
                        value={adminForm.lastName}
                        onChange={(event) =>
                          updateAdminForm("lastName", event.target.value)
                        }
                        className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Email
                    </label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(event) =>
                        updateAdminForm("email", event.target.value)
                      }
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(event) =>
                        updateAdminForm("password", event.target.value)
                      }
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {formError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {formError}
                    </div>
                  )}

                  {formMessage && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                      {formMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Admin
                  </button>
                </form>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="font-bold text-slate-900">
                    Management Accounts
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {managementUsers.length === 0 ? (
                    <p className="p-5 text-sm text-slate-500">
                      No management accounts yet.
                    </p>
                  ) : (
                    managementUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col gap-1 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {[user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(" ") || user.email}
                          </p>
                          <p className="text-slate-500">{user.email}</p>
                        </div>
                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                          {String(user.role).replaceAll("_", " ")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
