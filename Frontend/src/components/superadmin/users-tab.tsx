"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  UserCheck,
  UserX,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCircle,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { superadminApi } from "@/lib/api";
import type { AdminUserListItem, AdminUserFilters, AccountStatus } from "@/types";
import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type SuperadminTheme = "dark" | "light";

interface SuperadminUsersTabProps {
  theme?: SuperadminTheme;
}

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  hold: "Hold",
  ban: "Ban",
  inactive: "Inactive",
};

export function SuperadminUsersTab({
  theme = "dark",
}: SuperadminUsersTabProps) {
  const isLight = theme === "light";
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminUserFilters>({
    page: 1,
    page_size: 20,
    ordering: "-created_at",
  });
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(
    null
  );
  const [actioningId, setActioningId] = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["superadmin-users", { ...filters, search: search || undefined }],
    queryFn: () =>
      superadminApi.getUsers({
        ...filters,
        search: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const refetchUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
    refetch();
  }, [queryClient, refetch]);

  useEffect(() => {
    const t = setInterval(refetchUsers, 10000);
    return () => clearInterval(t);
  }, [refetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, page: 1 }));
  };

  const setAccountStatus = async (user: AdminUserListItem, newStatus: AccountStatus) => {
    if (user.id === currentUser?.user.id) {
      toast.error("You cannot change your own account status");
      return;
    }
    setActioningId(user.id);
    try {
      await superadminApi.updateUser(user.id, { account_status: newStatus });
      toast.success(`Account status set to ${ACCOUNT_STATUS_LABELS[newStatus]}`);
      refetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to update");
    } finally {
      setActioningId(null);
    }
  };

  const toggleActive = async (user: AdminUserListItem) => {
    if (user.id === currentUser?.user.id) {
      toast.error("You cannot change your own status");
      return;
    }
    setActioningId(user.id);
    try {
      await superadminApi.updateUser(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? "User deactivated" : "User activated");
      refetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to update");
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === currentUser?.user.id) {
      toast.error("You cannot delete your own account");
      setDeleteTarget(null);
      return;
    }
    setActioningId(deleteTarget.id);
    try {
      await superadminApi.deleteUser(deleteTarget.id);
      toast.success("User deleted");
      setDeleteTarget(null);
      refetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to delete");
    } finally {
      setActioningId(null);
    }
  };

  const results = (data?.results ?? []) as AdminUserListItem[];
  const count = data?.count ?? 0;
  const next = data?.next;
  const previous = data?.previous;
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const totalPages = Math.ceil(count / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex gap-2 w-full sm:max-w-sm"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 font-mono text-sm ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400"
                  : "bg-[#161b22] border-slate-700 text-slate-200 placeholder:text-slate-500"
              }`}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className={
              isLight
                ? "border-slate-300 text-slate-700 hover:bg-slate-100 font-mono shrink-0"
                : "border-slate-600 text-slate-300 hover:bg-slate-800 font-mono shrink-0"
            }
          >
            Search
          </Button>
        </form>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={String(filters.is_active ?? "all")}
            onValueChange={(v) =>
              setFilters((f) => ({
                ...f,
                page: 1,
                is_active: v === "all" ? undefined : v === "true",
              }))
            }
          >
            <SelectTrigger
              className={`w-[140px] font-mono text-sm ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800"
                  : "bg-[#161b22] border-slate-700 text-slate-200"
              }`}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.member_status ?? "all"}
            onValueChange={(v) =>
              setFilters((f) => ({
                ...f,
                page: 1,
                member_status: v === "all" ? undefined : v,
              }))
            }
          >
            <SelectTrigger
              className={`w-[130px] font-mono text-sm ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800"
                  : "bg-[#161b22] border-slate-700 text-slate-200"
              }`}
            >
              <SelectValue placeholder="Member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Smart">Smart</SelectItem>
              <SelectItem value="VVIP">VVIP</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => refetchUsers()}
            disabled={isFetching}
            className={
              isLight
                ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
            }
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div
        className={`rounded-lg border overflow-hidden ${
          isLight
            ? "border-slate-200 bg-white shadow-sm"
            : "border-slate-700/80 bg-[#161b22]/50"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2
              className={`w-8 h-8 animate-spin ${
                isLight ? "text-amber-600" : "text-amber-500/60"
              }`}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className={`border-b ${
                      isLight
                        ? "border-slate-200 bg-slate-50"
                        : "border-slate-700/80 bg-slate-800/30"
                    }`}
                  >
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      ID
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      User
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Email / Phone
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Member
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Refer code
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Upline
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Status
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Account status
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold w-16 ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-slate-500"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    results.map((u) => (
                      <tr
                        key={u.id}
                        className={`border-b transition-colors ${
                          isLight
                            ? "border-slate-100 hover:bg-slate-50"
                            : "border-slate-700/50 hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="py-3 px-4 tabular-nums text-slate-500">
                          {u.id}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${
                              isLight ? "text-slate-800" : "text-slate-200"
                            }`}
                          >
                            {u.username}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-xs ${
                            isLight ? "text-slate-600" : "text-slate-400"
                          }`}
                        >
                          <div>{u.email}</div>
                          <div className="text-slate-500">{u.phone_number}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              isLight
                                ? "bg-slate-100 text-slate-700"
                                : "bg-slate-700/50 text-slate-300"
                            }`}
                          >
                            {u.info?.member_status ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono text-xs px-2 py-1 rounded ${
                              isLight
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {u.info?.own_refercode ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.referred_by_username ? (
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`text-sm font-medium ${
                                  isLight ? "text-slate-800" : "text-slate-200"
                                }`}
                              >
                                {u.referred_by_username}
                              </span>
                              {u.referred_by_refercode && (
                                <span
                                  className={`text-xs font-mono ${
                                    isLight
                                      ? "text-slate-500"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {u.referred_by_refercode}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`text-sm ${
                                isLight ? "text-slate-500" : "text-slate-500"
                              }`}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              u.is_active
                                ? isLight
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-emerald-500/20 text-emerald-400"
                                : isLight
                                ? "bg-red-100 text-red-700"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              u.account_status === "hold"
                                ? isLight
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-amber-500/20 text-amber-400"
                                : u.account_status === "ban"
                                ? isLight
                                  ? "bg-red-100 text-red-700"
                                  : "bg-red-500/20 text-red-400"
                                : u.account_status === "inactive"
                                ? isLight
                                  ? "bg-slate-200 text-slate-600"
                                  : "bg-slate-600/30 text-slate-400"
                                : isLight
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {ACCOUNT_STATUS_LABELS[u.account_status ?? "active"]}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${
                                  isLight
                                    ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                    : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                                }`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className={`font-mono text-sm ${
                                isLight
                                  ? "bg-white border-slate-200 text-slate-800"
                                  : "bg-[#161b22] border-slate-700 text-slate-200"
                              }`}
                            >
                              <DropdownMenuItem
                                onClick={() => router.push(`/superadmin/users/${u.id}`)}
                                className={
                                  isLight
                                    ? "focus:bg-slate-100 focus:text-slate-900"
                                    : "focus:bg-slate-800 focus:text-slate-100"
                                }
                              >
                                <UserCircle className="w-4 h-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                  disabled={actioningId === u.id || u.id === currentUser?.user.id}
                                  className={
                                    isLight
                                      ? "focus:bg-slate-100 focus:text-slate-900"
                                      : "focus:bg-slate-800 focus:text-slate-100"
                                  }
                                >
                                  {actioningId === u.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <ShieldAlert className="w-4 h-4 mr-2" />
                                  )}
                                  Set account status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent
                                  className={
                                    isLight
                                      ? "bg-white border-slate-200 text-slate-800"
                                      : "bg-[#161b22] border-slate-700 text-slate-200"
                                  }
                                >
                                  {(["active", "hold", "ban", "inactive"] as const).map((status) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() => setAccountStatus(u, status)}
                                      className={
                                        isLight
                                          ? "focus:bg-slate-100 focus:text-slate-900"
                                          : "focus:bg-slate-800 focus:text-slate-100"
                                      }
                                    >
                                      {ACCOUNT_STATUS_LABELS[status]}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(u)}
                                disabled={u.id === currentUser?.user.id}
                                className={
                                  isLight
                                    ? "text-red-600 focus:bg-red-50 focus:text-red-700"
                                    : "text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                }
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {count > 0 && (
              <div
                className={`flex items-center justify-between px-4 py-3 border-t text-xs ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-600"
                    : "border-slate-700/80 bg-slate-800/20 text-slate-500"
                }`}
              >
                <span>
                  Showing {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, count)} of {count}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFilters((f) => ({ ...f, page: Math.max(1, page - 1) }))
                    }
                    disabled={!previous}
                    className={`h-8 px-2 disabled:opacity-50 ${
                      isLight
                        ? "text-slate-600 hover:text-amber-600"
                        : "text-slate-400 hover:text-amber-400"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="tabular-nums">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        page: Math.min(totalPages, page + 1),
                      }))
                    }
                    disabled={!next}
                    className={`h-8 px-2 disabled:opacity-50 ${
                      isLight
                        ? "text-slate-600 hover:text-amber-600"
                        : "text-slate-400 hover:text-amber-400"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent
          className={`font-mono ${
            isLight
              ? "bg-white border-slate-200 text-slate-800"
              : "bg-[#161b22] border-slate-700 text-slate-200"
          }`}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className={isLight ? "text-red-600" : "text-red-400"}
            >
              Delete user
            </AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete user &quot;{deleteTarget?.username}&quot;? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={
                isLight
                  ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "border-slate-600 text-slate-300 hover:bg-slate-800"
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
