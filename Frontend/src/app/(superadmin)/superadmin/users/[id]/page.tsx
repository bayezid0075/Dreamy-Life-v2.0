"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  UserCheck,
  UserX,
  Trash2,
  Sun,
  Moon,
} from "lucide-react";
import { superadminApi } from "@/lib/api";
import type { AccountStatus } from "@/types";
import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";

const THEME_KEY = "superadmin-theme";
const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  hold: "Hold",
  ban: "Ban",
  inactive: "Inactive",
};

type Theme = "dark" | "light";

export default function SuperadminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [theme, setTheme] = useState<Theme>("dark");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    const s = typeof window !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
    setTheme(s === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  const isLight = theme === "light";

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["superadmin-user", id],
    queryFn: () => superadminApi.getUser(id),
    enabled: Number.isFinite(id),
  });

  const updateAccountStatus = async (newStatus: AccountStatus) => {
    if (user?.id === currentUser?.user.id) {
      toast.error("You cannot change your own account status");
      return;
    }
    setActioning(true);
    try {
      await superadminApi.updateUser(id, { account_status: newStatus });
      toast.success(`Account status set to ${ACCOUNT_STATUS_LABELS[newStatus]}`);
      queryClient.invalidateQueries({ queryKey: ["superadmin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to update");
    } finally {
      setActioning(false);
    }
  };

  const toggleActive = async () => {
    if (!user) return;
    if (user.id === currentUser?.user.id) {
      toast.error("You cannot change your own status");
      return;
    }
    setActioning(true);
    try {
      await superadminApi.updateUser(id, { is_active: !user.is_active });
      toast.success(user.is_active ? "User deactivated" : "User activated");
      queryClient.invalidateQueries({ queryKey: ["superadmin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to update");
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async () => {
    if (user?.id === currentUser?.user.id) {
      toast.error("You cannot delete your own account");
      setDeleteConfirm(false);
      return;
    }
    setActioning(true);
    try {
      await superadminApi.deleteUser(id);
      toast.success("User deleted");
      setDeleteConfirm(false);
      router.push("/superadmin");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to delete");
    } finally {
      setActioning(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div
        className={`min-h-screen font-mono flex items-center justify-center ${
          isLight ? "bg-slate-50 text-slate-800" : "bg-[#0d1117] text-slate-200"
        }`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen font-mono flex items-center justify-center p-6 ${
          isLight ? "bg-slate-50 text-slate-800" : "bg-[#0d1117] text-slate-200"
        }`}
      >
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load user</p>
          <Link
            href="/superadmin"
            className="text-sm px-4 py-2 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Back to panel
          </Link>
        </div>
      </div>
    );
  }

  const accountStatus = user.account_status ?? "active";
  const isSelf = user.id === currentUser?.user.id;

  return (
    <div
      className={`min-h-screen font-mono transition-colors ${
        isLight ? "bg-slate-50 text-slate-800" : "bg-[#0d1117] text-slate-200"
      }`}
    >
      <header
        className={`border-b sticky top-0 z-10 ${
          isLight ? "border-slate-200 bg-white/90" : "border-slate-700/80 bg-[#161b22]/80"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/superadmin"
              className={`p-2 rounded-lg border transition-colors ${
                isLight
                  ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                  : "border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                User: {user.username}
              </h1>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                ID {user.id} · {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`p-2 rounded-lg border ${
                isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-400"
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              href="/dashboard"
              className={`text-xs px-3 py-1.5 rounded border ${
                isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-400"
              }`}
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div
          className={`rounded-lg border overflow-hidden ${
            isLight ? "border-slate-200 bg-white shadow-sm" : "border-slate-700/80 bg-[#161b22]/50"
          }`}
        >
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Account
                </h3>
                <p><span className="text-slate-500">Username:</span> {user.username}</p>
                <p><span className="text-slate-500">Email:</span> {user.email}</p>
                <p><span className="text-slate-500">Phone:</span> {user.phone_number}</p>
                <p>
                  <span className="text-slate-500">Status:</span>{" "}
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                      user.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Member info
                </h3>
                <p><span className="text-slate-500">Refer code:</span> {user.info?.own_refercode ?? "—"}</p>
                <p><span className="text-slate-500">Member tier:</span> {user.info?.member_status ?? "—"}</p>
                <p><span className="text-slate-500">Upline:</span> {user.referred_by_username ?? "—"} {user.referred_by_refercode && `(${user.referred_by_refercode})`}</p>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className={`text-sm font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Account status
              </h3>
              <Select
                value={accountStatus}
                onValueChange={(v) => updateAccountStatus(v as AccountStatus)}
                disabled={isSelf || actioning}
              >
                <SelectTrigger
                  className={`w-[180px] font-mono ${
                    isLight ? "bg-white border-slate-300" : "bg-[#161b22] border-slate-700"
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["active", "hold", "ban", "inactive"] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {ACCOUNT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleActive}
                disabled={isSelf || actioning}
                className="font-mono"
              >
                {actioning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : user.is_active ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                {user.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
                disabled={isSelf || actioning}
                className="font-mono text-red-600 border-red-500/50 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete user
              </Button>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent className={isLight ? "bg-white border-slate-200" : "bg-[#161b22] border-slate-700"}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete &quot;{user.username}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
