import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { validateDiscordToken, sendDiscordDM, getUserInfo, getGuildMembers, getBotGuilds } from "./lib/discord";
import { z } from "zod";
import { dmRequestSchema, bulkDmRequestSchema, validateTokenSchema, messageStatusSchema, guildIdSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for monitoring
  app.get("/api/health", (req, res) => {
    return res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  // Discord token validation
  app.post("/api/discord/validate-token", async (req, res) => {
    try {
      const { token } = validateTokenSchema.parse(req.body);
      const isValid = await validateDiscordToken(token);
      
      return res.json({ valid: isValid });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request format", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to validate token" });
    }
  });

  // Send direct message
  app.post("/api/discord/send-dm", async (req, res) => {
    try {
      const { userId, message, token } = dmRequestSchema.parse(req.body);
      
      // First validate the token
      const isValidToken = await validateDiscordToken(token);
      if (!isValidToken) {
        return res.status(401).json({ 
          userId,
          username: null,
          message,
          success: false,
          error: "Invalid bot token",
          timestamp: new Date()
        });
      }
      
      // Get user info if possible
      let username = null;
      try {
        const userInfo = await getUserInfo(token, userId);
        username = userInfo ? `${userInfo.username}${userInfo.discriminator ? `#${userInfo.discriminator}` : ''}` : null;
      } catch (error) {
        // Continue even if we can't get the username
        console.error("Error fetching user info:", error);
      }
      
      // Try to send the message
      try {
        await sendDiscordDM(token, userId, message);
        
        // If successful, store the message and return success
        await storage.createMessage({
          content: message,
          discordUserId: userId,
          status: "sent"
        });
        
        return res.json({
          userId,
          username,
          message,
          success: true,
          timestamp: new Date()
        });
      } catch (error) {
        // If sending fails, store the error and return failure
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        await storage.createMessage({
          content: message,
          discordUserId: userId,
          status: "failed",
          error: errorMessage
        });
        
        return res.json({
          userId,
          username,
          message,
          success: false,
          error: errorMessage,
          timestamp: new Date()
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request format", errors: error.errors });
      }
      return res.status(500).json({ 
        userId: req.body.userId || "unknown",
        username: null,
        message: req.body.message || "",
        success: false,
        error: "Server error processing request",
        timestamp: new Date()
      });
    }
  });

  // Send bulk messages
  app.post("/api/discord/send-bulk", async (req, res) => {
    try {
      const { userIds, message, token, delay = 0 } = bulkDmRequestSchema.parse(req.body);
      
      // First validate the token
      const isValidToken = await validateDiscordToken(token);
      if (!isValidToken) {
        return res.status(401).json({ message: "Invalid bot token" });
      }
      
      // Set up streaming response
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      // Process each user ID with delay
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        
        // Get user info if possible
        let username = null;
        try {
          const userInfo = await getUserInfo(token, userId);
          username = userInfo ? `${userInfo.username}${userInfo.discriminator ? `#${userInfo.discriminator}` : ''}` : null;
        } catch (error) {
          // Continue even if we can't get the username
          console.error("Error fetching user info:", error);
        }
        
        try {
          // Try to send the message
          await sendDiscordDM(token, userId, message);
          
          // Store the successful message
          await storage.createMessage({
            content: message,
            discordUserId: userId,
            status: "sent"
          });
          
          // Send success response for this user
          const result = messageStatusSchema.parse({
            userId,
            username,
            message,
            success: true,
            timestamp: new Date()
          });
          
          res.write(JSON.stringify(result) + '\n');
        } catch (error) {
          // If sending fails, store the error
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          
          await storage.createMessage({
            content: message,
            discordUserId: userId,
            status: "failed",
            error: errorMessage
          });
          
          // Send failure response for this user
          const result = messageStatusSchema.parse({
            userId,
            username,
            message,
            success: false,
            error: errorMessage,
            timestamp: new Date()
          });
          
          res.write(JSON.stringify(result) + '\n');
        }
        
        // Apply delay between messages if specified and not the last message
        if (delay > 0 && i < userIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
      }
      
      // End the response
      res.end();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request format", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to process bulk messages" });
    }
  });

  // Get bot guilds (servers)
  app.post("/api/discord/guilds", async (req, res) => {
    try {
      const { token } = validateTokenSchema.parse(req.body);
      
      // First validate the token
      const isValidToken = await validateDiscordToken(token);
      if (!isValidToken) {
        return res.status(401).json({ message: "Invalid bot token" });
      }
      
      try {
        const guilds = await getBotGuilds(token);
        return res.json({ guilds });
      } catch (error) {
        console.error("Error fetching bot guilds:", error);
        return res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to fetch bot guilds" 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request format", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get guild members
  app.post("/api/discord/guild-members", async (req, res) => {
    try {
      const { token, guildId } = guildIdSchema.parse(req.body);
      
      // First validate the token
      const isValidToken = await validateDiscordToken(token);
      if (!isValidToken) {
        return res.status(401).json({ message: "Invalid bot token" });
      }
      
      try {
        const members = await getGuildMembers(token, guildId);
        return res.json({ members });
      } catch (error) {
        console.error("Error fetching guild members:", error);
        return res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to fetch guild members" 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request format", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
