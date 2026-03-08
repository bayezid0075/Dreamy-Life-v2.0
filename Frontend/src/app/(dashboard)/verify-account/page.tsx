"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyAccountPage() {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Vibrant gradient card - app theme violet/fuchsia/pink */}
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50 pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-400/30 rounded-full blur-2xl" />

          <CardHeader className="relative text-center pb-2">
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm border border-white/40 shadow-lg mb-2">
              <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2} />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm">
              Verify Your Account
            </CardTitle>
            <CardDescription className="text-white/90 text-sm sm:text-base mt-1">
              Get verified to unlock full access, higher commissions, and exclusive features. Choose a membership plan to verify now.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative flex flex-col gap-4 pt-4">
            <Button
              asChild
              className="w-full h-12 sm:h-14 rounded-xl bg-white text-fuchsia-600 hover:bg-white/95 font-semibold text-base shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <Link href="/memberships">
                Go to Membership
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={() => router.back()}
            >
              Back
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have a plan? Complete verification from the membership page.
        </p>
      </div>
    </div>
  );
}
