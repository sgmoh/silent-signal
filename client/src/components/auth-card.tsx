import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export function AuthCard() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const { authenticateBot } = useAuth();

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      return;
    }
    
    setLoading(true);
    try {
      await authenticateBot(token);
    } finally {
      setLoading(false);
    }
  };

  const toggleTokenVisibility = () => {
    setShowToken(!showToken);
  };

  return (
    <Card className="bg-discord-bg-medium mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Bot Authentication</h2>
        
        <div className="mb-6">
          <p className="text-gray-300 text-sm mb-4">
            Enter your Discord bot token to use Silent Signal's messaging features. Your token is never stored on our servers.
          </p>
          
          <form onSubmit={handleAuthentication} className="space-y-4">
            <div>
              <Label htmlFor="bot-token" className="text-gray-300 mb-1">Bot Token</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  id="bot-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-discord-bg-dark border border-gray-700 text-white font-mono text-sm focus:ring-discord-blue focus:border-discord-blue"
                  placeholder="Enter your Discord bot token"
                />
                <button 
                  type="button"
                  onClick={toggleTokenVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  {showToken ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Your bot must have the message intent enabled in the Discord Developer Portal.</p>
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-discord-blue hover:bg-opacity-90"
              disabled={loading}
            >
              {loading ? "Connecting..." : "Connect Bot"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
