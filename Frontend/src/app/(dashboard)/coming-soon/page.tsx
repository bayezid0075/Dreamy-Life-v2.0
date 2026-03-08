"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rocket, ArrowLeft, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ComingSoonPage() {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Vibrant coming soon card - warm gradient */}
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:20px_20px] opacity-60 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-400/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <CardHeader className="relative text-center pb-2">
            <div className="mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/30 backdrop-blur-sm border-2 border-white/50 shadow-xl mb-4">
              <Rocket className="h-10 w-10 sm:h-12 sm:w-12 text-white" strokeWidth={2} />
            </div>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-md tracking-tight">
              Coming Soon
            </CardTitle>
            <CardDescription className="text-white/95 text-base sm:text-lg mt-2 font-medium max-w-sm mx-auto">
              We&apos;re building something exciting. Stay tuned for updates!
            </CardDescription>
          </CardHeader>

          <CardContent className="relative flex flex-col gap-3 pt-6">
            <div className="flex flex-wrap justify-center gap-2">
              {["New features", "Better experience", "More rewards"].map((label, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/25 text-white border border-white/40 backdrop-blur-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>

            <Button
              asChild
              variant="secondary"
              className="w-full h-12 rounded-xl bg-white/95 text-orange-600 hover:bg-white font-semibold mt-4 border-0 shadow-lg"
            >
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Back to Dashboard
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full text-white/95 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={() => router.back()}
            >
              Go back
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Follow us for early access and updates.
        </p>
      </div>
    </div>
  );
}
