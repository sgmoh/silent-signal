import fetch from "node-fetch";
import type { DiscordUser, DiscordGuild, DiscordGuildMember } from "@shared/schema";

// Discord API endpoints
const DISCORD_API = "https://discord.com/api/v10";

// Type definitions for Discord API responses
interface DiscordErrorResponse {
  message?: string;
  code?: number;
}

interface DiscordChannelResponse {
  id: string;
  type: number;
  recipients?: { id: string; username: string }[];
}

/**
 * Validates a Discord bot token by attempting to get the bot's information
 */
export async function validateDiscordToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${DISCORD_API}/users/@me`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json() as { bot?: boolean };
    // Verify that the token belongs to a bot
    return data.bot === true;
  } catch (error) {
    console.error("Error validating Discord token:", error);
    return false;
  }
}

/**
 * Get Discord user information
 */
export async function getUserInfo(
  token: string,
  userId: string
): Promise<DiscordUser | null> {
  try {
    const response = await fetch(`${DISCORD_API}/users/${userId}`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not found
      }
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as DiscordUser;
  } catch (error) {
    console.error("Error fetching Discord user info:", error);
    return null;
  }
}

/**
 * Send a direct message to a Discord user via bot token
 */
export async function sendDiscordDM(
  token: string,
  userId: string,
  content: string
): Promise<void> {
  try {
    // Step 1: Create DM channel
    const channelResponse = await fetch(`${DISCORD_API}/users/@me/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: userId }),
    });

    if (!channelResponse.ok) {
      const errorData = await channelResponse.json() as DiscordErrorResponse;
      throw new Error(`Failed to create DM channel: ${errorData.message || channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json() as DiscordChannelResponse;
    const channelId = channelData.id;

    // Step 2: Send message to the DM channel
    const messageResponse = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json() as DiscordErrorResponse;
      throw new Error(`Failed to send message: ${errorData.message || messageResponse.statusText}`);
    }
  } catch (error) {
    console.error("Error sending Discord DM:", error);
    throw error;
  }
}

/**
 * Get a list of guilds (servers) the bot is a member of
 */
export async function getBotGuilds(
  token: string
): Promise<DiscordGuild[]> {
  try {
    const response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json() as DiscordErrorResponse;
      throw new Error(`Failed to fetch guilds: ${errorData.message || response.statusText}`);
    }

    const guilds = await response.json() as any[];
    
    return guilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      permissions: guild.permissions,
      features: guild.features
    }));
  } catch (error) {
    console.error("Error fetching bot guilds:", error);
    throw error;
  }
}

/**
 * Get members of a Discord guild (server)
 */
export async function getGuildMembers(
  token: string,
  guildId: string
): Promise<DiscordGuildMember[]> {
  try {
    const response = await fetch(`${DISCORD_API}/guilds/${guildId}/members?limit=1000`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json() as DiscordErrorResponse;
      throw new Error(`Failed to fetch guild members: ${errorData.message || response.statusText}`);
    }

    const members = await response.json() as any[];
    
    // Filter out bots and format the member data
    return members
      .filter((member) => !member.user.bot)
      .map((member) => ({
        id: member.user.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        avatar: member.user.avatar,
        nickname: member.nick,
        roles: member.roles,
        joinedAt: member.joined_at
      }));
  } catch (error) {
    console.error("Error fetching guild members:", error);
    throw error;
  }
}
