"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { Page } from "components/shared/Page";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Card, Button, Input, Select, Table, Spinner } from "components/ui";
import axios from "utils/axios";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    userId: null,
    userName: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    is_active: "",
    is_staff: "",
    member_status: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.is_active) params.append("is_active", filters.is_active);
      if (filters.is_staff) params.append("is_staff", filters.is_staff);
      if (filters.member_status)
        params.append("member_status", filters.member_status);

      const response = await axios.get(
        `/api/admin/users/?${params.toString()}`
      );
      setUsers(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users", {
        description: error.response?.data?.detail || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteModal.userId) return;

    try {
      setDeleteLoading(true);
      await axios.delete(`/api/admin/users/${deleteModal.userId}/`);
      toast.success("User deleted successfully");
      setDeleteModal({ show: false, userId: null, userName: "" });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user", {
        description: error.response?.data?.detail || "Please try again",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Users Management">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Users Management">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Users Management
            </h1>
            <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
              Manage all user accounts and permissions
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/users/new")}
            color="primary"
            className="w-full space-x-2 sm:w-auto"
          >
            <PlusIcon className="size-4 sm:size-5" />
            <span className="text-sm sm:text-base">Add User</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by username, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  prefix={<MagnifyingGlassIcon className="size-4" />}
                />
              </div>
              <Button onClick={handleSearch} color="primary" className="w-full sm:w-auto">
                Search
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                label="Active Status"
                data={[
                  { label: "All", value: "" },
                  { label: "Active", value: "true" },
                  { label: "Inactive", value: "false" },
                ]}
                value={filters.is_active}
                onChange={(e) =>
                  setFilters({ ...filters, is_active: e.target.value })
                }
              />
              <Select
                label="Staff Status"
                data={[
                  { label: "All", value: "" },
                  { label: "Staff", value: "true" },
                  { label: "Non-Staff", value: "false" },
                ]}
                value={filters.is_staff}
                onChange={(e) =>
                  setFilters({ ...filters, is_staff: e.target.value })
                }
              />
              <Select
                label="Member Status"
                data={[
                  { label: "All", value: "" },
                  { label: "User", value: "user" },
                  { label: "Basic", value: "Basic" },
                  { label: "Standard", value: "Standard" },
                  { label: "Smart", value: "Smart" },
                  { label: "VVIP", value: "VVIP" },
                ]}
                value={filters.member_status}
                onChange={(e) =>
                  setFilters({ ...filters, member_status: e.target.value })
                }
              />
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="p-0 sm:p-6">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 sm:py-12">
              <UserIcon className="size-12 text-gray-400 dark:text-dark-400 sm:size-16" />
              <p className="mt-4 text-base font-medium text-gray-900 dark:text-dark-100 sm:text-lg">
                No users found
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
                {search || Object.values(filters).some(f => f)
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first user"}
              </p>
              {!search && !Object.values(filters).some(f => f) && (
                <Button
                  onClick={() => router.push("/admin/users/new")}
                  color="primary"
                  className="mt-4 sm:mt-6"
                >
                  Add Your First User
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block space-y-3 p-3 sm:hidden">
                {users.map((user) => (
                  <Card key={user.id} className="p-3">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-sm text-gray-900 dark:text-dark-50 truncate">
                              {user.username}
                            </div>
                            {user.is_staff && (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Staff
                              </span>
                            )}
                            {user.is_superuser && (
                              <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 truncate">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-dark-400 truncate">
                            {user.phone_number}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-dark-600">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              user.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                          {user.info?.member_status && (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-dark-600 dark:text-dark-200">
                              {user.info.member_status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            variant="flat"
                            isIcon
                            className="size-10"
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            onClick={() =>
                              setDeleteModal({
                                show: true,
                                userId: user.id,
                                userName: user.username,
                              })
                            }
                            variant="flat"
                            color="error"
                            isIcon
                            className="size-10"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto sm:block">
                <Table hoverable className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-600">
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        User
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Contact
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Member Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Role
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Created
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-dark-800"
                      >
                        <td className="px-3 py-4 md:px-4">
                          <div className="font-medium text-sm text-gray-900 dark:text-dark-50">
                            {user.username}
                          </div>
                          {user.referred_by_username && (
                            <div className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                              Referred by: {user.referred_by_username}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-4 md:px-4">
                          <div className="text-xs text-gray-900 dark:text-dark-200 md:text-sm">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-dark-400">
                            {user.phone_number}
                          </div>
                        </td>
                        <td className="px-3 py-4 md:px-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              user.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-4 md:px-4">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-dark-600 dark:text-dark-200">
                            {user.info?.member_status || "user"}
                          </span>
                        </td>
                        <td className="px-3 py-4 md:px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.is_superuser && (
                              <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                Admin
                              </span>
                            )}
                            {user.is_staff && !user.is_superuser && (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Staff
                              </span>
                            )}
                            {!user.is_staff && (
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-dark-600 dark:text-dark-400">
                                User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-xs text-gray-900 dark:text-dark-200 md:px-4 md:text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-4 text-right md:px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              variant="flat"
                              isIcon
                              className="size-8"
                            >
                              <PencilIcon className="size-4" />
                            </Button>
                            <Button
                              onClick={() =>
                                setDeleteModal({
                                  show: true,
                                  userId: user.id,
                                  userName: user.username,
                                })
                              }
                              variant="flat"
                              color="error"
                              isIcon
                              className="size-8"
                            >
                              <TrashIcon className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        onClose={() =>
          setDeleteModal({ show: false, userId: null, userName: "" })
        }
        onOk={handleDelete}
        confirmLoading={deleteLoading}
        state="pending"
        messages={{
          pending: {
            title: "Delete User?",
            description: `Are you sure you want to delete "${deleteModal.userName}"? This action cannot be undone.`,
          },
        }}
      />
    </Page>
  );
}

