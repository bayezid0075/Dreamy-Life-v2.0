"use client";

// Import Dependencies
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";

// Local Imports
import { Logo } from "components/shared/Logo";
import { Button, Card, Checkbox, Input } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { loginSchema } from "app/pages/Auth/schema";
import { Page } from "components/shared/Page";
import { SplashScreen } from "components/template/SplashScreen";
import { HOME_PATH } from "constants/app.constant";

// ----------------------------------------------------------------------

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, errorMessage, isAuthenticated, isLoading } = useAuthContext();
  const [isMounted, setIsMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (isAuthenticated) {
      toast.success("Login successful!", {
        description: "Welcome back! Redirecting to your dashboard...",
        duration: 3000,
      });
      // Redirect after showing success message
      setTimeout(() => {
        const redirectUrl = searchParams.get("redirect") || HOME_PATH;
        router.replace(redirectUrl);
      }, 2000);
    }
  }, [isAuthenticated, isMounted, router, searchParams]);

  // Show error toast when error occurs
  useEffect(() => {
    if (errorMessage && errorMessage?.message) {
      toast.error("Login Failed", {
        description:
          errorMessage?.message || errorMessage?.detail || "An error occurred",
        duration: 5000,
      });
    }
  }, [errorMessage]);

  const onSubmit = (data) => {
    login({
      username: data.username,
      password: data.password,
    });
  };

  return (
    <Page title="Login">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                Welcome Back
              </h2>
              <p className="dark:text-dark-300 text-gray-400">
                Sign in with your email or phone number
              </p>
            </div>
          </div>
          <Card className="mt-5 rounded-lg p-5 lg:p-7">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              <div className="space-y-4">
                <Input
                  label="Email or Phone Number"
                  placeholder="Enter email or phone number"
                  prefix={
                    <EnvelopeIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("username")}
                  error={errors?.username?.message}
                />
                <Input
                  label="Password"
                  placeholder="Enter Password"
                  type="password"
                  prefix={
                    <LockClosedIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("password")}
                  error={errors?.password?.message}
                />
              </div>

              <div className="mt-4 flex items-center justify-between space-x-2">
                <Checkbox label="Remember me" />
                <Link
                  href="/forgot-password"
                  className="dark:text-dark-300 dark:hover:text-dark-100 dark:focus:text-dark-100 text-xs text-gray-400 transition-colors hover:text-gray-800 focus:text-gray-800"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="mt-5 w-full"
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <div className="text-xs-plus mt-4 text-center">
              <p className="line-clamp-1">
                <span>Don't have an account?</span>{" "}
                <a
                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-600 transition-colors"
                  href="/signup"
                >
                  Sign up
                </a>
              </p>
            </div>
          </Card>
          <div className="dark:text-dark-300 mt-8 flex justify-center text-xs text-gray-400">
            <a href="##">Privacy Notice</a>
            <div className="dark:bg-dark-500 mx-2.5 my-0.5 w-px bg-gray-200"></div>
            <a href="##">Term of service</a>
          </div>
        </div>
      </main>
    </Page>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <Page title="Login">
          <SplashScreen />
        </Page>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
