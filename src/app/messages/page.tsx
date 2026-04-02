import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MessagesPage } from "@/components/messages/MessagesPage";

export default function Messages() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="card p-10 text-center">
            <Loader2 size={24} className="animate-spin text-accent mx-auto mb-3" />
            <p className="text-text-secondary">Загружаем сообщения...</p>
          </div>
        }
      >
        <MessagesPage />
      </Suspense>
    </AppShell>
  );
}
