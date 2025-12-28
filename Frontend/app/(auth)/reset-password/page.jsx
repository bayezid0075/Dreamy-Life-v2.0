"use client";

// Import Dependencies
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";

// Local Imports
import { Logo } from "components/shared/Logo";
import { Button, Card, Input } from "components/ui";
import { resetPasswordSchema } from "app/pages/Auth/schema";
import { Page } from "components/shared/Page";
import { SplashScreen } from "components/template/SplashScreen";
import axios from "utils/axios";

// ----------------------------------------------------------------------

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        toast.error("Invalid reset link", {
          description: "The password reset link is missing a token.",
          duration: 5000,
        });
        setIsVerifying(false);
        return;
      }

      try {
        const response = await axios.post("/api/users/password-reset/verify/", {
          token,
        });

        if (response.data.valid) {
          setIsVerified(true);
        } else {
          toast.error("Invalid or expired link", {
            description:
              "This password reset link is invalid or has expired. Please request a new one.",
            duration: 5000,
          });
        }
      } catch (err) {
        toast.error("Invalid or expired link", {
          description:
            "This password reset link is invalid or has expired. Please request a new one.",
          duration: 5000,
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/api/users/password-reset/reset/", {
        token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });

      setIsSuccess(true);
      toast.success("Password reset successful!", {
        description: "Your password has been reset. You can now sign in.",
        duration: 5000,
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to reset password. Please try again.";
      toast.error("Reset failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <Page title="Reset Password">
        <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
          <div className="w-full max-w-[26rem] p-4 sm:px-5">
            <div className="text-center">
              <Logo className="mx-auto size-16" />
              <div className="mt-4">
                <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                  Verifying Reset Link
                </h2>
                <p className="dark:text-dark-300 mt-2 text-gray-400">
                  Please wait while we verify your reset link...
                </p>
              </div>
            </div>
          </div>
        </main>
      </Page>
    );
  }

  if (!isVerified) {
    return (
      <Page title="Reset Password">
        <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
          <div className="w-full max-w-[26rem] p-4 sm:px-5">
            <div className="text-center">
              <Logo className="mx-auto size-16" />
              <div className="mt-4">
                <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                  Invalid Reset Link
                </h2>
                <p className="dark:text-dark-300 mt-2 text-gray-400">
                  This password reset link is invalid or has expired.
                </p>
              </div>
            </div>
            <Card className="mt-5 rounded-lg p-5 lg:p-7">
              <div className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-error-50 p-4 dark:bg-error-900/20">
                  <XCircleIcon className="mr-2 size-5 text-error-600 dark:text-error-400" />
                  <p className="text-sm text-error-800 dark:text-error-200">
                    The reset link is invalid or expired
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/forgot-password")}
                  className="w-full"
                  color="primary"
                >
                  Request New Reset Link
                </Button>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  variant="outlined"
                >
                  Back to Login
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </Page>
    );
  }

  if (isSuccess) {
    return (
      <Page title="Reset Password">
        <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
          <div className="w-full max-w-[26rem] p-4 sm:px-5">
            <div className="text-center">
              <Logo className="mx-auto size-16" />
              <div className="mt-4">
                <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                  Password Reset Successful!
                </h2>
                <p className="dark:text-dark-300 mt-2 text-gray-400">
                  Your password has been reset. Redirecting to login...
                </p>
              </div>
            </div>
            <Card className="mt-5 rounded-lg p-5 lg:p-7">
              <div className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
                  <CheckCircleIcon className="mr-2 size-5 text-success-600 dark:text-success-400" />
                  <p className="text-sm text-success-800 dark:text-success-200">
                    Your password has been successfully reset
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  color="primary"
                >
                  Go to Login
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </Page>
    );
  }

  return (
    <Page title="Reset Password">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                Reset Your Password
              </h2>
              <p className="dark:text-dark-300 text-gray-400">
                Enter your new password below
              </p>
            </div>
          </div>
          <Card className="mt-5 rounded-lg p-5 lg:p-7">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              <div className="space-y-4">
                <Input
                  label="New Password"
                  placeholder="Enter your new password"
                  type="password"
                  prefix={
                    <LockClosedIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("new_password")}
                  error={errors?.new_password?.message}
                />
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  type="password"
                  prefix={
                    <LockClosedIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("confirm_password")}
                  error={errors?.confirm_password?.message}
                />
              </div>

              <Button
                type="submit"
                className="mt-5 w-full"
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
            <div className="text-xs-plus mt-4 text-center">
              <p className="line-clamp-1">
                <span>Remember your password?</span>{" "}
                <Link
                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-600 transition-colors"
                  href="/login"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </main>
    </Page>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <Page title="Reset Password">
          <SplashScreen />
        </Page>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

