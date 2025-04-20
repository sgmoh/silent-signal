import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useStatus } from "@/lib/status-context";
import { sendDirectMessage } from "@/lib/discord";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function DirectMessagePanel() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  const { token } = useAuth();
  const { addMessageStatus } = useStatus();
  const { toast } = useToast();

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please enter both user ID and message",
        variant: "destructive",
      });
      return;
    }
    
    // Validate Discord user ID format (numeric, 17-19 digits)
    if (!/^\d{17,19}$/.test(userId)) {
      toast({
        title: "Error",
        description: "Invalid Discord user ID format",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const result = await sendDirectMessage(token, userId, message);
      addMessageStatus(result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Message sent successfully!",
          variant: "success",
        });
        setMessage("");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-discord-bg-medium rounded-lg shadow-lg overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-semibold mb-4 text-white">Direct Message</h2>
        
        <form onSubmit={handleSendDirectMessage} className="space-y-4">
          <div>
            <Label htmlFor="user-id" className="text-gray-300 mb-1">User ID</Label>
            <Input
              type="text"
              id="user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="bg-white border border-gray-300 text-black font-mono text-sm"
              placeholder="Enter Discord user ID"
            />
          </div>
          
          <div>
            <Label htmlFor="dm-message" className="text-gray-300 mb-1">Message</Label>
            <Textarea
              id="dm-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white border border-gray-300 text-black text-sm resize-none"
              placeholder="Type your message here..."
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-discord-blue hover:bg-opacity-90"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
