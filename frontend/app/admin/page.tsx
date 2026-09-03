"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Database,
  Download,
  FileCheck2,
  Lock,
  LogOut,
  ShieldCheck,
  Zap,
  UserPlus,
  Trash2,
  User,
  UserCheck,
  Building2,
  KeyRound,
  ShieldAlert,
} from "lucide-react";

import ReportsLayout from "@/app/reports/layout";
import { RecentReportsList } from "@/components/dashboard/RecentReportsList";
import { useReportProgress } from "@/components/report-builder/ReportProgressContext";
import {
  getReportSessions,
  getLoggedInUser,
  updateCurrentUser,
  getUsers,
  createUserByAdmin,
  deleteUserByAdmin,
  updateUserRole,
  logoutUser,
} from "@/lib/api";
import { useRouter } from "next/navigation";

const STATIONS = [
  "Juja",
  "Athi River",
  "Kanyonyo",
  "Gilgil",
  "Isinya",
  "Suswa",
  "Webuye",
  "Mariakani",
  "Mtwapa",
];

type DeveloperTicket = {
  id: string;
  title: string;
  category: "Bug" | "Feature" | "Enhancement";
  severity: "Low" | "Medium" | "High" | "Critical";
  affectedArea: string;
  description: string;
  expectedBehavior: string;
  submittedAt: string;
  prompt: string;
};

type UserAccount = {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
  station: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "credentials" | "users">("status");

  useEffect(() => {
    const user = getLoggedInUser();
    setCurrentUser(user);
    if (!user) {
      router.push("/login");
      setIsAuthorized(false);
    } else if (user.role !== "admin" && user.role !== "developer") {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (isAuthorized === null) {
    return (
      <ReportsLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="text-sm font-bold text-cyan-300">Checking credentials...</p>
          </div>
        </div>
      </ReportsLayout>
    );
  }

  if (isAuthorized === false) {
    return (
      <ReportsLayout>
        <div className="mx-auto max-w-md rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center shadow-xl">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-300">
            You do not have administrative privileges to access this console. Please sign in with an administrator account.
          </p>
          <button
            onClick={() => {
              logoutUser();
              router.push("/login");
            }}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
          >
            <LogOut size={16} />
            Sign in as Admin
          </button>
        </div>
      </ReportsLayout>
    );
  }

  return (
    <ReportsLayout>
      <div className="space-y-6">
        <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">
                <ShieldCheck aria-hidden="true" size={14} />
                Admin Console
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-white">
                Console Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Manage system users, credentials, and view report history.
              </p>
            </div>
            
            <div className="text-xs text-slate-400">
              Logged in as: <span className="font-bold text-cyan-300">{currentUser?.username}</span> ({currentUser?.role})
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex border-b border-cyan-900/50">
            <button
              onClick={() => setActiveTab("status")}
              className={`pb-3 pr-6 text-sm font-bold transition-all border-b-2 ${
                activeTab === "status"
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              System Status & Reports
            </button>
            <button
              onClick={() => setActiveTab("credentials")}
              className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 ${
                activeTab === "credentials"
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              My Credentials
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 ${
                activeTab === "users"
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Account Management
            </button>
          </div>
        </div>

        {activeTab === "status" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <SystemStatusPanel />
              <SessionDetailsPanel />
            </div>

            <DeveloperPromptAccessPanel />

            <RecentReportsList />
          </div>
        )}

        {activeTab === "credentials" && (
          <ChangeCredentialsForm currentUser={currentUser} setCurrentUser={setCurrentUser} />
        )}

        {activeTab === "users" && (
          <UserManagementPanel currentUser={currentUser} />
        )}
      </div>
    </ReportsLayout>
  );
}

// Subcomponents

function ChangeCredentialsForm({ currentUser, setCurrentUser }: { currentUser: any; setCurrentUser: any }) {
  const [username, setUsername] = useState(currentUser?.username || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(currentUser?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload: any = { username, full_name: fullName };
      if (password) {
        payload.password = password;
      }
      const updatedUser = await updateCurrentUser(payload);
      setCurrentUser(updatedUser);
      setSuccess("Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-cyan-900/50 bg-[#0b2135]/85 p-6 shadow-xl">
      <div className="flex items-center gap-3 border-b border-cyan-900/40 pb-4 mb-6">
        <KeyRound className="h-6 w-6 text-cyan-400" />
        <div>
          <h2 className="text-lg font-bold text-white">Update My Credentials</h2>
          <p className="text-xs text-slate-400">Change your login username, name, or password</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="admin-username-input">
            Username
          </label>
          <div className="relative mt-2">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="admin-username-input"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-cyan-900 bg-[#071827] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="admin-fullname-input">
            Full Name
          </label>
          <div className="relative mt-2">
            <UserCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="admin-fullname-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-cyan-900 bg-[#071827] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <div className="border-t border-cyan-900/40 pt-4 mt-6">
          <p className="text-xs text-slate-400 mb-4">Leave password fields blank if you do not wish to change it.</p>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="admin-pwd-input">
                New Password
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-pwd-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-cyan-900 bg-[#071827] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="admin-pwd-confirm">
                Confirm Password
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-pwd-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-cyan-900 bg-[#071827] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-950 bg-red-950/20 p-3 text-xs text-red-400 font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-emerald-950 bg-emerald-950/20 p-3 text-xs text-emerald-400 font-semibold">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-cyan-400 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition"
        >
          {loading ? "Saving Changes..." : "Save Profile Changes"}
        </button>
      </form>
    </div>
  );
}

function UserManagementPanel({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Create user form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newStation, setNewStation] = useState(STATIONS[0]);
  const [customStation, setCustomStation] = useState("");
  const [isCustomStation, setIsCustomStation] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError("Failed to fetch user accounts");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const stationValue = isCustomStation ? customStation : newStation;

    setLoading(true);
    try {
      const newUser = await createUserByAdmin({
        username: newUsername,
        password: newPassword,
        full_name: newFullName || undefined,
        role: newRole,
        station: stationValue || undefined,
      });

      setSuccess(`Account '${newUsername}' created successfully!`);
      setNewUsername("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("user");
      setCustomStation("");
      setIsCustomStation(false);
      setUsers((prev) => [...prev, newUser]);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, username: string) {
    setError("");
    setSuccess("");
    try {
      await deleteUserByAdmin(userId);
      setSuccess(`Account '${username}' deleted.`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setError(err.message || `Failed to delete account ${username}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    if (newRole === currentUser?.role && userId === currentUser?.id) return;
    
    setUpdatingRole(userId);
    setError("");
    setSuccess("");
    try {
      const updatedUser = await updateUserRole(userId, newRole);
      setSuccess(`Role updated to ${newRole} for ${updatedUser.username}`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err: any) {
      setError(err.message || "Failed to update role");
      // Revert the UI select visually by re-fetching or letting the existing state persist on error
    } finally {
      setUpdatingRole(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* User creation form */}
      <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/85 p-6 shadow-xl xl:col-span-1">
        <div className="flex items-center gap-3 border-b border-cyan-900/40 pb-4 mb-6">
          <UserPlus className="h-6 w-6 text-cyan-400" />
          <div>
            <h2 className="text-lg font-bold text-white">Add New Account</h2>
            <p className="text-xs text-slate-400">Create login credentials for other officers</p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="new-username">
              Username
            </label>
            <input
              id="new-username"
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="mt-2 w-full rounded-lg border border-cyan-900 bg-[#071827] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 transition"
              placeholder="e.g. jdoe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="new-password">
              Password
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-cyan-900 bg-[#071827] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="new-fullname">
              Full Name
            </label>
            <input
              id="new-fullname"
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-cyan-900 bg-[#071827] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 transition"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="new-role">
              System Role
            </label>
            <select
              id="new-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="mt-2 w-full rounded-lg border border-cyan-900 bg-[#071827] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 transition"
            >
              <option value="user">User (Reporting Officer)</option>
              <option value="viewer">Viewer (Dashboard Only)</option>
              <option value="admin">Administrator</option>
              <option value="developer">Developer</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Station
            </label>
            <div className="flex items-center gap-4 mt-2">
              <label className="inline-flex items-center text-xs text-slate-300">
                <input
                  type="radio"
                  checked={!isCustomStation}
                  onChange={() => setIsCustomStation(false)}
                  className="mr-2 text-cyan-500 focus:ring-0"
                />
                Select Station
              </label>
              <label className="inline-flex items-center text-xs text-slate-300">
                <input
                  type="radio"
                  checked={isCustomStation}
                  onChange={() => setIsCustomStation(true)}
                  className="mr-2 text-cyan-500 focus:ring-0"
                />
                Custom Station Name
              </label>
            </div>

            {!isCustomStation ? (
              <select
                value={newStation}
                onChange={(e) => setNewStation(e.target.value)}
                className="mt-2 w-full rounded-lg border border-cyan-900 bg-[#071827] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 transition"
              >
                {STATIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required={isCustomStation}
                value={customStation}
                onChange={(e) => setCustomStation(e.target.value)}
                placeholder="Enter custom station name"
                className="mt-2 w-full rounded-lg border border-cyan-900 bg-[#071827] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 transition"
              />
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-950 bg-red-950/20 p-3 text-xs text-red-400 font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-950 bg-emerald-950/20 p-3 text-xs text-emerald-400 font-semibold">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-400 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>

      {/* User list */}
      <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/85 p-6 shadow-xl xl:col-span-2">
        <h2 className="text-lg font-bold text-white border-b border-cyan-900/40 pb-4 mb-4">
          All System Accounts
        </h2>

        {loading && users.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-cyan-900/40 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pl-2">User details</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Station</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950/40">
                {users.map((account) => {
                  const isSelf = account.id === currentUser?.id;
                  return (
                    <tr key={account.id} className="hover:bg-[#071827]/40 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="font-semibold text-white">{account.username}</div>
                        {account.full_name && (
                          <div className="text-xs text-slate-400">{account.full_name}</div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <select
                          value={account.role}
                          disabled={
                            updatingRole === account.id || 
                            isSelf ||
                            (currentUser?.role === "developer" && account.role === "admin")
                          }
                          onChange={(e) => handleUpdateRole(account.id, e.target.value)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold outline-none cursor-pointer ${
                            account.role === "admin"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : account.role === "developer"
                              ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                              : account.role === "viewer"
                              ? "bg-slate-500/10 text-slate-300 border border-slate-500/20"
                              : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                          }`}
                        >
                          <option value="user">user</option>
                          <option value="viewer">viewer</option>
                          <option value="admin">admin</option>
                          <option value="developer">developer</option>
                        </select>
                        {updatingRole === account.id && (
                          <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-300 font-medium">
                        {account.station ? (
                          <span className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-slate-500" />
                            {account.station}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        {isSelf ? (
                          <span className="text-xs font-bold text-cyan-400/70 mr-2">You</span>
                        ) : deletingId === account.id ? (
                          <div className="flex items-center justify-end gap-1.5 mr-2">
                            <button
                              onClick={() => setDeletingId(null)}
                              className="rounded bg-slate-700 px-2 py-1 text-xs font-bold text-slate-200 hover:bg-slate-600 transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteUser(account.id, account.username)}
                              className="rounded bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(account.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SystemStatusPanel() {
  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-cyan-200">System Status</h2>
          <p className="mt-1 text-xs text-slate-400">
            Operational controls and persistence surfaces.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
          <Zap size={12} className="animate-pulse" /> Online
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-[#071827]/80 p-3 border border-cyan-950">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-white">API Gateway</p>
              <p className="text-xs text-slate-400">FastAPI backend online</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[#071827]/80 p-3 border border-cyan-950">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-cyan-400" />
            <div>
              <p className="text-sm font-semibold text-white">PostgreSQL Metadata</p>
              <p className="text-xs text-slate-400">Report history and dashboard persistence</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[#071827]/80 p-3 border border-cyan-950">
          <div className="flex items-center gap-3">
            <FileCheck2 size={18} className="text-cyan-400" />
            <div>
              <p className="text-sm font-semibold text-white">Persistent Report Storage</p>
              <p className="text-xs text-slate-400">Uploads, previews, processed data, and outputs</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      </div>
    </div>
  );
}

function SessionDetailsPanel() {
  const { debugManualPayload, debugUploadResponse, sessionId } = useReportProgress();

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-5 shadow-xl">
      <h2 className="text-base font-bold text-cyan-200">Session Details</h2>
      <p className="mt-1 text-xs text-slate-400">
        Technical workspace and payload details for troubleshooting.
      </p>

      <p className="mt-4 break-all rounded-lg border border-cyan-900/50 bg-[#071827] px-3 py-2 font-mono text-xs text-slate-300">
        {sessionId || "No active report workspace"}
      </p>

      {debugManualPayload && (
        <label htmlFor="admin-manual-payload" className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Manual PATCH Payload
          </span>
          <textarea
            id="admin-manual-payload"
            readOnly
            value={debugManualPayload}
            rows={7}
            className="mt-2 w-full resize-none rounded-md border border-cyan-900/60 bg-[#071827] px-3 py-2 font-mono text-xs text-slate-300 outline-none"
          />
        </label>
      )}

      {debugUploadResponse && (
        <label htmlFor="admin-upload-response" className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upload JSON Response
          </span>
          <textarea
            id="admin-upload-response"
            readOnly
            value={debugUploadResponse}
            rows={8}
            className="mt-2 w-full resize-none rounded-md border border-cyan-900/60 bg-[#071827] px-3 py-2 font-mono text-xs text-slate-300 outline-none"
          />
        </label>
      )}
    </div>
  );
}

function DeveloperPromptAccessPanel() {
  const [tickets, setTickets] = useState<DeveloperTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dev-tickets");
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as DeveloperTicket[];
      setTickets(parsed);
      setActiveTicketId(parsed[0]?.id || "");
    } catch (error) {
      console.error("Failed to parse tickets", error);
    }
  }, []);

  const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) || null;

  function handleCopyPrompt() {
    if (!activeTicket) {
      return;
    }

    navigator.clipboard.writeText(activeTicket.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPrompt() {
    if (!activeTicket) {
      return;
    }

    const blob = new Blob([activeTicket.prompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTicket.id}_developer_prompt.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-5 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-cyan-200">Developer Prompt Access</h2>
          <p className="mt-1 text-xs text-slate-400">
            Ticket-generated AI developer prompts are visible only in admin controls.
          </p>
        </div>

        {activeTicket && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-extrabold text-slate-950 hover:bg-cyan-300"
            >
              {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPrompt}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/10"
            >
              <Download aria-hidden="true" size={14} />
              Download
            </button>
          </div>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-cyan-900/40 bg-[#071827]/60 p-8 text-center text-sm text-slate-400">
          No developer tickets have been submitted in this browser.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setActiveTicketId(ticket.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  activeTicketId === ticket.id
                    ? "border-cyan-400 bg-cyan-950/40"
                    : "border-cyan-900/40 bg-[#071827]/60 hover:border-cyan-700"
                }`}
              >
                <p className="font-mono text-[10px] font-bold text-slate-400">{ticket.id}</p>
                <p className="mt-1 text-sm font-semibold text-white">{ticket.title}</p>
                <p className="mt-1 text-xs text-slate-500">{ticket.submittedAt}</p>
              </button>
            ))}
          </div>

          <div className="min-h-[320px] max-h-[560px] overflow-auto rounded-lg border border-cyan-900/50 bg-[#071827] p-4 font-mono text-xs whitespace-pre-wrap text-slate-300">
            {activeTicket?.prompt || "Select a ticket to view its developer prompt."}
          </div>
        </div>
      )}
    </div>
  );
}
