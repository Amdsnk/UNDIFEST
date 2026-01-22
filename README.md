# UNDIFEST - Event Lottery Platform

A mobile-first lottery platform for PT. Undian Festival Indonesia where users purchase e-books that serve as lottery tickets for prizes.

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Wouter, TanStack Query, Shadcn UI
- **Backend**: Express.js + TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon or Railway)
- **Design**: Mobile-first (max 540px), dark navy theme

## Features

- 📱 Mobile-optimized responsive design
- 🎫 E-book purchase as lottery tickets
- 🔐 OTP-based user authentication
- 👨‍💼 Admin panel for event management
- 🎨 Branded card templates (Burger King, Yamaha NMAX)
- 📊 Transaction history and winner management

## Quick Start (Local Development)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd UNDIFEST
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and SESSION_SECRET
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:5000
   - Admin login: username `admin`, password `admin123`

## Deployment

### Deploy to Railway (Recommended)

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
1. Push code to GitHub
2. Create new project on [Railway](https://railway.app)
3. Connect your GitHub repository
4. Add environment variables (DATABASE_URL, SESSION_SECRET)
5. Deploy automatically!

### Deploy to Replit

This project was originally built on Replit and includes Replit-specific configuration.

1. Import repository to Replit
2. Replit will auto-configure using `.replit` file
3. Set environment variables in Secrets
4. Click Run

## Environment Variables

Required environment variables:

```env
DATABASE_URL=postgresql://...          # PostgreSQL connection string
SESSION_SECRET=your-secret-key         # JWT secret (generate random string)
NODE_ENV=production                    # Environment mode
PORT=5000                              # Server port (auto-set by Railway)
```

## Project Structure

```
UNDIFEST/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities and hooks
│   └── index.html
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication logic
│   └── db.ts            # Database connection
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema
├── attached_assets/     # Static assets
├── railway.json         # Railway deployment config
├── nixpacks.toml        # Build configuration
└── package.json         # Dependencies and scripts
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - Type check with TypeScript

## Default Admin Credentials

**⚠️ Change these in production!**

- Username: `admin`
- Password: `admin123`

## API Endpoints

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/events` - List events
- `POST /api/admin/events` - Create event
- `PUT /api/admin/events/:id` - Update event
- `DELETE /api/admin/events/:id` - Delete event

### User
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/events` - List active events
- `POST /api/transactions` - Create transaction

## Security Notes

- OTP authentication for users (6-digit, 5-minute expiration)
- JWT tokens for admin and user sessions
- Bcrypt password hashing for admin accounts
- **Production TODO**: Implement SMS gateway for OTP delivery

## License

MIT

## Support

For deployment issues, see:
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- [Railway Docs](https://docs.railway.app/)
- [Neon Docs](https://neon.tech/docs/)

