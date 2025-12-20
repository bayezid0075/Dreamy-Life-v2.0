"use client";

import { useState, useEffect } from "react";
import { Page } from "components/shared/Page";
import { Input, Select, Textarea, Button, Card, Upload } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import axios from "utils/axios";
import {
  UserIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  HomeIcon,
  PhotoIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { HiPencil } from "react-icons/hi";
import { PreviewImg } from "components/shared/PreviewImg";
import { Avatar } from "components/ui";
import clsx from "clsx";

// Gender options
const GENDER_OPTIONS = [
  { label: "Select Gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

// Marital Status options
const MARITAL_STATUS_OPTIONS = [
  { label: "Select Marital Status", value: "" },
  { label: "Single", value: "Single" },
  { label: "Married", value: "Married" },
  { label: "Divorced", value: "Divorced" },
  { label: "Widowed", value: "Widowed" },
];

// Blood Group options
const BLOOD_GROUP_OPTIONS = [
  { label: "Select Blood Group", value: "" },
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

export default function EKYC() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [formData, setFormData] = useState({
    profile_picture: "",
    gender: "",
    marital_status: "",
    blood_group: "",
    nid_or_brid: "",
    father_name: "",
    mother_name: "",
    profession: "",
    working_place: "",
    address: "",
  });

  // Fetch existing user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/users/userinfo/");
        const data = response.data;
        setFormData({
          profile_picture: data.profile_picture || "",
          gender: data.gender || "",
          marital_status: data.marital_status || "",
          blood_group: data.blood_group || "",
          nid_or_brid: data.nid_or_brid || "",
          father_name: data.father_name || "",
          mother_name: data.mother_name || "",
          profession: data.profession || "",
          working_place: data.working_place || "",
          address: data.address || "",
        });
        if (data.profile_picture) {
          setProfilePicture(data.profile_picture);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      // Prepare submit data - only include fields that have values
      const submitData = {};

      // Only include fields that are not empty (allow empty strings for clearing fields)
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submitData[key] = formData[key];
        }
      });

      // Handle profile picture - use the uploaded one if available
      if (profilePicture && typeof profilePicture === "string") {
        if (profilePicture.startsWith("data:")) {
          // If it's a data URL, convert to base64 or send as URL string
          // Backend expects CharField (URL string), so we'll send the data URL
          submitData.profile_picture = profilePicture;
        } else {
          // It's already a URL string
          submitData.profile_picture = profilePicture;
        }
      } else if (formData.profile_picture) {
        submitData.profile_picture = formData.profile_picture;
      }

      console.log("Submitting data:", submitData);

      const response = await axios.post("/api/users/userinfo/", submitData);
      setSuccess(true);
      // Update formData with response to sync state
      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          profile_picture:
            response.data.profile_picture || prev.profile_picture,
          gender: response.data.gender || "",
          marital_status: response.data.marital_status || "",
          blood_group: response.data.blood_group || "",
          nid_or_brid: response.data.nid_or_brid || "",
          father_name: response.data.father_name || "",
          mother_name: response.data.mother_name || "",
          profession: response.data.profession || "",
          working_place: response.data.working_place || "",
          address: response.data.address || "",
        }));
        if (response.data.profile_picture) {
          setProfilePicture(response.data.profile_picture);
        }
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating user info:", error);
      console.error("Error response:", error?.response?.data);

      let errorMessage = "Failed to update information. Please try again.";

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === "object") {
          // Get first error message from validation errors
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === "string") {
            errorMessage = firstError;
          }
        }
      }

      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="eKYC Verification">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="eKYC Verification">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="dark:text-dark-50 text-2xl font-bold text-gray-900">
            eKYC Verification
          </h1>
          <p className="dark:text-dark-300 mt-2 text-sm text-gray-600">
            Complete your Know Your Customer (KYC) information to verify your
            account and unlock all features.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Picture Section */}
          <Card className="dark:border-dark-600 mb-6 overflow-hidden border border-gray-200">
            <div className="dark:border-dark-600 dark:bg-dark-800 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
                Profile Picture
              </h2>
              <p className="dark:text-dark-300 mt-1 text-sm text-gray-600">
                Upload your profile picture
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-6">
                <Avatar
                  size={24}
                  imgComponent={PreviewImg}
                  imgProps={{ file: profilePicture }}
                  src={
                    profilePicture ||
                    formData.profile_picture ||
                    "/images/avatar/avatar-20.jpg"
                  }
                  classNames={{
                    root: "dark:ring-offset-dark-800 rounded-xl ring-2 ring-purple-200 ring-offset-2 ring-offset-white dark:ring-purple-800",
                    display: "rounded-xl",
                  }}
                />
                <div className="flex-1">
                  <Upload
                    name="profile_picture"
                    onChange={(file) => {
                      setProfilePicture(file);
                      // Convert file to URL for preview
                      if (
                        file &&
                        typeof file === "object" &&
                        file instanceof File
                      ) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfilePicture(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    accept="image/*"
                  >
                    {({ ...props }) => (
                      <Button variant="outlined" className="gap-2" {...props}>
                        <PhotoIcon className="size-4" />
                        <span>Upload Photo</span>
                      </Button>
                    )}
                  </Upload>
                  <p className="dark:text-dark-400 mt-2 text-xs text-gray-500">
                    JPG, PNG or GIF. Max size 2MB
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Personal Information Section */}
          <Card className="dark:border-dark-600 mb-6 overflow-hidden border border-gray-200">
            <div className="dark:border-dark-600 dark:bg-dark-800 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
              <p className="dark:text-dark-300 mt-1 text-sm text-gray-600">
                Provide your personal details
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Select
                  label="Gender"
                  data={GENDER_OPTIONS}
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  prefix={<UserIcon className="size-4.5" />}
                  className="rounded-xl"
                />
                <Select
                  label="Marital Status"
                  data={MARITAL_STATUS_OPTIONS}
                  value={formData.marital_status}
                  onChange={(e) =>
                    handleInputChange("marital_status", e.target.value)
                  }
                  prefix={<UserIcon className="size-4.5" />}
                  className="rounded-xl"
                />
                <Select
                  label="Blood Group"
                  data={BLOOD_GROUP_OPTIONS}
                  value={formData.blood_group}
                  onChange={(e) =>
                    handleInputChange("blood_group", e.target.value)
                  }
                  prefix={<UserIcon className="size-4.5" />}
                  className="rounded-xl"
                />
                <Input
                  label="NID / BRID"
                  placeholder="Enter your NID or BRID number"
                  value={formData.nid_or_brid}
                  onChange={(e) =>
                    handleInputChange("nid_or_brid", e.target.value)
                  }
                  prefix={<IdentificationIcon className="size-4.5" />}
                  className="rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Family Information Section */}
          <Card className="dark:border-dark-600 mb-6 overflow-hidden border border-gray-200">
            <div className="dark:border-dark-600 dark:bg-dark-800 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
                Family Information
              </h2>
              <p className="dark:text-dark-300 mt-1 text-sm text-gray-600">
                Provide your family details
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Father's Name"
                  placeholder="Enter your father's name"
                  value={formData.father_name}
                  onChange={(e) =>
                    handleInputChange("father_name", e.target.value)
                  }
                  prefix={<UserIcon className="size-4.5" />}
                  className="rounded-xl"
                />
                <Input
                  label="Mother's Name"
                  placeholder="Enter your mother's name"
                  value={formData.mother_name}
                  onChange={(e) =>
                    handleInputChange("mother_name", e.target.value)
                  }
                  prefix={<UserIcon className="size-4.5" />}
                  className="rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Professional Information Section */}
          <Card className="dark:border-dark-600 mb-6 overflow-hidden border border-gray-200">
            <div className="dark:border-dark-600 dark:bg-dark-800 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
                Professional Information
              </h2>
              <p className="dark:text-dark-300 mt-1 text-sm text-gray-600">
                Provide your professional details
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Profession"
                  placeholder="Enter your profession"
                  value={formData.profession}
                  onChange={(e) =>
                    handleInputChange("profession", e.target.value)
                  }
                  prefix={<UserIcon className="size-4.5" />}
                  className="rounded-xl"
                />
                <Input
                  label="Working Place"
                  placeholder="Enter your working place"
                  value={formData.working_place}
                  onChange={(e) =>
                    handleInputChange("working_place", e.target.value)
                  }
                  prefix={<BuildingOfficeIcon className="size-4.5" />}
                  className="rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Address Information Section */}
          <Card className="dark:border-dark-600 mb-6 overflow-hidden border border-gray-200">
            <div className="dark:border-dark-600 dark:bg-dark-800 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="dark:text-dark-50 text-lg font-semibold text-gray-900">
                Address Information
              </h2>
              <p className="dark:text-dark-300 mt-1 text-sm text-gray-600">
                Provide your complete address
              </p>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="absolute top-9 left-3 z-10 flex h-9 items-center justify-center text-gray-400">
                  <HomeIcon className="size-4.5" />
                </div>
                <Textarea
                  label="Address"
                  placeholder="Enter your complete address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={4}
                  className="rounded-xl pl-11"
                />
              </div>
            </div>
          </Card>

          {/* Success Message */}
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircleIcon className="size-5 shrink-0 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Your information has been updated successfully!
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outlined"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={submitting}
              className="min-w-[8rem]"
            >
              {submitting ? "Saving..." : "Save & Submit"}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
