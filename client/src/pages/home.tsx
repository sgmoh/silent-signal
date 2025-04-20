import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthCard } from "@/components/auth-card";
import { DirectMessagePanel } from "@/components/message-panel/direct-message";
import { BulkMessagePanel } from "@/components/message-panel/bulk-message";
import { StatusPanel } from "@/components/message-panel/status-panel";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-discord-bg-dark text-gray-200">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6">
        <div className="max-w-5xl mx-auto">
          {!isAuthenticated ? (
            <AuthCard />
          ) : (
            <div id="messaging-interface">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DirectMessagePanel />
                <BulkMessagePanel />
              </div>
              
              <StatusPanel />
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
