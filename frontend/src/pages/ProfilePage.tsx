import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, ShieldCheck, Lock, Key,
  CheckCircle2, AlertCircle, Loader2, Save, Building2, MapPin, Camera, Upload, Trash2
} from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { useAuthStore } from "../store/authStore";
import { authApi, usersApi, uploadApi } from "../services/api";

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personal Info Form
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState("");
  const [infoError, setInfoError] = useState("");

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInfoLoading(true);
      setInfoError("");
      try {
        const uploadRes = await uploadApi.uploadFile(file);
        if (uploadRes && uploadRes.url) {
          setAvatar(uploadRes.url);
          if (user?.id) {
            await usersApi.update(user.id, { avatar: uploadRes.url });
            await fetchMe();
            setInfoSuccess("Profile photo updated successfully!");
          } else {
            setInfoSuccess("Photo uploaded! Click 'Save Profile Changes' to update your profile.");
          }
        }
      } catch (err: any) {
        setInfoError(err.message || "Failed to upload photo");
      } finally {
        setInfoLoading(false);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id) return;
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    setAvatar("");
    setInfoLoading(true);
    setInfoSuccess("");
    setInfoError("");
    try {
      const res = await usersApi.update(user.id, { avatar: "" });
      if (res.success) {
        await fetchMe();
        setInfoSuccess("Profile photo removed successfully!");
      }
    } catch (err: any) {
      setInfoError(err.message || "Failed to remove profile photo");
    } finally {
      setInfoLoading(false);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setInfoLoading(true);
    setInfoSuccess("");
    setInfoError("");
    try {
      const res = await usersApi.update(user.id, {
        name,
        phone,
        address,
        avatar,
      });
      if (res.success) {
        await fetchMe();
        setInfoSuccess("Profile details saved to database successfully!");
      }
    } catch (err: any) {
      setInfoError(err.message || "Failed to update profile info");
    } finally {
      setInfoLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New password and confirm password do not match.");
      return;
    }

    if (!currentPassword) {
      setPassError("Current password is required.");
      return;
    }

    setPassLoading(true);
    try {
      // Use new change-password API
      const res = await authApi.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPassSuccess("Password changed successfully! Next time login with your new password.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPassError(err.message || "Failed to change password.");
    } finally {
      setPassLoading(false);
    }
  };

  const roleLabel =
    user?.role === "superadmin"
      ? "Administrator"
      : user?.role === "supervisor"
      ? "Field Supervisor"
      : "Field Operations Officer";

  const roleColor =
    user?.role === "superadmin"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : user?.role === "supervisor"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const currentPhotoSrc = avatar || user?.avatar;
  const isValidPhoto = Boolean(
    currentPhotoSrc && 
    (currentPhotoSrc.startsWith("http") || currentPhotoSrc.startsWith("https") || currentPhotoSrc.startsWith("data:image") || currentPhotoSrc.startsWith("/uploads"))
  );
  const displayPhotoUrl = currentPhotoSrc?.startsWith("/uploads")
    ? `http://localhost:3000${currentPhotoSrc}`
    : currentPhotoSrc;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Profile & Security"
        description="Manage your personal account details, role permissions, and password security settings."
        breadcrumbs={[{ label: "Profile" }]}
      />

      {/* Header Profile Card with Logo/Photo Uploader */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 relative" />
        <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-10 gap-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative group">
              {isValidPhoto ? (
                <img
                  src={displayPhotoUrl}
                  alt={user?.name}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563EB&color=fff`;
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center ring-4 ring-white shadow-lg">
                  {user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "AD"}
                </div>
              )}
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl border border-white shadow-md transition-transform hover:scale-105 cursor-pointer"
                title="Upload Profile Picture / Logo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">{name || user?.name || "Admin Account"}</h2>
              <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${roleColor}`}>
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                  {roleLabel}
                </span>
                <span className="text-xs text-slate-500 font-medium">• {user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Photo / Logo
            </button>
            
            {isValidPhoto && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Delete Profile Photo"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Photo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Personal Information</h3>
          </div>

          {infoSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {infoSuccess}
            </div>
          )}

          {infoError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {infoError}
            </div>
          )}

          <form onSubmit={handleUpdateInfo} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Account Email Address (Read-Only)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 00001"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Office / Base Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Headquarters - Maryland Vending, Mumbai"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={infoLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {infoLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Profile Changes</>}
            </button>
          </form>
        </motion.div>

        {/* Change Password & Security Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Key className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Change Password & Security</h3>
          </div>

          {passSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {passSuccess}
            </div>
          )}

          {passError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Current Password *</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">New Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter min 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Confirm New Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl text-[11px] text-indigo-900 leading-relaxed font-medium">
              🛡️ <strong>Security Note:</strong> Changing password will require you to use your new password for all subsequent logins.
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {passLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating Password...</> : <><Key className="w-4 h-4" /> Update Password</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
