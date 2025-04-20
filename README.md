# Silent Signal

Silent Signal is a Discord messaging web application that allows users to send direct messages to Discord users via a bot token.

## Features

- ✅ Authentication with Discord bot token
- ✅ Single DM functionality to specific users
- ✅ Bulk messaging to multiple users
- ✅ Server member selection for easier messaging
- ✅ Auto-detection of servers the bot is in
- ✅ Message status tracking and history
- ✅ Rate limiting controls with configurable delays

## Technology Stack

- **Frontend**: React, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM

## Setup and Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/silent-signal.git
cd silent-signal
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with the following variables:
```
DATABASE_URL=postgresql://your-db-connection-string
```

4. Push the database schema
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

## Usage

1. Navigate to the application in your browser
2. Enter your Discord bot token to authenticate
3. Use either the Direct Message or Bulk Message features
4. View message statuses in the Status panel

## Deployment

The application is configured for easy deployment on Replit.

## License

MIT