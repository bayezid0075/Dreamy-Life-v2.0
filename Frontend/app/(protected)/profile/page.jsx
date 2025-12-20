"use client";

// Import Dependencies
import {
  PhoneIcon,
  XMarkIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  KeyIcon,
  IdentificationIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { HiPencil } from "react-icons/hi";
import {
  TbUser,
  TbCalendar,
  TbWallet,
  TbTrendingUp,
  TbTrendingDown,
  TbCoins,
} from "react-icons/tb";
import dayjs from "dayjs";
import clsx from "clsx";

// Local Imports
import { PreviewImg } from "components/shared/PreviewImg";
import { Page } from "components/shared/Page";
import { Link } from "components/shared/Link";
import {
  Avatar,
  Button,
  Card,
  Input,
  Upload,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
} from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

export default function ProfilePage() {
  const { user } = useAuthContext();
  const [userInfo, setUserInfo] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
    date_joined: "",
    address: "",
    profession: "",
    blood_group: "",
    gender: "",
    marital_status: "",
    father_name: "",
    mother_name: "",
    working_place: "",
    nid_or_brid: "",
  });

  // Calculate income/expenses by time period
  const calculateFinancialData = (transactions) => {
    if (!transactions || transactions.length === 0) {
      return {
        thisMonth: { income: 0, expense: 0 },
        thisYear: { income: 0, expense: 0 },
        allTime: { income: 0, expense: 0 },
      };
    }

    const now = dayjs();
    const startOfMonth = now.startOf("month");
    const startOfYear = now.startOf("year");

    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    let thisYearIncome = 0;
    let thisYearExpense = 0;
    let allTimeIncome = 0;
    let allTimeExpense = 0;

    transactions.forEach((transaction) => {
      const transDate = dayjs(transaction.created_at);
      const amount = parseFloat(transaction.amount) || 0;

      if (transaction.transaction_type === "credit") {
        allTimeIncome += amount;
        if (transDate.isAfter(startOfYear)) {
          thisYearIncome += amount;
        }
        if (transDate.isAfter(startOfMonth)) {
          thisMonthIncome += amount;
        }
      } else if (transaction.transaction_type === "debit") {
        allTimeExpense += amount;
        if (transDate.isAfter(startOfYear)) {
          thisYearExpense += amount;
        }
        if (transDate.isAfter(startOfMonth)) {
          thisMonthExpense += amount;
        }
      }
    });

    return {
      thisMonth: { income: thisMonthIncome, expense: thisMonthExpense },
      thisYear: { income: thisYearIncome, expense: thisYearExpense },
      allTime: { income: allTimeIncome, expense: allTimeExpense },
    };
  };

  // Fetch user info and wallet data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // Fetch user info
        const userResponse = await axios.get("/api/users/userinfo/");
        const userData = userResponse.data;
        setUserInfo(userData);

        // Fetch wallet data
        try {
          const walletResponse = await axios.get("/api/wallets/");
          setWalletData(walletResponse.data);
        } catch (walletError) {
          console.error("Error fetching wallet data:", walletError);
          // Wallet data is optional, continue without it
        }

        // Populate form data
        const userObj = userData?.user || {};
        setFormData({
          username:
            userData?.user?.username ||
            user?.user?.username ||
            user?.username ||
            "",
          email:
            userData?.user?.email || user?.user?.email || user?.email || "",
          phone:
            userData?.user?.phone_number ||
            user?.user?.phone_number ||
            user?.phone_number ||
            "",
          first_name: userObj?.first_name || "",
          last_name: userObj?.last_name || "",
          date_joined: userObj?.date_joined || userData?.created_at || "",
          address: userData?.address || "",
          profession: userData?.profession || "",
          blood_group: userData?.blood_group || "",
          gender: userData?.gender || "",
          marital_status: userData?.marital_status || "",
          father_name: userData?.father_name || "",
          mother_name: userData?.mother_name || "",
          working_place: userData?.working_place || "",
          nid_or_brid: userData?.nid_or_brid || "",
        });
      } catch (error) {
        console.error("Error fetching user info:", error);
        toast.error("Failed to load profile information");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const profilePicture =
    userInfo?.profile_picture || avatar || "/images/avatar/avatar-12.jpg";

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Prepare data for API (only send fields that can be updated)
      const updateData = {
        address: formData.address,
        profession: formData.profession,
        blood_group: formData.blood_group,
        gender: formData.gender,
        marital_status: formData.marital_status,
        father_name: formData.father_name,
        mother_name: formData.mother_name,
        working_place: formData.working_place,
        nid_or_brid: formData.nid_or_brid,
      };

      if (avatar) {
        updateData.profile_picture = avatar;
      }

      await axios.post("/api/users/userinfo/", updateData);
      toast.success("Profile updated successfully");
      setIsEditing(false);

      // Refresh user info
      const response = await axios.get("/api/users/userinfo/");
      setUserInfo(response.data);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userInfo) {
      setFormData({
        username:
          userInfo?.username || user?.user?.username || user?.username || "",
        email: userInfo?.email || user?.user?.email || user?.email || "",
        phone: userInfo?.phone || user?.user?.phone || "",
        first_name: userInfo?.first_name || user?.user?.first_name || "",
        last_name: userInfo?.last_name || user?.user?.last_name || "",
        date_joined: userInfo?.date_joined || user?.user?.date_joined || "",
        address: userInfo?.address || "",
        profession: userInfo?.profession || "",
        blood_group: userInfo?.blood_group || "",
        gender: userInfo?.gender || "",
        marital_status: userInfo?.marital_status || "",
        father_name: userInfo?.father_name || "",
        mother_name: userInfo?.mother_name || "",
        working_place: userInfo?.working_place || "",
        nid_or_brid: userInfo?.nid_or_brid || "",
      });
    }
    setIsEditing(false);
    setAvatar(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="dark:text-dark-300 text-gray-500">
          Loading profile...
        </div>
      </div>
    );
  }

  const fullName =
    `${formData.first_name || ""} ${formData.last_name || ""}`.trim() ||
    formData.username ||
    "User";
  const displayEmail = formData.email || "No email provided";
  const displayPhone = formData.phone || "No phone number";
  const joinedDate = formData.date_joined
    ? dayjs(formData.date_joined).format("MMMM DD, YYYY")
    : "N/A";

  // Calculate financial data
  const financialData = walletData
    ? calculateFinancialData(walletData.transactions || [])
    : {
        thisMonth: { income: 0, expense: 0 },
        thisYear: { income: 0, expense: 0 },
        allTime: { income: 0, expense: 0 },
      };

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const fields = [
      formData.username,
      formData.email,
      formData.phone,
      formData.first_name,
      formData.last_name,
      formData.address,
      formData.profession,
      formData.blood_group,
      formData.gender,
      userInfo?.profile_picture,
    ];
    const filledFields = fields.filter((field) => field && field !== "").length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Page title="Profile">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
        {/* Profile Header Card */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative shrink-0">
              <Avatar
                size={22}
                imgComponent={PreviewImg}
                imgProps={{ file: avatar }}
                src={profilePicture}
                classNames={{
                  root: "ring-primary-600 dark:ring-primary-500 dark:ring-offset-dark-700 rounded-xl ring-offset-[3px] ring-offset-white transition-all hover:ring-3",
                  display: "rounded-xl",
                }}
                indicator={
                  <div className="dark:bg-dark-700 absolute right-0 bottom-0 -m-1 flex items-center justify-center rounded-full bg-white">
                    {avatar ? (
                      <Button
                        onClick={() => setAvatar(null)}
                        isIcon
                        className="size-6 rounded-full"
                      >
                        <XMarkIcon className="size-4" />
                      </Button>
                    ) : (
                      <Upload
                        name="avatar"
                        onChange={setAvatar}
                        accept="image/*"
                      >
                        {({ ...props }) => (
                          <Button
                            isIcon
                            className="size-6 rounded-full"
                            {...props}
                          >
                            <HiPencil className="size-3.5" />
                          </Button>
                        )}
                      </Upload>
                    )}
                  </div>
                }
              />
            </div>
            <div className="w-full min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="dark:text-dark-100 text-lg font-semibold break-words text-gray-800 sm:text-xl">
                  {fullName}
                </h2>
                <Badge color="success" size="sm" className="shrink-0">
                  Active
                </Badge>
              </div>
              <p className="dark:text-dark-300 mb-1 text-sm break-words text-gray-500">
                {displayEmail}
              </p>
              <p className="dark:text-dark-400 text-xs text-gray-400">
                Member since {joinedDate}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  color="primary"
                  className="w-full sm:w-auto"
                >
                  <HiPencil className="mr-2 size-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              ) : (
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    onClick={handleCancel}
                    variant="outlined"
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    color="primary"
                    className="flex-1 sm:flex-none"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Card 2: Account Statistics */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-indigo-100/50 p-0 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-purple-900/20 dark:to-indigo-800/10">
          <Accordion
            defaultValue="statistics"
            transitionDuration={300}
            className="w-full"
          >
            <AccordionItem value="statistics" className="border-0">
              <AccordionButton
                className={clsx(
                  "w-full px-4 py-4 sm:px-6 sm:py-5",
                  "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
                  "dark:from-purple-700 dark:to-indigo-800",
                  "hover:from-purple-600 hover:to-indigo-700",
                  "dark:hover:from-purple-800 dark:hover:to-indigo-900",
                  "transition-all duration-300",
                  "flex items-center justify-between gap-4",
                )}
              >
                {({ open }) => (
                  <>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm sm:size-12">
                        <TbUser className="size-5 text-white sm:size-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-semibold sm:text-lg">
                          Account Statistics
                        </h3>
                        <p className="text-xs text-white/80 sm:text-sm">
                          View your account activity and statistics
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={clsx(
                        "size-5 shrink-0 text-white transition-transform duration-300 sm:size-6",
                        open && "rotate-180",
                      )}
                    />
                  </>
                )}
              </AccordionButton>
              <AccordionPanel className="dark:bg-dark-700/95 bg-white/95 backdrop-blur-sm">
                <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                  <div className="dark:bg-dark-800 dark:hover:bg-dark-750 flex items-center rounded-lg bg-gray-50 p-3 transition-all duration-200 hover:bg-gray-100 sm:p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <div className="shrink-0 rounded-lg bg-purple-100 p-1.5 sm:p-2 dark:bg-purple-900/30">
                        <TbUser className="size-4 text-purple-600 sm:size-5 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="dark:text-dark-300 truncate text-xs text-gray-500 sm:text-sm">
                          Profile Completion
                        </p>
                        <p className="dark:text-dark-100 text-base font-semibold text-gray-800 sm:text-lg">
                          {calculateProfileCompletion()}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="dark:bg-dark-800 dark:hover:bg-dark-750 flex items-center rounded-lg bg-gray-50 p-3 transition-all duration-200 hover:bg-gray-100 sm:p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <div className="shrink-0 rounded-lg bg-indigo-100 p-1.5 sm:p-2 dark:bg-indigo-900/30">
                        <TbCalendar className="size-4 text-indigo-600 sm:size-5 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="dark:text-dark-300 truncate text-xs text-gray-500 sm:text-sm">
                          Account Age
                        </p>
                        <p className="dark:text-dark-100 text-base font-semibold break-words text-gray-800 sm:text-lg">
                          {formData.date_joined
                            ? dayjs().diff(dayjs(formData.date_joined), "day") +
                              " days"
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="dark:bg-dark-800 dark:hover:bg-dark-750 flex items-center rounded-lg bg-gray-50 p-3 transition-all duration-200 hover:bg-gray-100 sm:p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <div className="shrink-0 rounded-lg bg-blue-100 p-1.5 sm:p-2 dark:bg-blue-900/30">
                        <KeyIcon className="size-4 text-blue-600 sm:size-5 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="dark:text-dark-300 truncate text-xs text-gray-500 sm:text-sm">
                          Referral Code
                        </p>
                        <p className="dark:text-dark-100 text-base font-semibold break-words text-gray-800 sm:text-lg">
                          {userInfo?.own_refercode || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="dark:bg-dark-800 dark:hover:bg-dark-750 flex items-center rounded-lg bg-gray-50 p-3 transition-all duration-200 hover:bg-gray-100 sm:p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <div className="shrink-0 rounded-lg bg-amber-100 p-1.5 sm:p-2 dark:bg-amber-900/30">
                        <ShieldCheckIcon className="size-4 text-amber-600 sm:size-5 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="dark:text-dark-300 truncate text-xs text-gray-500 sm:text-sm">
                          Member Status
                        </p>
                        <p className="dark:text-dark-100 text-base font-semibold break-words text-gray-800 sm:text-lg">
                          {userInfo?.member_status || "User"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="dark:bg-dark-800 dark:hover:bg-dark-750 flex items-center rounded-lg bg-gray-50 p-3 transition-all duration-200 hover:bg-gray-100 sm:p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <div className="shrink-0 rounded-lg bg-cyan-100 p-1.5 sm:p-2 dark:bg-cyan-900/30">
                        <UserIcon className="size-4 text-cyan-600 sm:size-5 dark:text-cyan-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="dark:text-dark-300 truncate text-xs text-gray-500 sm:text-sm">
                          Referral Level
                        </p>
                        <p className="dark:text-dark-100 text-base font-semibold break-words text-gray-800 sm:text-lg">
                          Level {userInfo?.level || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Card 3: Income and Expenses */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-teal-50 to-cyan-100/50 p-0 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-teal-900/20 dark:to-cyan-800/10">
          <Accordion
            defaultValue={null}
            transitionDuration={300}
            className="w-full"
          >
            <AccordionItem value="income-expenses" className="border-0">
              <AccordionButton
                className={clsx(
                  "w-full px-4 py-4 sm:px-6 sm:py-5",
                  "bg-gradient-to-r from-teal-500 to-cyan-600 text-white",
                  "dark:from-teal-700 dark:to-cyan-800",
                  "hover:from-teal-600 hover:to-cyan-700",
                  "dark:hover:from-teal-800 dark:hover:to-cyan-900",
                  "transition-all duration-300",
                  "flex items-center justify-between gap-4",
                )}
              >
                {({ open }) => (
                  <>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm sm:size-12">
                        <CurrencyDollarIcon className="size-5 text-white sm:size-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-semibold sm:text-lg">
                          Income and Expenses
                        </h3>
                        <p className="text-xs text-white/80 sm:text-sm">
                          Track your financial transactions
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={clsx(
                        "size-5 shrink-0 text-white transition-transform duration-300 sm:size-6",
                        open && "rotate-180",
                      )}
                    />
                  </>
                )}
              </AccordionButton>
              <AccordionPanel className="dark:bg-dark-700/95 bg-white/95 backdrop-blur-sm">
                <div className="space-y-4 p-4 sm:p-6">
                  {/* Income Section */}
                  <div className="rounded-lg border-2 border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="mb-3 flex items-center gap-2">
                      <ArrowTrendingUpIcon className="size-5 text-green-600 dark:text-green-400" />
                      <h4 className="font-semibold text-green-700 dark:text-green-300">
                        Total Income
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="dark:bg-dark-800 flex items-center justify-between rounded-md bg-white p-3">
                        <span className="dark:text-dark-300 text-sm text-gray-600">
                          This Month
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(financialData.thisMonth.income)}
                        </span>
                      </div>
                      <div className="dark:bg-dark-800 flex items-center justify-between rounded-md bg-white p-3">
                        <span className="dark:text-dark-300 text-sm text-gray-600">
                          This Year
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(financialData.thisYear.income)}
                        </span>
                      </div>
                      <div className="dark:bg-dark-800 flex items-center justify-between rounded-md bg-white p-3">
                        <span className="dark:text-dark-300 text-sm text-gray-600">
                          All Time
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(financialData.allTime.income)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div className="rounded-lg border-2 border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <div className="mb-3 flex items-center gap-2">
                      <ArrowTrendingDownIcon className="size-5 text-red-600 dark:text-red-400" />
                      <h4 className="font-semibold text-red-700 dark:text-red-300">
                        Total Expenses
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="dark:bg-dark-800 flex items-center justify-between rounded-md bg-white p-3">
                        <span className="dark:text-dark-300 text-sm text-gray-600">
                          This Month
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(financialData.thisMonth.expense)}
                        </span>
                      </div>
                      <div className="dark:bg-dark-800 flex items-center justify-between rounded-md bg-white p-3">
                        <span className="dark:text-dark-300 text-sm text-gray-600">
                          This Year
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(financialData.thisYear.expense)}
                        </span>
                      </div>
                      <div className="dark:bg-dark-800 flex items-center justify-between rounded-md bg-white p-3">
                        <span className="dark:text-dark-300 text-sm text-gray-600">
                          All Time
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(financialData.allTime.expense)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Balance */}
                  <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-3 flex items-center gap-2">
                      <TbWallet className="size-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                        Net Balance
                      </h4>
                    </div>
                    <div className="dark:bg-dark-800 rounded-md bg-white p-4">
                      <span className="dark:text-dark-300 text-sm text-gray-600">
                        Current Balance
                      </span>
                      <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {walletData
                          ? formatCurrency(parseFloat(walletData.balance) || 0)
                          : formatCurrency(0)}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Card 4: Account Details */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-rose-50 to-pink-100/50 p-0 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-rose-900/20 dark:to-pink-800/10">
          <Accordion
            defaultValue={null}
            transitionDuration={300}
            className="w-full"
          >
            <AccordionItem value="account-details" className="border-0">
              <AccordionButton
                className={clsx(
                  "w-full px-4 py-4 sm:px-6 sm:py-5",
                  "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
                  "dark:from-rose-700 dark:to-pink-800",
                  "hover:from-rose-600 hover:to-pink-700",
                  "dark:hover:from-rose-800 dark:hover:to-pink-900",
                  "transition-all duration-300",
                  "flex items-center justify-between gap-4",
                )}
              >
                {({ open }) => (
                  <>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm sm:size-12">
                        <ShieldCheckIcon className="size-5 text-white sm:size-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-semibold sm:text-lg">
                          Account Details
                        </h3>
                        <p className="text-xs text-white/80 sm:text-sm">
                          Manage your account information and settings
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={clsx(
                        "size-5 shrink-0 text-white transition-transform duration-300 sm:size-6",
                        open && "rotate-180",
                      )}
                    />
                  </>
                )}
              </AccordionButton>
              <AccordionPanel className="dark:bg-dark-700/95 bg-white/95 backdrop-blur-sm">
                <div className="space-y-4 p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&_.prefix]:pointer-events-none">
                    <Input
                      placeholder="Enter Username"
                      label="Username"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<UserIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<EnvelopeIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Phone Number"
                      label="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<PhoneIcon className="size-4.5" />}
                    />
                    <Input
                      label="Member Since"
                      value={joinedDate}
                      disabled
                      className="rounded-xl"
                      prefix={<CalendarIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Address"
                      label="Address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl sm:col-span-2"
                      prefix={<MapPinIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Profession"
                      label="Profession"
                      value={formData.profession}
                      onChange={(e) =>
                        handleInputChange("profession", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<BuildingOfficeIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Working Place"
                      label="Working Place"
                      value={formData.working_place}
                      onChange={(e) =>
                        handleInputChange("working_place", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<BuildingOfficeIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Blood Group"
                      label="Blood Group"
                      value={formData.blood_group}
                      onChange={(e) =>
                        handleInputChange("blood_group", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<IdentificationIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Gender"
                      label="Gender"
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<UserIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Marital Status"
                      label="Marital Status"
                      value={formData.marital_status}
                      onChange={(e) =>
                        handleInputChange("marital_status", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<UserIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter NID/BRID"
                      label="NID/BRID"
                      value={formData.nid_or_brid}
                      onChange={(e) =>
                        handleInputChange("nid_or_brid", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<IdentificationIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Father's Name"
                      label="Father's Name"
                      value={formData.father_name}
                      onChange={(e) =>
                        handleInputChange("father_name", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<UserIcon className="size-4.5" />}
                    />
                    <Input
                      placeholder="Enter Mother's Name"
                      label="Mother's Name"
                      value={formData.mother_name}
                      onChange={(e) =>
                        handleInputChange("mother_name", e.target.value)
                      }
                      disabled={!isEditing}
                      className="rounded-xl"
                      prefix={<UserIcon className="size-4.5" />}
                    />
                  </div>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Card 5: Settings */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-50 to-purple-100/50 p-0 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-violet-900/20 dark:to-purple-800/10">
          <Accordion
            defaultValue={null}
            transitionDuration={300}
            className="w-full"
          >
            <AccordionItem value="settings" className="border-0">
              <AccordionButton
                className={clsx(
                  "w-full px-4 py-4 sm:px-6 sm:py-5",
                  "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
                  "dark:from-violet-700 dark:to-purple-800",
                  "hover:from-violet-600 hover:to-purple-700",
                  "dark:hover:from-violet-800 dark:hover:to-purple-900",
                  "transition-all duration-300",
                  "flex items-center justify-between gap-4",
                )}
              >
                {({ open }) => (
                  <>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm sm:size-12">
                        <Cog6ToothIcon className="size-5 text-white sm:size-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-semibold sm:text-lg">
                          Settings
                        </h3>
                        <p className="text-xs text-white/80 sm:text-sm">
                          Manage your webapp settings and preferences
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={clsx(
                        "size-5 shrink-0 text-white transition-transform duration-300 sm:size-6",
                        open && "rotate-180",
                      )}
                    />
                  </>
                )}
              </AccordionButton>
              <AccordionPanel className="dark:bg-dark-700/95 bg-white/95 backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <Link
                    to="/settings/appearance"
                    className="flex items-center gap-3 rounded-lg border-2 border-violet-200 bg-violet-50/50 p-4 transition-all duration-200 hover:border-violet-300 hover:bg-violet-100/50 dark:border-violet-800 dark:bg-violet-900/20 dark:hover:border-violet-700 dark:hover:bg-violet-800/30"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <Cog6ToothIcon className="size-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-violet-700 dark:text-violet-300">
                        Appearance Settings
                      </h4>
                      <p className="dark:text-dark-300 text-xs text-gray-600">
                        Customize theme, layout, and display preferences
                      </p>
                    </div>
                    <ChevronDownIcon className="size-5 rotate-[-90deg] text-violet-600 dark:text-violet-400" />
                  </Link>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Card 6: Billing */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-red-100/50 p-0 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-orange-900/20 dark:to-red-800/10">
          <Accordion
            defaultValue={null}
            transitionDuration={300}
            className="w-full"
          >
            <AccordionItem value="billing" className="border-0">
              <AccordionButton
                className={clsx(
                  "w-full px-4 py-4 sm:px-6 sm:py-5",
                  "bg-gradient-to-r from-orange-500 to-red-600 text-white",
                  "dark:from-orange-700 dark:to-red-800",
                  "hover:from-orange-600 hover:to-red-700",
                  "dark:hover:from-orange-800 dark:hover:to-red-900",
                  "transition-all duration-300",
                  "flex items-center justify-between gap-4",
                )}
              >
                {({ open }) => (
                  <>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm sm:size-12">
                        <TbCoins className="size-5 text-white sm:size-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-semibold sm:text-lg">
                          Billing
                        </h3>
                        <p className="text-xs text-white/80 sm:text-sm">
                          View and manage your billing information
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={clsx(
                        "size-5 shrink-0 text-white transition-transform duration-300 sm:size-6",
                        open && "rotate-180",
                      )}
                    />
                  </>
                )}
              </AccordionButton>
              <AccordionPanel className="dark:bg-dark-700/95 bg-white/95 backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <Link
                    to="/settings/billing"
                    className="flex items-center gap-3 rounded-lg border-2 border-orange-200 bg-orange-50/50 p-4 transition-all duration-200 hover:border-orange-300 hover:bg-orange-100/50 dark:border-orange-800 dark:bg-orange-900/20 dark:hover:border-orange-700 dark:hover:bg-orange-800/30"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <TbCoins className="size-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-700 dark:text-orange-300">
                        Billing Information
                      </h4>
                      <p className="dark:text-dark-300 text-xs text-gray-600">
                        Manage your payment methods and billing details
                      </p>
                    </div>
                    <ChevronDownIcon className="size-5 rotate-[-90deg] text-orange-600 dark:text-orange-400" />
                  </Link>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </Page>
  );
}
