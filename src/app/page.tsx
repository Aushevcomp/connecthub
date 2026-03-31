import { AppShell } from "@/components/layout/AppShell";
import { FeedPage } from "@/components/feed/FeedPage";

export default function Home() {
  return (
    <AppShell>
      <FeedPage />
    </AppShell>
  );
}
