import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useStatus } from "@/lib/status-context";
import { sendBulkMessages, getGuildMembers, getGuilds } from "@/lib/discord";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiscordGuildMember, DiscordGuild } from "@/types/discord";
import { Loader2, Search, Users, User, ServerIcon } from "lucide-react";

export function BulkMessagePanel() {
  const [userIds, setUserIds] = useState("");
  const [message, setMessage] = useState("");
  const [useDelay, setUseDelay] = useState(false);
  const [delay, setDelay] = useState(2);
  const [sending, setSending] = useState(false);
  const [tabValue, setTabValue] = useState("manual");
  
  // Server members selection states
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [members, setMembers] = useState<DiscordGuildMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  
  const { token } = useAuth();
  const { 
    addMessageStatus, 
    startBulkProgress, 
    updateBulkProgress, 
    endBulkProgress 
  } = useStatus();
  const { toast } = useToast();
  
  // Fetch guilds when token is available
  useEffect(() => {
    if (token && tabValue === "server") {
      fetchGuilds();
    }
  }, [token, tabValue]);
  
  // Fetch bot's guilds
  const fetchGuilds = async () => {
    if (!token) return;
    
    setLoadingGuilds(true);
    try {
      const guildList = await getGuilds(token);
      setGuilds(guildList);
    } catch (error) {
      console.error("Error fetching guilds:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load servers",
        variant: "destructive",
      });
    } finally {
      setLoadingGuilds(false);
    }
  };

  // Load server members
  const handleLoadMembers = async () => {
    if (!guildId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a server ID",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{17,19}$/.test(guildId)) {
      toast({
        title: "Error",
        description: "Invalid server ID format",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setMembers([]);
    setSelectedMembers({});

    try {
      const membersList = await getGuildMembers(token, guildId);
      setMembers(membersList);
      toast({
        title: "Success",
        description: `Loaded ${membersList.length} members from server`,
      });
    } catch (error) {
      console.error("Error loading server members:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load server members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection for a specific member
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  // Select or deselect all members
  const toggleSelectAll = () => {
    if (Object.values(selectedMembers).some(selected => selected)) {
      // If any are selected, deselect all
      setSelectedMembers({});
    } else {
      // Select all
      const allSelected = members.reduce((acc, member) => {
        acc[member.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedMembers(allSelected);
    }
  };

  // Get selected user IDs from either manual input or member selection
  const getSelectedUserIds = (): string[] => {
    if (tabValue === "manual") {
      return userIds.split(",")
        .map(id => id.trim())
        .filter(id => id.length > 0 && /^\d{17,19}$/.test(id));
    } else {
      return Object.entries(selectedMembers)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);
    }
  };

  // Filter members by search term
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return member.username.toLowerCase().includes(searchLower) || 
           (member.nickname?.toLowerCase().includes(searchLower));
  });

  const handleSendBulkMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }
    
    // Get selected user IDs from either manual input or member selection
    const idsArray = getSelectedUserIds();
    
    if (idsArray.length === 0) {
      toast({
        title: "Error",
        description: tabValue === "manual" 
          ? "Please enter at least one valid user ID" 
          : "Please select at least one server member",
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
          <Tabs 
            defaultValue="manual" 
            value={tabValue} 
            onValueChange={setTabValue}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full mb-4 bg-discord-bg-dark">
              <TabsTrigger 
                value="manual" 
                className="data-[state=active]:bg-discord-blue"
              >
                Manual IDs
              </TabsTrigger>
              <TabsTrigger 
                value="server" 
                className="data-[state=active]:bg-discord-blue"
              >
                Server Members
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div>
                <Label htmlFor="user-ids" className="text-gray-300 mb-1">User IDs</Label>
                <Textarea
                  id="user-ids"
                  rows={2}
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  className="bg-white border border-gray-300 text-black font-mono text-sm"
                  placeholder="Enter Discord user IDs (comma separated)"
                />
                <p className="mt-1 text-xs text-gray-500">Separate IDs with commas, e.g. 123456789,987654321</p>
              </div>
            </TabsContent>
            
            <TabsContent value="server" className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="server-select" className="text-gray-300 mb-1">Select Server</Label>
                  {loadingGuilds ? (
                    <div className="flex items-center space-x-2 text-sm text-gray-400 mt-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading servers...</span>
                    </div>
                  ) : guilds.length > 0 ? (
                    <Select 
                      value={guildId} 
                      onValueChange={(value) => {
                        setGuildId(value);
                        setMembers([]);
                        setSelectedMembers({});
                      }}
                    >
                      <SelectTrigger className="w-full bg-white text-black">
                        <SelectValue placeholder="Choose a server" />
                      </SelectTrigger>
                      <SelectContent>
                        {guilds.map(guild => (
                          <SelectItem key={guild.id} value={guild.id} className="text-black">
                            {guild.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : token ? (
                    <div className="text-sm text-gray-400 mt-2">
                      No servers found. Your bot may not be in any servers.
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 mt-2">
                      Please authenticate with your bot token first.
                    </div>
                  )}
                </div>
                <div className="pt-6">
                  <Button 
                    type="button" 
                    onClick={handleLoadMembers}
                    disabled={loading || !guildId || !token}
                    variant="outline"
                    className="h-10"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                    Load Members
                  </Button>
                </div>
              </div>
              
              {members.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-white border border-gray-300 text-black"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={toggleSelectAll}
                      className="ml-2 whitespace-nowrap"
                    >
                      {Object.values(selectedMembers).some(selected => selected) 
                        ? "Deselect All" 
                        : "Select All"}
                    </Button>
                  </div>
                  
                  <Card className="bg-discord-bg-dark border-gray-700">
                    <ScrollArea className="h-48 p-2">
                      {filteredMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <p>No members found</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredMembers.map(member => (
                            <div 
                              key={member.id}
                              className="flex items-center p-2 rounded hover:bg-discord-bg-medium cursor-pointer"
                              onClick={() => toggleMemberSelection(member.id)}
                            >
                              <Checkbox 
                                checked={!!selectedMembers[member.id]} 
                                onCheckedChange={() => toggleMemberSelection(member.id)}
                                className="mr-2 h-4 w-4"
                              />
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              <div>
                                <span className="text-white">
                                  {member.username}
                                  {member.discriminator ? `#${member.discriminator}` : ""}
                                </span>
                                {member.nickname && (
                                  <span className="text-gray-400 ml-2 text-sm">
                                    ({member.nickname})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </Card>
                  
                  <div className="text-sm text-gray-400">
                    Selected: {Object.values(selectedMembers).filter(Boolean).length} of {members.length} members
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
          
          <div>
            <Label htmlFor="bulk-message" className="text-gray-300 mb-1">Message</Label>
            <Textarea
              id="bulk-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white border border-gray-300 text-black text-sm resize-none"
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
                  className="w-16 bg-white border border-gray-300 rounded-md py-1 px-2 text-black text-sm"
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
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
