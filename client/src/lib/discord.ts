import { apiRequest } from "./queryClient";
import { MessageStatusItem, DiscordGuildMember, DiscordGuild } from "../types/discord";

// Validate bot token
export async function validateBotToken(token: string): Promise<boolean> {
  try {
    const response = await apiRequest("POST", "/api/discord/validate-token", { token });
    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

// Send direct message
export async function sendDirectMessage(
  token: string,
  userId: string,
  message: string
): Promise<MessageStatusItem> {
  try {
    const response = await apiRequest("POST", "/api/discord/send-dm", {
      token,
      userId,
      message,
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error sending DM:", error);
    return {
      userId,
      username: null,
      message,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    };
  }
}

// Send bulk messages
export async function sendBulkMessages(
  token: string,
  userIds: string[],
  message: string,
  delay: number = 0,
  progressCallback: (current: number, total: number) => void
): Promise<MessageStatusItem[]> {
  try {
    const response = await apiRequest("POST", "/api/discord/send-bulk", {
      token,
      userIds,
      message,
      delay,
    });
    
    // Process the streaming response for progress updates
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is not readable");
    
    const decoder = new TextDecoder();
    let results: MessageStatusItem[] = [];
    let buffer = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Decode and append to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Split by newlines and process complete messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ""; // Last line might be incomplete
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const result = JSON.parse(line);
          results.push(result);
          progressCallback(results.length, userIds.length);
        } catch (e) {
          console.error("Error parsing streaming response:", e);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error sending bulk messages:", error);
    // Return an array of failed messages
    return userIds.map(userId => ({
      userId,
      username: null,
      message,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date()
    }));
  }
}

// Get bot guilds (servers)
export async function getGuilds(token: string): Promise<DiscordGuild[]> {
  try {
    const response = await apiRequest("POST", "/api/discord/guilds", {
      token,
    });
    
    const data = await response.json();
    return data.guilds;
  } catch (error) {
    console.error("Error fetching bot guilds:", error);
    throw error;
  }
}

// Get guild members
export async function getGuildMembers(
  token: string,
  guildId: string
): Promise<DiscordGuildMember[]> {
  try {
    const response = await apiRequest("POST", "/api/discord/guild-members", {
      token,
      guildId,
    });
    
    const data = await response.json();
    return data.members;
  } catch (error) {
    console.error("Error fetching guild members:", error);
    throw error;
  }
}
