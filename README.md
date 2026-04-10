# Rostov Food Delivery - Telegram Mini App

Premium Telegram Mini App for local food delivery in Rostov-on-Don.

## 🚀 Deployment Instructions (Free Tier)

### 1. PostgreSQL Database (Neon.tech or Render)
- Create a free PostgreSQL database on [Neon.tech](https://neon.tech/) or [Render](https://render.com/).
- Copy your **Connection String** (e.g., `postgresql://user:password@host:port/dbname`).

### 2. Web Service (Render)
- Create a new **Web Service** on [Render](https://render.com/).
- Connect your GitHub repository.
- **Environment Variables**:
  - `DATABASE_URL`: Your PostgreSQL connection string.
  - `NODE_ENV`: `production`.
  - `GEMINI_API_KEY`: (If you use AI features).
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`

### 3. Telegram Bot (BotFather)
- Use `/setdomain` in [@BotFather](https://t.me/BotFather) to set your Render URL as the bot's domain.
- Use `/newapp` to create a Mini App and link it to your Render URL.

## 🛠 Local Development
1. Install dependencies: `npm install`
2. Set up `.env` file with `DATABASE_URL`.
3. Generate Prisma client: `npx prisma generate`
4. Run dev server: `npm run dev`
5. Seed database: Click the **SEED DATA** button in the app.

## 👑 Admin Access
- The user with Telegram ID `1114947252` is automatically granted the **Admin** role upon first login.
