export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  bot?: boolean;
  system?: boolean;
  banner?: string;
  accent_color?: number;
}

export interface DiscordBot {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  permissions?: string;
  features?: string[];
}

export interface DiscordGuildMember {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  nickname?: string;
  roles: string[];
  joinedAt: string;
}

export interface MessageStatusItem {
  userId: string;
  username: string | null;
  message: string;
  success: boolean;
  error?: string;
  timestamp: Date | string;
}

export interface BulkProgress {
  current: number;
  total: number;
  inProgress: boolean;
}
