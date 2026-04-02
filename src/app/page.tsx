import { createServerSupabase } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { FeedPage } from "@/components/feed/FeedPage";
import { LandingPage } from "@/components/marketing/LandingPage";

export default async function Home() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AppShell>
      <FeedPage />
    </AppShell>
  );
}
