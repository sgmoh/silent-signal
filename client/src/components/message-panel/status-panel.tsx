import { useStatus } from "@/lib/status-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export function StatusPanel() {
  const { messageStatus, bulkProgress, clearMessageStatus } = useStatus();
  const { toast } = useToast();

  const handleClearStatus = () => {
    clearMessageStatus();
    toast({
      title: "Info",
      description: "Message history cleared",
    });
  };

  const formatTime = (date: Date | string) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date instanceof Date && !isNaN(date.getTime())
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Invalid time';
  };

  return (
    <div className="mt-6 bg-discord-bg-medium rounded-lg shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Message Status</h2>
        <Button 
          variant="ghost" 
          onClick={handleClearStatus}
          className="text-sm text-gray-400 hover:text-white"
        >
          Clear History
        </Button>
      </div>
      
      <ScrollArea className="h-48 bg-discord-bg-dark rounded-md p-3 text-sm">
        {messageStatus.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Inbox className="w-10 h-10 mb-2" />
            <p>No messages sent yet</p>
          </div>
        ) : (
          messageStatus.map((status, index) => (
            <div 
              key={index}
              className={`mb-2 last:mb-0 p-2 rounded border-l-2 ${
                status.success ? 'border-discord-green' : 'border-discord-red'
              } bg-discord-bg-medium`}
            >
              <div className="flex justify-between">
                <span className="font-medium text-white">
                  {status.success ? 'Message sent to' : 'Failed to send to'} {status.username || 'Unknown User'} ({status.userId})
                </span>
                <span className="text-xs text-gray-400">{formatTime(status.timestamp)}</span>
              </div>
              <p className="mt-1 text-gray-300 truncate">
                {status.success 
                  ? status.message 
                  : `Message delivery failed: ${status.error || 'Unknown error'}`}
              </p>
            </div>
          ))
        )}
      </ScrollArea>
      
      {bulkProgress.inProgress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">Sending messages...</span>
            <span className="text-white">
              {bulkProgress.current}/{bulkProgress.total}
            </span>
          </div>
          <Progress 
            value={(bulkProgress.current / bulkProgress.total) * 100} 
            className="h-2.5 bg-discord-bg-dark"
          />
        </div>
      )}
    </div>
  );
}
