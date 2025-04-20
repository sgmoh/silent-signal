import fetch from "node-fetch";
import { DiscordUser } from "@/types/discord";

// Discord API endpoints
const DISCORD_API = "https://discord.com/api/v10";

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

    const data = await response.json();
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
      const errorData = await channelResponse.json();
      throw new Error(`Failed to create DM channel: ${errorData.message || channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json();
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
      const errorData = await messageResponse.json();
      throw new Error(`Failed to send message: ${errorData.message || messageResponse.statusText}`);
    }
  } catch (error) {
    console.error("Error sending Discord DM:", error);
    throw error;
  }
}
