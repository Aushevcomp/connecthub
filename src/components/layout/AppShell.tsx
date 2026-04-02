"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/layout/RightPanel";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthModal } from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  showRightPanel?: boolean;
  maxWidth?: "default" | "wide";
  mainClassName?: string;
}

export function AppShell({
  children,
  showRightPanel = true,
  maxWidth = "default",
  mainClassName,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <div
        className={cn(
          "mx-auto px-4 md:px-6 py-6 pb-28 lg:pb-6 grid grid-cols-1 gap-6",
          maxWidth === "wide" ? "max-w-[1380px]" : "max-w-[1200px]",
          showRightPanel
            ? "lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_300px]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]"
        )}
      >
        <Sidebar />
        <main className={cn("min-w-0", mainClassName)}>{children}</main>
        {showRightPanel && <RightPanel />}
      </div>
      <MobileNav />
      <AuthModal />
    </div>
  );
}
