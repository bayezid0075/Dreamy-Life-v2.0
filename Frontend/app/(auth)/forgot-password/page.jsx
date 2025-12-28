"use client";

// Import Dependencies
import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";

// Local Imports
import { Logo } from "components/shared/Logo";
import { Button, Card, Input } from "components/ui";
import { forgotPasswordSchema } from "app/pages/Auth/schema";
import { Page } from "components/shared/Page";
import { SplashScreen } from "components/template/SplashScreen";
import axios from "utils/axios";

// ----------------------------------------------------------------------

function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await axios.post("/api/users/password-reset/request/", {
        email: data.email,
      });

      setIsSubmitted(true);
      toast.success("Email sent!", {
        description: "A password reset link has been sent to your email.",
        duration: 5000,
      });
    } catch (err) {
      // Check if account doesn't exist
      if (err.response?.status === 404 || err.response?.data?.detail?.includes("Account not exist")) {
        toast.error("Account not found", {
          description: "Account not exist under the email",
          duration: 5000,
        });
      } else if (err.response?.status === 500) {
        toast.error("Failed to send email", {
          description: err.response?.data?.detail || "Please try again later.",
          duration: 5000,
        });
      } else {
        toast.error("Error", {
          description: err.response?.data?.detail || "An error occurred. Please try again.",
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Page title="Forgot Password">
        <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
          <div className="w-full max-w-[26rem] p-4 sm:px-5">
            <div className="text-center">
              <Logo className="mx-auto size-16" />
              <div className="mt-4">
                <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                  Check Your Email
                </h2>
                <p className="dark:text-dark-300 mt-2 text-gray-400">
                  We've sent you a password reset link. Please check your email
                  inbox and follow the instructions.
                </p>
              </div>
            </div>
            <Card className="mt-5 rounded-lg p-5 lg:p-7">
              <div className="space-y-4">
                <div className="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    <strong>Didn't receive the email?</strong>
                    <br />
                    Check your spam folder or try again in a few minutes.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  color="primary"
                  variant="outlined"
                >
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Back to Login
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </Page>
    );
  }

  return (
    <Page title="Forgot Password">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                Forgot Password?
              </h2>
              <p className="dark:text-dark-300 text-gray-400">
                No worries! Enter your email address and we'll send you a link
                to reset your password.
              </p>
            </div>
          </div>
          <Card className="mt-5 rounded-lg p-5 lg:p-7">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  placeholder="Enter your email address"
                  type="email"
                  prefix={
                    <EnvelopeIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("email")}
                  error={errors?.email?.message}
                />
              </div>

              <Button
                type="submit"
                className="mt-5 w-full"
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
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

export default function ForgotPassword() {
  return (
    <Suspense
      fallback={
        <Page title="Forgot Password">
          <SplashScreen />
        </Page>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}

