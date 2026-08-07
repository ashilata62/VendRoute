import { useState, useEffect } from "react";
import { usersApi } from "../services/api";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatDate } from "../lib/utils";
import { Plus, User, X, Check, Pencil, Trash2, KeyRound } from "lucide-react";
import type { AppUser, UserRole } from "../types";



export default function UsersPage() {
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "SUPERVISOR" as UserRole,
  });
  const [invitedSuccess, setInvitedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Reset Password modal state
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchUsers = () => {
    usersApi.getAll().then(res => {
      if (res.success) {
        const dbUsers = res.data
          .filter((u: any) => u.role?.toUpperCase() === 'SUPERVISOR')
          .map((u: any) => ({
            ...u,
            status: "active",
            lastLogin: u.createdAt || new Date().toISOString()
          }));
        setUsersList(dbUsers);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setEditingUserId(null);
    setForm({ name: "", email: "", password: "", phone: "", address: "", role: "SUPERVISOR" as UserRole });
    setErrorMsg("");
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setErrorMsg("");

    try {
      let res;
      if (editingUserId) {
        res = await usersApi.update(editingUserId, form);
      } else {
        res = await usersApi.create(form);
      }
      
      if (res.success) {
        fetchUsers();
        closeInviteModal();
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to process request");
    }
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setForm({ 
      name: user.name || "", 
      email: user.email || "", 
      password: "", // Leave blank on edit, unless they want to change it
      phone: user.phone || "", 
      address: user.address || "", 
      role: user.role 
    });
    setIsInviteModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await usersApi.delete(id);
        if (res.success) {
          setUsersList(usersList.filter(u => u.id !== id));
        }
      } catch (e: any) {
        alert(e.message || "Failed to delete user");
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetMsg("Password must be at least 6 characters.");
      return;
    }
    setResetting(true);
    setResetMsg("");
    try {
      const res = await usersApi.update(resetPasswordUser.id, { password: newPassword });
      if (res.success) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetPasswordUser(null);
          setNewPassword("");
          setResetSuccess(false);
        }, 1500);
      } else {
        setResetMsg("Failed to reset password.");
      }
    } catch (err: any) {
      setResetMsg(err.message || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Supervisor"
        description="Manage platform users and their permission levels."
        action={
          <button
            onClick={() => {
              setEditingUserId(null);
              setForm({ name: "", email: "", password: "", phone: "", address: "", role: "SUPERVISOR" as UserRole });
              setIsInviteModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Invite User
          </button>
        }
      />

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">All Supervisors ({usersList.length})</h3>
            <span className="text-xs text-slate-400">Manage permissions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={user.role} /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={user.status} withDot /></td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{formatDate(user.lastLogin)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditModal(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit User">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setResetPasswordUser(user); setNewPassword(""); setResetMsg(""); setResetSuccess(false); }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete User">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> {editingUserId ? "Edit User" : "Invite New Team Member"}
              </h3>
              <button
                onClick={closeInviteModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Roy"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ananya@vendroute.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password {editingUserId && <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  placeholder={editingUserId ? "Leave blank to keep current password" : "Enter a secure password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  placeholder="e.g. 123 Vending St, Mumbai"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {invitedSuccess && (
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" /> User {editingUserId ? "updated" : "invitation sent"} successfully!
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  {editingUserId ? "Save Changes" : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" /> Reset Password
              </h3>
              <button onClick={() => setResetPasswordUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Setting a new password for <span className="font-bold text-slate-800">{resetPasswordUser.name}</span>.
              They will need to use this new password to log in.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {resetMsg && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs font-semibold">{resetMsg}</div>
              )}
              {resetSuccess && (
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" /> Password updated successfully!
                </div>
              )}

              <div className="pt-1 flex justify-end gap-2">
                <button type="button" onClick={() => setResetPasswordUser(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl shadow-sm"
                >
                  {resetting ? "Saving..." : "Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
