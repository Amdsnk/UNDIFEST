# Railway Deployment Guide for UNDIFEST

This guide will help you deploy the UNDIFEST application to Railway.

## Prerequisites

1. A [Railway](https://railway.app/) account (sign up with GitHub)
2. A [Neon](https://neon.tech/) PostgreSQL database (or use Railway's PostgreSQL)
3. Git repository with your code

## Step 1: Prepare Your Database

### Option A: Use Neon PostgreSQL (Recommended - Free Tier Available)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)
4. Keep this connection string for later

### Option B: Use Railway PostgreSQL

1. In Railway, create a new PostgreSQL database
2. Railway will automatically provide the `DATABASE_URL` environment variable

## Step 2: Deploy to Railway

### Method 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create a new project on Railway**:
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select your UNDIFEST repository

3. **Railway will automatically**:
   - Detect it's a Node.js project
   - Use the `railway.json` and `nixpacks.toml` configuration
   - Run `npm run build`
   - Start the app with `npm run start`

### Method 2: Deploy from CLI

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize and deploy**:
   ```bash
   railway init
   railway up
   ```

## Step 3: Configure Environment Variables

1. In your Railway project dashboard, go to **Variables** tab
2. Add the following environment variables:

   ```
   DATABASE_URL=<your-neon-or-railway-postgres-connection-string>
   SESSION_SECRET=<generate-a-random-secret-key>
   NODE_ENV=production
   PORT=5000
   ```

   **Important Notes**:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: Generate a secure random string (e.g., use `openssl rand -base64 32`)
   - `PORT`: Railway will automatically set this, but 5000 is the default
   - Railway automatically provides `PORT` variable, so it's optional

3. Click **Save** or **Deploy** to apply changes

## Step 4: Run Database Migrations

After deployment, you need to push your database schema:

### Option A: Using Railway CLI

```bash
railway run npm run db:push
```

### Option B: Using Railway Dashboard

1. Go to your project in Railway
2. Click on your service
3. Go to **Settings** → **Deploy**
4. Add a one-time deploy command: `npm run db:push`
5. Or use the **Shell** tab to run: `npm run db:push`

## Step 5: Verify Deployment

1. **Get your deployment URL**:
   - Railway will provide a URL like: `https://your-app.up.railway.app`
   - Find it in the **Settings** → **Domains** section

2. **Test the application**:
   - Visit your Railway URL
   - Try logging in as admin:
     - Username: `admin`
     - Password: `admin123`
   - Check if the database connection works

## Step 6: Custom Domain (Optional)

1. In Railway dashboard, go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your custom domain
4. Add the CNAME record to your DNS provider as instructed

## Troubleshooting

### Build Fails

- Check the build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (using Node 20)

### Database Connection Issues

- Verify `DATABASE_URL` is correctly set
- Check if your Neon database allows connections
- Ensure the connection string includes `?sslmode=require` for Neon

### Application Won't Start

- Check the deployment logs
- Verify `npm run build` completed successfully
- Ensure `dist/` folder was created with `dist/index.js` and `dist/public/`

### Environment Variables Not Working

- Make sure you clicked **Save** after adding variables
- Redeploy the application after changing variables
- Check variable names match exactly (case-sensitive)

## Important Files for Railway

- `railway.json` - Railway deployment configuration
- `nixpacks.toml` - Build configuration for Nixpacks
- `.railwayignore` - Files to exclude from deployment
- `package.json` - Build and start scripts
- `vite.config.ts` - Updated to work without Replit plugins

## Monitoring and Logs

- **View Logs**: Railway Dashboard → Your Service → **Logs** tab
- **Metrics**: Railway Dashboard → Your Service → **Metrics** tab
- **Shell Access**: Railway Dashboard → Your Service → **Shell** tab

## Cost Considerations

- Railway offers $5 free credit per month
- After free credit, you pay for usage
- Neon PostgreSQL has a generous free tier
- Monitor your usage in Railway dashboard

## Updating Your Application

### Push updates via Git:

```bash
git add .
git commit -m "Your update message"
git push
```

Railway will automatically detect the push and redeploy.

### Manual redeploy:

In Railway dashboard, click **Deploy** → **Redeploy**

## Security Recommendations

1. **Change default admin password** after first login
2. **Use strong SESSION_SECRET** (at least 32 random characters)
3. **Enable HTTPS** (Railway provides this automatically)
4. **Implement SMS OTP** for production (currently returns OTP in API response)
5. **Set up proper CORS** if needed for your domain

## Support

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Neon Docs: https://neon.tech/docs/introduction

---

**Deployment Checklist:**

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Database provisioned (Neon or Railway)
- [ ] Environment variables configured
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Application accessible via Railway URL
- [ ] Admin login tested
- [ ] Default admin password changed

