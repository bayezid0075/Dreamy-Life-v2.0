"use client";

import { AuthGuard } from "./auth-guard";

export default function AuthLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
