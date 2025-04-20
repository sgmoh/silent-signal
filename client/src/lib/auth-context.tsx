import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { validateBotToken } from "./discord";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string;
  authenticateBot: (token: string) => Promise<boolean>;
  disconnectBot: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const { toast } = useToast();

  // Check for saved token on initial load
  useEffect(() => {
    const savedToken = sessionStorage.getItem("botToken");
    if (savedToken) {
      authenticateBot(savedToken);
    }
  }, []);

  const authenticateBot = async (token: string): Promise<boolean> => {
    try {
      // Try to validate token with Discord
      const validToken = await validateBotToken(token);
      
      if (validToken) {
        // Save token in session storage (client-side only)
        sessionStorage.setItem("botToken", token);
        setToken(token);
        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Bot connected successfully!",
          variant: "success",
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: "Invalid token or missing permissions",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: "Failed to authenticate with Discord",
        variant: "destructive",
      });
      return false;
    }
  };

  const disconnectBot = () => {
    setToken("");
    setIsAuthenticated(false);
    sessionStorage.removeItem("botToken");
    toast({
      title: "Info",
      description: "Bot disconnected",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        authenticateBot,
        disconnectBot,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
