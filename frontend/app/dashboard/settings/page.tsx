"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  User, Mail, Lock, LogOut, Trash2,
  Save, Check, AlertCircle, Loader, Shield,
  ChevronDown, Settings as SettingsIcon
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type SectionId = "profile" | "password" | "account" | "danger"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openSection, setOpenSection] = useState<SectionId>("profile")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setFullName(data.user?.user_metadata?.full_name || "")
      setLoading(false)
    }
    fetchUser()
  }, [])

  const toggleSection = (id: SectionId) => {
    setOpenSection(prev => prev === id ? ("" as SectionId) : id)
  }

  const saveProfile = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      })
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    setSaving(false)
  }

  const changePassword = async () => {
    setPasswordMsg(null)
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters" })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" })
      return
    }
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordMsg({ type: "success", text: "Password updated successfully" })
      setNewPassword("")
      setConfirmPassword("")
    } catch (e: any) {
      setPasswordMsg({ type: "error", text: e.message || "Failed to update password" })
    }
    setPasswordLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return
    setDeleting(true)
    try {
      const { data: papers } = await supabase
        .from("papers")
        .select("file_path")
        .eq("user_id", user.id)

      if (papers && papers.length > 0) {
        const paths = papers.map(p => p.file_path).filter(Boolean)
        if (paths.length > 0) {
          await supabase.storage.from("papers").remove(paths)
        }
      }
      await supabase.from("papers").delete().eq("user_id", user.id)
      await supabase.auth.signOut()
      router.push("/login")
    } catch {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initial = (fullName || user?.email || "U")[0].toUpperCase()

  const sections: { id: SectionId; label: string; icon: any; iconColor: string; iconBg: string; danger?: boolean }[] = [
    { id: "profile", label: "Profile", icon: User, iconColor: "text-[#00C853]", iconBg: "bg-[#00C853]/10" },
    { id: "password", label: "Change Password", icon: Lock, iconColor: "text-blue-400", iconBg: "bg-blue-400/10" },
    { id: "account", label: "Account", icon: SettingsIcon, iconColor: "text-gray-400", iconBg: "bg-white/8" },
    { id: "danger", label: "Delete Account", icon: AlertCircle, iconColor: "text-red-400", iconBg: "bg-red-500/10", danger: true },
  ]

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Summary Card - always visible */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#00C853]/15 border border-[#00C853]/30 flex items-center justify-center text-[#00C853] font-bold text-xl shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{fullName || "Researcher"}</p>
          <p className="text-gray-500 text-xs truncate">{user?.email}</p>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">

        {sections.map(section => {
          const isOpen = openSection === section.id
          return (
            <div key={section.id}
              className={`bg-white/[0.04] border rounded-xl overflow-hidden transition ${
                section.danger ? "border-red-500/20" : "border-white/8"
              }`}>

              {/* Header - clickable */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${section.iconBg} flex items-center justify-center`}>
                    <section.icon className={`w-4 h-4 ${section.iconColor}`} />
                  </div>
                  <span className={`text-sm font-semibold ${section.danger ? "text-red-400" : "text-white"}`}>
                    {section.label}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </motion.div>
              </button>

              {/* Content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5 pt-1 border-t border-white/8">

                      {/* ── PROFILE ── */}
                      {section.id === "profile" && (
                        <div className="pt-4 space-y-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1.5">Full Name</label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={e => setFullName(e.target.value)}
                              placeholder="Your name"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853]/50 transition placeholder:text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1.5 flex items-center gap-1.5">
                              <Mail className="w-3 h-3" /> Email
                            </label>
                            <input
                              type="email"
                              value={user?.email || ""}
                              disabled
                              className="w-full bg-white/[0.02] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-gray-500 outline-none cursor-not-allowed"
                            />
                          </div>
                          <button
                            onClick={saveProfile}
                            disabled={saving}
                            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg transition ${
                              saved
                                ? "bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30"
                                : "bg-[#00C853] hover:bg-[#00a844] text-black"
                            }`}
                          >
                            {saving ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                              : saved ? <><Check className="w-3.5 h-3.5" /> Saved!</>
                              : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                          </button>
                        </div>
                      )}

                      {/* ── PASSWORD ── */}
                      {section.id === "password" && (
                        <div className="pt-4 space-y-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1.5">New Password</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="At least 6 characters"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853]/50 transition placeholder:text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1.5">Confirm New Password</label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter new password"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853]/50 transition placeholder:text-gray-600"
                            />
                          </div>
                          {passwordMsg && (
                            <p className={`text-xs flex items-center gap-1.5 ${
                              passwordMsg.type === "success" ? "text-[#00C853]" : "text-red-400"
                            }`}>
                              {passwordMsg.type === "success" ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              {passwordMsg.text}
                            </p>
                          )}
                          <button
                            onClick={changePassword}
                            disabled={passwordLoading || !newPassword}
                            className="flex items-center gap-2 bg-white/8 hover:bg-white/12 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-lg transition border border-white/10"
                          >
                            {passwordLoading ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Updating...</>
                              : <><Shield className="w-3.5 h-3.5" /> Update Password</>}
                          </button>
                        </div>
                      )}

                      {/* ── ACCOUNT ── */}
                      {section.id === "account" && (
                        <div className="pt-4">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <LogOut className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                              </div>
                              <span className="text-sm text-gray-300 group-hover:text-white transition">Log Out</span>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* ── DANGER ZONE ── */}
                      {section.id === "danger" && (
                        <div className="pt-4 space-y-3">
                          <p className="text-gray-500 text-xs">
                            Deleting your account will permanently remove all your papers, analyses, and data. This action cannot be undone.
                          </p>

                          {!showDeleteConfirm ? (
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold px-4 py-2.5 rounded-lg transition border border-red-500/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Account
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-xs text-gray-400">
                                Type <span className="text-red-400 font-bold">DELETE</span> to confirm:
                              </p>
                              <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full bg-white/5 border border-red-500/30 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50 transition"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleDeleteAccount}
                                  disabled={deleteConfirmText !== "DELETE" || deleting}
                                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
                                >
                                  {deleting ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Deleting...</> : "Permanently Delete"}
                                </button>
                                <button
                                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText("") }}
                                  className="text-xs text-gray-400 hover:text-white px-4 py-2.5 rounded-lg border border-white/10 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

    </div>
  )
}