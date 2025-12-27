"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { Page } from "components/shared/Page";
import { Card, Button, Input, Select, Checkbox, Spinner } from "components/ui";
import axios from "utils/axios";

export default function AdminEditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [referralCodes, setReferralCodes] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      phone_number: "",
      password: "",
      is_active: true,
      is_staff: false,
      is_superuser: false,
      referred_by: "",
    },
  });

  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: errorsInfo },
    setValue: setValueInfo,
    getValues: getValuesInfo,
  } = useForm({
    defaultValues: {
      member_status: "user",
      is_verified: false,
      profile_picture: "",
      address: "",
      nid_or_brid: "",
      profession: "",
      blood_group: "",
      gender: "",
      marital_status: "",
      father_name: "",
      mother_name: "",
      working_place: "",
    },
  });

  useEffect(() => {
    fetchReferralCodes();
    fetchUser();
  }, [userId]);

  const fetchReferralCodes = async () => {
    try {
      const response = await axios.get("/api/admin/users/");
      const users = response.data.results || response.data;
      const codes = users
        .filter((u) => u.info?.own_refercode && u.id !== parseInt(userId))
        .map((u) => ({
          label: `${u.username} (${u.info.own_refercode})`,
          value: u.info.own_refercode,
        }));
      setReferralCodes(codes);
    } catch (error) {
      console.error("Error fetching referral codes:", error);
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/${userId}/`);
      const user = response.data;

      setUserInfo(user.info);
      setValue("username", user.username || "");
      setValue("email", user.email || "");
      setValue("phone_number", user.phone_number || "");
      setValue("is_active", user.is_active || false);
      setValue("is_staff", user.is_staff || false);
      setValue("is_superuser", user.is_superuser || false);

      if (user.referred_by) {
        // Find referral code for referred_by user
        const usersResponse = await axios.get("/api/admin/users/");
        const users = usersResponse.data.results || usersResponse.data;
        const referredUser = users.find((u) => u.id === user.referred_by);
        if (referredUser?.info?.own_refercode) {
          setValue("referred_by", referredUser.info.own_refercode);
        }
      }

      if (user.info) {
        setValueInfo("member_status", user.info.member_status || "user");
        setValueInfo("is_verified", user.info.is_verified || false);
        setValueInfo("profile_picture", user.info.profile_picture || "");
        setValueInfo("address", user.info.address || "");
        setValueInfo("nid_or_brid", user.info.nid_or_brid || "");
        setValueInfo("profession", user.info.profession || "");
        setValueInfo("blood_group", user.info.blood_group || "");
        setValueInfo("gender", user.info.gender || "");
        setValueInfo("marital_status", user.info.marital_status || "");
        setValueInfo("father_name", user.info.father_name || "");
        setValueInfo("mother_name", user.info.mother_name || "");
        setValueInfo("working_place", user.info.working_place || "");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user", {
        description: error.response?.data?.detail || "Please try again",
      });
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      const submitData = {
        username: data.username,
        email: data.email,
        phone_number: data.phone_number,
        is_active: data.is_active,
        is_staff: data.is_staff,
        is_superuser: data.is_superuser,
      };

      // Update password only if provided
      if (data.password && data.password.trim()) {
        submitData.password = data.password;
      }

      // Handle referred_by - find user by referral code
      if (data.referred_by) {
        try {
          const usersResponse = await axios.get("/api/admin/users/");
          const users = usersResponse.data.results || usersResponse.data;
          const referredUser = users.find(
            (u) => u.info?.own_refercode === data.referred_by
          );
          if (referredUser) {
            submitData.referred_by = referredUser.id;
          }
        } catch (error) {
          console.error("Error finding referred user:", error);
        }
      }

      // Get UserInfo data from form
      const infoValues = getValuesInfo();
      const infoData = {
        member_status: infoValues.member_status || userInfo?.member_status || 'user',
        is_verified: infoValues.is_verified || userInfo?.is_verified || false,
        profile_picture: infoValues.profile_picture || userInfo?.profile_picture || '',
        address: infoValues.address || userInfo?.address || '',
        nid_or_brid: infoValues.nid_or_brid || userInfo?.nid_or_brid || '',
        profession: infoValues.profession || userInfo?.profession || '',
        blood_group: infoValues.blood_group || userInfo?.blood_group || '',
        gender: infoValues.gender || userInfo?.gender || '',
        marital_status: infoValues.marital_status || userInfo?.marital_status || '',
        father_name: infoValues.father_name || userInfo?.father_name || '',
        mother_name: infoValues.mother_name || userInfo?.mother_name || '',
        working_place: infoValues.working_place || userInfo?.working_place || '',
      };

      submitData.info = infoData;

      await axios.put(`/api/admin/users/${userId}/`, submitData);

      toast.success("User updated successfully!");
      router.push("/admin/users");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user", {
        description:
          error.response?.data?.detail ||
          Object.values(error.response?.data || {})[0]?.[0] ||
          "Please check all fields and try again",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page title="Edit User">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  const memberStatusOptions = [
    { label: "User", value: "user" },
    { label: "Basic", value: "Basic" },
    { label: "Standard", value: "Standard" },
    { label: "Smart", value: "Smart" },
    { label: "VVIP", value: "VVIP" },
  ];

  return (
    <Page title="Edit User">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            onClick={() => router.back()}
            variant="flat"
            isIcon
            className="size-8 sm:size-9"
          >
            <ArrowLeftIcon className="size-4 sm:size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Edit User
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-dark-300 sm:mt-1 sm:text-sm">
              Update user information and permissions
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
            {/* Main Form */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Basic Information
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Input
                    label="Username"
                    placeholder="Enter username"
                    {...register("username", {
                      required: "Username is required",
                      maxLength: {
                        value: 150,
                        message: "Username must be less than 150 characters",
                      },
                    })}
                    error={errors.username?.message}
                  />

                  <Input
                    label="Email"
                    type="email"
                    placeholder="Enter email address"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    error={errors.email?.message}
                  />

                  <Input
                    label="Phone Number"
                    placeholder="Enter phone number"
                    {...register("phone_number", {
                      required: "Phone number is required",
                      maxLength: {
                        value: 20,
                        message: "Phone number must be less than 20 characters",
                      },
                    })}
                    error={errors.phone_number?.message}
                  />

                  <Input
                    label="New Password (Leave blank to keep current)"
                    type="password"
                    placeholder="Enter new password"
                    {...register("password", {
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                    error={errors.password?.message}
                  />
                </div>
              </Card>

              {/* User Info */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  User Profile Information
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Select
                    label="Member Status"
                    data={memberStatusOptions}
                    {...registerInfo("member_status")}
                    onChange={(e) => {
                      setValueInfo("member_status", e.target.value);
                    }}
                    error={errorsInfo.member_status?.message}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <Input
                      label="NID/BRID"
                      placeholder="Enter NID or BRID"
                      {...registerInfo("nid_or_brid")}
                      error={errorsInfo.nid_or_brid?.message}
                    />

                    <Input
                      label="Blood Group"
                      placeholder="e.g., A+, O-"
                      {...registerInfo("blood_group")}
                      error={errorsInfo.blood_group?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <Select
                      label="Gender"
                      data={[
                        { label: "Select", value: "" },
                        { label: "Male", value: "Male" },
                        { label: "Female", value: "Female" },
                        { label: "Other", value: "Other" },
                      ]}
                      {...registerInfo("gender")}
                      onChange={(e) => {
                        setValueInfo("gender", e.target.value);
                      }}
                      error={errorsInfo.gender?.message}
                    />

                    <Select
                      label="Marital Status"
                      data={[
                        { label: "Select", value: "" },
                        { label: "Single", value: "Single" },
                        { label: "Married", value: "Married" },
                        { label: "Divorced", value: "Divorced" },
                        { label: "Widowed", value: "Widowed" },
                      ]}
                      {...registerInfo("marital_status")}
                      onChange={(e) => {
                        setValueInfo("marital_status", e.target.value);
                      }}
                      error={errorsInfo.marital_status?.message}
                    />
                  </div>

                  <Input
                    label="Profession"
                    placeholder="Enter profession"
                    {...registerInfo("profession")}
                    error={errorsInfo.profession?.message}
                  />

                  <Input
                    label="Working Place"
                    placeholder="Enter working place"
                    {...registerInfo("working_place")}
                    error={errorsInfo.working_place?.message}
                  />

                  <Input
                    label="Address"
                    placeholder="Enter address"
                    {...registerInfo("address")}
                    error={errorsInfo.address?.message}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <Input
                      label="Father's Name"
                      placeholder="Enter father's name"
                      {...registerInfo("father_name")}
                      error={errorsInfo.father_name?.message}
                    />

                    <Input
                      label="Mother's Name"
                      placeholder="Enter mother's name"
                      {...registerInfo("mother_name")}
                      error={errorsInfo.mother_name?.message}
                    />
                  </div>
                </div>
              </Card>

              {/* Referral Information */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Referral Information
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Select
                    label="Referred By (Optional)"
                    data={[
                      { label: "None", value: "" },
                      ...referralCodes,
                    ]}
                    {...register("referred_by")}
                    onChange={(e) => {
                      setValue("referred_by", e.target.value);
                    }}
                    error={errors.referred_by?.message}
                  />
                </div>
              </Card>
            </div>

            {/* Sidebar - Permissions & Actions */}
            <div className="space-y-4 sm:space-y-6">
              {/* Permissions */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Permissions
                </h2>
                <div className="space-y-3">
                  <Checkbox
                    label="Active"
                    {...register("is_active")}
                  />
                  <Checkbox
                    label="Staff"
                    {...register("is_staff")}
                  />
                  <Checkbox
                    label="Superuser (Admin)"
                    {...register("is_superuser")}
                  />
                  <Checkbox
                    label="Verified"
                    {...registerInfo("is_verified")}
                  />
                </div>
              </Card>

              {/* User Info Display */}
              {userInfo && (
                <Card className="p-4 sm:p-6">
                  <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                    Additional Info
                  </h2>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-dark-400">Referral Code</p>
                      <p className="font-medium text-gray-900 dark:text-dark-50">
                        {userInfo.own_refercode || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-dark-400">Level</p>
                      <p className="font-medium text-gray-900 dark:text-dark-50">
                        {userInfo.level || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-dark-400">Created At</p>
                      <p className="font-medium text-gray-900 dark:text-dark-50">
                        {new Date(userInfo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Actions */}
              <Card className="p-4 sm:p-6 sticky top-4">
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    type="submit"
                    color="primary"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    variant="outlined"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}

