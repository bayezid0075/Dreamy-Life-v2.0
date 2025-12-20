"use client";

// Import Dependencies
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Local Imports
import { Logo } from "components/shared/Logo";
import { Button, Card, Checkbox, Input } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { signupSchema } from "app/pages/Auth/schema";
import { Page } from "components/shared/Page";
import { SplashScreen } from "components/template/SplashScreen";
import { HOME_PATH } from "constants/app.constant";

// ----------------------------------------------------------------------

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, errorMessage, isAuthenticated, isLoading } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      phone_number: "",
      password: "",
      confirmPassword: "",
      referred_by: "",
      acceptTerms: false,
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (isAuthenticated) {
      toast.success("Account created successfully!", {
        description: "Redirecting to your dashboard...",
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
      toast.error("Registration Failed", {
        description:
          errorMessage?.message || errorMessage?.detail || "An error occurred",
        duration: 5000,
      });
    }
  }, [errorMessage]);

  const onSubmit = (data) => {
    const { confirmPassword, acceptTerms, ...signupData } = data;
    // If referred_by is empty, don't send it
    if (!signupData.referred_by || signupData.referred_by.trim() === "") {
      delete signupData.referred_by;
    }
    signup(signupData);
  };

  return (
    <Page title="Sign Up">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center py-4 sm:py-8">
        <div className="w-full max-w-[28rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                Create Account
              </h2>
              <p className="dark:text-dark-300 text-gray-400">
                Sign up to get started
              </p>
            </div>
          </div>
          <Card className="mt-5 rounded-lg p-5 lg:p-7">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              <div className="space-y-4">
                {/* Username */}
                <Input
                  label="Username"
                  placeholder="Enter your username"
                  prefix={
                    <UserIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("username")}
                  error={errors?.username?.message}
                />

                {/* Email */}
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  prefix={
                    <EnvelopeIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("email")}
                  error={errors?.email?.message}
                />

                {/* Phone Number */}
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your phone number"
                  prefix={
                    <PhoneIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("phone_number")}
                  error={errors?.phone_number?.message}
                />

                {/* Password */}
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    prefix={
                      <LockClosedIcon
                        className="size-5 transition-colors duration-200"
                        strokeWidth="1"
                      />
                    }
                    {...register("password")}
                    error={errors?.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="dark:text-dark-400 dark:hover:text-dark-200 absolute top-[2.25rem] right-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg
                        className="size-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="size-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    prefix={
                      <LockClosedIcon
                        className="size-5 transition-colors duration-200"
                        strokeWidth="1"
                      />
                    }
                    {...register("confirmPassword")}
                    error={errors?.confirmPassword?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="dark:text-dark-400 dark:hover:text-dark-200 absolute top-[2.25rem] right-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="size-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="size-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Referral Code (Optional) */}
                <Input
                  label="Referral Code (Optional)"
                  placeholder="Enter referral code if you have one"
                  prefix={
                    <UserCircleIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("referred_by")}
                  error={errors?.referred_by?.message}
                />

                {/* Terms and Conditions */}
                <div className="pt-2">
                  <Checkbox
                    label={
                      <span className="text-sm">
                        I accept the{" "}
                        <a
                          href="#"
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-600 underline transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          Terms and Conditions
                        </a>
                      </span>
                    }
                    {...register("acceptTerms")}
                    error={errors?.acceptTerms?.message}
                  />
                  {errors?.acceptTerms && (
                    <div className="text-error dark:text-error-light mt-1 text-xs">
                      {errors.acceptTerms.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="mt-5 w-full"
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-xs-plus mt-4 text-center">
              <p className="line-clamp-1">
                <span>Already have an account?</span>{" "}
                <a
                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-600 transition-colors"
                  href="/login"
                >
                  Sign in
                </a>
              </p>
            </div>
          </Card>
        </div>
      </main>
    </Page>
  );
}

export default function SignUp() {
  return (
    <Suspense
      fallback={
        <Page title="Sign Up">
          <SplashScreen />
        </Page>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
