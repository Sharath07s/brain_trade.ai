# BrainTrade AI 🧠📈

A real-time AI trading intelligence system that combines stock market data, financial news, and human sentiment to predict and explain stock movements.

## 🌟 Hackathon-Winning Features
*   **Premium Glassmorphic UI**: Built with React (Vite), Tailwind CSS v3, and Framer Motion.
*   **Real-time Stock Data**: Fetches and charts real-time and historical data (via `yfinance`).
*   **AI Explainability Engine**: SHAP-style insights that actually explain *why* an AI model made a prediction.
*   **Sentiment Aggregation**: Combines mock/real News & Social signals into an overall Market Mood.

## 🏗️ Folder Structure
```
BrainTrade/
├── backend/            # FastAPI python application
│   ├── main.py         # Entry point
│   ├── routers/        # API route definitions
│   ├── services/       # Integration to yfinance, NLP, and AI mocking
│   └── database/       # Supabase connection client
├── frontend/           # React setup
│   ├── src/
│   │   ├── components/ # Granular UI pieces
│   │   ├── services/   # Fetches from backend
│   │   └── App.tsx     # Main dashboard interface
└── schema.sql          # Supabase SQL commands
```

## 🚀 Setup Instructions

### 1. Database (Supabase) Setup
1. Create a [Supabase](https://supabase.com) project.
2. Go to the SQL Editor and run the script found in `schema.sql`.
3. In `backend/.env`, paste your Supabase URL and keys.

### 2. Backend (FastAPI Python)
Open a terminal in the `backend` directory.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the API server
uvicorn main:app --reload --port 8000
```

### 3. Frontend (React Vite)
Open a second terminal in the `frontend` directory.

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to experience the dashboard. If default data doesn't load immediately, use the AI Search bar to pull data for TSLA, AAPL, or NVDA.

## 🚀 Deployment Guide
**Frontend (Vercel):**
1. Push this repository to GitHub.
2. Link the repository to your Vercel account.
3. Set path to `frontend` and let it build.

**Backend (Render / Supabase Edge):**
1. Push the `backend` code to GitHub.
2. On Render.com, create a new "Web Service".
3. Use the startup command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all environment variables (Supabase Keys, NewsAPI Keys, etc.).

---
*Built perfectly for high-impact hackathon execution.*
# brain_trade_ai
