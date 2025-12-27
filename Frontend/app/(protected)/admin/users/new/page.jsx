"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { Page } from "components/shared/Page";
import { Card, Button, Input, Select, Checkbox } from "components/ui";
import axios from "utils/axios";

export default function AdminNewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [referralCodes, setReferralCodes] = useState([]);

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

  useEffect(() => {
    fetchReferralCodes();
  }, []);

  const fetchReferralCodes = async () => {
    try {
      const response = await axios.get("/api/admin/users/");
      const users = response.data.results || response.data;
      const codes = users
        .filter((u) => u.info?.own_refercode)
        .map((u) => ({
          label: `${u.username} (${u.info.own_refercode})`,
          value: u.info.own_refercode,
        }));
      setReferralCodes(codes);
    } catch (error) {
      console.error("Error fetching referral codes:", error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const submitData = {
        username: data.username,
        email: data.email,
        phone_number: data.phone_number,
        password: data.password,
        is_active: data.is_active,
        is_staff: data.is_staff,
        is_superuser: data.is_superuser,
      };

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

      await axios.post("/api/admin/users/", submitData);

      toast.success("User created successfully!");
      router.push("/admin/users");
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user", {
        description:
          error.response?.data?.detail ||
          Object.values(error.response?.data || {})[0]?.[0] ||
          "Please check all fields and try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Create User">
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
              Create New User
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-dark-300 sm:mt-1 sm:text-sm">
              Add a new user to the system
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
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                    error={errors.password?.message}
                  />
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
                    defaultChecked={true}
                  />
                  <Checkbox
                    label="Staff"
                    {...register("is_staff")}
                  />
                  <Checkbox
                    label="Superuser (Admin)"
                    {...register("is_superuser")}
                  />
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-4 sm:p-6 sticky top-4">
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    type="submit"
                    color="primary"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create User"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    variant="outlined"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    disabled={loading}
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

