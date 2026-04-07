-- Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stocks Table
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prices Table (Historical data)
CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(10, 4),
    high DECIMAL(10, 4),
    low DECIMAL(10, 4),
    close DECIMAL(10, 4),
    volume BIGINT,
    UNIQUE(stock_id, timestamp)
);

-- News Table
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    source VARCHAR(255),
    url TEXT,
    sentiment_score DECIMAL(5, 4), 
    sentiment_label VARCHAR(50), -- Positive, Negative, Neutral
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Social / Reddit Table
CREATE TABLE IF NOT EXISTS social (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock VARCHAR(10) NOT NULL,
    platform VARCHAR(50) DEFAULT 'reddit',
    text TEXT NOT NULL,
    sentiment_score DECIMAL(5, 4),
    sentiment_label VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Predictions & Explanations (AI Results)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock VARCHAR(10) NOT NULL,
    prediction VARCHAR(50) NOT NULL, -- UP, DOWN, NEUTRAL
    confidence DECIMAL(5, 4) NOT NULL,
    reasons JSONB NOT NULL, -- { explanations: [...] }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
