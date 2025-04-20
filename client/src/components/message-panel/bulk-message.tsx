import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useStatus } from "@/lib/status-context";
import { sendBulkMessages } from "@/lib/discord";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export function BulkMessagePanel() {
  const [userIds, setUserIds] = useState("");
  const [message, setMessage] = useState("");
  const [useDelay, setUseDelay] = useState(false);
  const [delay, setDelay] = useState(2);
  const [sending, setSending] = useState(false);
  
  const { token } = useAuth();
  const { 
    addMessageStatus, 
    startBulkProgress, 
    updateBulkProgress, 
    endBulkProgress 
  } = useStatus();
  const { toast } = useToast();

  const handleSendBulkMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userIds.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please enter both user IDs and message",
        variant: "destructive",
      });
      return;
    }
    
    // Parse and validate user IDs
    const idsArray = userIds.split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    if (idsArray.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one valid user ID",
        variant: "destructive",
      });
      return;
    }
    
    // Validate each Discord user ID
    const invalidIds = idsArray.filter(id => !/^\d{17,19}$/.test(id));
    if (invalidIds.length > 0) {
      toast({
        title: "Error",
        description: `Invalid user ID format: ${invalidIds.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    startBulkProgress(idsArray.length);
    
    toast({
      title: "Info",
      description: `Sending messages to ${idsArray.length} users...`,
    });
    
    try {
      const results = await sendBulkMessages(
        token,
        idsArray,
        message,
        useDelay ? delay : 0,
        (current, total) => {
          updateBulkProgress(current);
        }
      );
      
      // Add all results to message status
      results.forEach(result => {
        addMessageStatus(result);
      });
      
      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Bulk Message Complete",
        description: `${successCount}/${results.length} messages sent successfully`,
        variant: successCount === results.length ? "success" : 
                 successCount > 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error sending bulk messages:", error);
      toast({
        title: "Error",
        description: "Failed to complete bulk message operation",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      endBulkProgress();
    }
  };

  return (
    <div className="bg-discord-bg-medium rounded-lg shadow-lg overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-semibold mb-4 text-white">Bulk Message</h2>
        
        <form onSubmit={handleSendBulkMessage} className="space-y-4">
          <div>
            <Label htmlFor="user-ids" className="text-gray-300 mb-1">User IDs</Label>
            <Textarea
              id="user-ids"
              rows={2}
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              className="bg-discord-bg-dark border border-gray-700 text-white font-mono text-sm"
              placeholder="Enter Discord user IDs (comma separated)"
            />
            <p className="mt-1 text-xs text-gray-500">Separate IDs with commas, e.g. 123456789,987654321</p>
          </div>
          
          <div>
            <Label htmlFor="bulk-message" className="text-gray-300 mb-1">Message</Label>
            <Textarea
              id="bulk-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-discord-bg-dark border border-gray-700 text-white text-sm resize-none"
              placeholder="Type your message here..."
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="delay-toggle" 
                checked={useDelay}
                onCheckedChange={(checked) => setUseDelay(checked === true)}
                className="h-4 w-4 rounded border-gray-700 text-discord-blue"
              />
              <Label htmlFor="delay-toggle" className="text-sm text-gray-300">Add delay between messages</Label>
            </div>
            
            {useDelay && (
              <div className="flex items-center">
                <Input
                  type="number"
                  id="delay-seconds"
                  min={1}
                  max={10}
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value) || 1)}
                  className="w-16 bg-discord-bg-dark border border-gray-700 rounded-md py-1 px-2 text-white text-sm"
                />
                <span className="ml-2 text-sm text-gray-300">seconds</span>
              </div>
            )}
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-discord-blue hover:bg-opacity-90"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send to All"}
          </Button>
        </form>
      </div>
    </div>
  );
}
