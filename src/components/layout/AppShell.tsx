"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/layout/RightPanel";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthModal } from "@/components/auth/AuthModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 pb-28 lg:pb-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_300px] gap-6">
        <Sidebar />
        <main className="min-w-0">{children}</main>
        <RightPanel />
      </div>
      <MobileNav />
      <AuthModal />
    </div>
  );
}
