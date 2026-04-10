"""
BrainTrade AI Engine v3 — Institutional-Grade Prediction Logic

Each index/stock is classified into an asset profile with distinct weight vectors.
The engine computes SEPARATE bullish and bearish scores, then derives:
  - Direction = UP if bull > bear, DOWN if bear > bull, SIDEWAYS if close
  - Confidence = max(bull, bear) / (bull + bear) * 100

All signals are derived from LIVE data passed in from the prediction router.
"""

import math

# =====================================================================
# INDEX / ASSET WEIGHT PROFILES (configurable)
# =====================================================================
# Each profile defines how much weight each data dimension carries.
# Weights: technical, macro, news, social, volume
# All must sum to 1.0

WEIGHT_PROFILES = {
    "BANKNIFTY": {
        "technical": 0.30,
        "macro":     0.35,
        "news":      0.15,
        "social":    0.10,
        "volume":    0.10,
        "label":     "BANKNIFTY",
        "desc":      "Banking sector — highly sensitive to interest rates, RBI policy, banking liquidity"
    },
    "NIFTY_IT": {
        "technical": 0.30,
        "macro":     0.30,
        "news":      0.10,
        "social":    0.10,
        "volume":    0.20,
        "label":     "NIFTY IT",
        "desc":      "IT sector — highly sensitive to USD/INR, NASDAQ, global tech sentiment"
    },
    "NIFTY_50": {
        "technical": 0.35,
        "macro":     0.25,
        "news":      0.20,
        "social":    0.10,
        "volume":    0.10,
        "label":     "NIFTY 50",
        "desc":      "Balanced broad market — mix of all sectors"
    },
    "SENSEX": {
        "technical": 0.30,
        "macro":     0.30,
        "news":      0.20,
        "social":    0.10,
        "volume":    0.10,
        "label":     "SENSEX",
        "desc":      "Institutional flow driven — large-cap heavy"
    },
    "NIFTY_AUTO": {
        "technical": 0.30,
        "macro":     0.30,
        "news":      0.15,
        "social":    0.10,
        "volume":    0.15,
        "label":     "NIFTY AUTO",
        "desc":      "Auto sector — sensitive to fuel prices, demand, macro consumption"
    },
    "DEFAULT": {
        "technical": 0.35,
        "macro":     0.25,
        "news":      0.20,
        "social":    0.10,
        "volume":    0.10,
        "label":     "Stock",
        "desc":      "Individual equity"
    }
}


def _classify_asset(symbol: str) -> str:
    """Classify a symbol into one of the weight profile keys."""
    sym = symbol.upper()
    
    # Specific index matching first
    if any(k in sym for k in ["NSEBANK", "BANKNIFTY", "BANK_NIFTY"]):
        return "BANKNIFTY"
    if any(k in sym for k in ["CNXIT", "NIFTYIT", "NIFTY_IT"]):
        return "NIFTY_IT"
    if any(k in sym for k in ["CNXAUTO", "NIFTYAUTO", "NIFTY_AUTO"]):
        return "NIFTY_AUTO"
    if any(k in sym for k in ["BSESN", "SENSEX"]):
        return "SENSEX"
    if any(k in sym for k in ["NSEI", "NIFTY_50", "NIFTY50"]):
        return "NIFTY_50"

    # Broad category matching for individual stocks
    if any(k in sym for k in ["HDFC", "ICICI", "KOTAK", "SBI", "AXISBANK", "INDUSINDBK", "BANKBARODA", "PNB"]):
        return "BANKNIFTY"
    if any(k in sym for k in ["INFY", "TCS", "WIPRO", "TECHM", "HCLTECH", "LTIM", "MPHASIS"]):
        return "NIFTY_IT"
    if any(k in sym for k in ["TATAMOTORS", "MARUTI", "BAJAJ-AUTO", "EICHERMOT", "HEROMOTOCO", "ASHOKLEY"]):
        return "NIFTY_AUTO"

    return "DEFAULT"


# =====================================================================
# TECHNICAL INDICATORS (computed from price history)
# =====================================================================

def _compute_rsi(closes: list, period: int = 14) -> float:
    """Compute RSI from a list of close prices."""
    if len(closes) < period + 1:
        return 50.0  # neutral fallback

    gains = []
    losses = []
    for i in range(1, len(closes)):
        delta = closes[i] - closes[i - 1]
        gains.append(max(delta, 0))
        losses.append(abs(min(delta, 0)))

    # Use exponential moving average style
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def _compute_macd(closes: list) -> dict:
    """Compute MACD line, signal line, histogram."""
    def ema(data, period):
        if len(data) < period:
            return data[-1] if data else 0
        multiplier = 2 / (period + 1)
        ema_val = sum(data[:period]) / period
        for price in data[period:]:
            ema_val = (price - ema_val) * multiplier + ema_val
        return ema_val

    if len(closes) < 26:
        return {"macd_line": 0, "signal": 0, "histogram": 0}

    ema12 = ema(closes, 12)
    ema26 = ema(closes, 26)
    macd_line = ema12 - ema26
    
    # For signal we'd need a series; approximate with current values
    signal = macd_line * 0.8  # rough approximation
    histogram = macd_line - signal

    return {"macd_line": macd_line, "signal": signal, "histogram": histogram}


def _compute_atr(history: list, period: int = 14) -> float:
    """Compute Average True Range from OHLC history."""
    if len(history) < 2:
        return 0.0

    true_ranges = []
    for i in range(1, len(history)):
        h = history[i]["high"]
        l = history[i]["low"]
        pc = history[i - 1]["close"]
        tr = max(h - l, abs(h - pc), abs(l - pc))
        true_ranges.append(tr)

    if not true_ranges:
        return 0.0

    # Simple average of last 'period' true ranges
    recent = true_ranges[-period:] if len(true_ranges) >= period else true_ranges
    return sum(recent) / len(recent)


def _compute_vwap(history: list) -> float:
    """Compute VWAP from OHLC+Volume history."""
    total_pv = 0.0
    total_vol = 0.0
    for bar in history:
        typical = (bar["high"] + bar["low"] + bar["close"]) / 3.0
        vol = bar.get("volume", 0)
        total_pv += typical * vol
        total_vol += vol
    return total_pv / total_vol if total_vol > 0 else 0.0


def _compute_volume_strength(history: list) -> float:
    """
    Compute volume strength as ratio of recent volume to average volume.
    Returns a value centered around 1.0 (1.0 = average, >1 = above avg).
    """
    if not history or len(history) < 3:
        return 1.0

    volumes = [h.get("volume", 0) for h in history]
    avg_vol = sum(volumes) / len(volumes) if volumes else 1
    recent_vol = sum(volumes[-3:]) / 3 if len(volumes) >= 3 else volumes[-1]

    if avg_vol == 0:
        return 1.0
    return recent_vol / avg_vol


# =====================================================================
# MAIN ENGINE
# =====================================================================

def predict_stock_movement(
    symbol: str,
    price_data: dict,
    news_data: list,
    social_data: list,
    macro_insights: dict = None,
    global_macro: dict = None
) -> dict:
    """
    Institutional-grade prediction engine.
    
    Computes separate bullish and bearish scores for each data dimension,
    applies index-specific weights, then derives direction and confidence.
    
    Args:
        symbol: The target symbol
        price_data: Dict with 'history' (OHLCV bars), 'current_price', etc.
        news_data: List of news items with 'sentiment_score'
        social_data: List of social posts with 'sentiment_score'
        macro_insights: LLM-derived macro analysis (legacy)
        global_macro: Live global data from global_data.compute_macro_scores()
    """

    asset_key = _classify_asset(symbol)
    profile = WEIGHT_PROFILES[asset_key]
    weights = {
        "technical": profile["technical"],
        "macro":     profile["macro"],
        "news":      profile["news"],
        "social":    profile["social"],
        "volume":    profile["volume"],
    }

    # =================================================================
    # 1. TECHNICAL ANALYSIS
    # =================================================================
    history = []
    closes = []
    price_trend = 0.0
    current_price = 0.0
    open_price = 0.0
    volatility_pct = 0.0
    atr = 0.0
    rsi = 50.0
    macd = {"macd_line": 0, "signal": 0, "histogram": 0}
    vwap = 0.0
    volume_strength = 1.0

    if price_data and not price_data.get("error"):
        history = price_data.get("history", [])
        current_price = price_data.get("current_price", 0)
        open_price = price_data.get("open", current_price)
        closes = [h["close"] for h in history if h.get("close")]

        if len(closes) > 1:
            price_trend = (closes[-1] - closes[0]) / closes[0] if closes[0] != 0 else 0

        # Compute real indicators
        rsi = _compute_rsi(closes)
        macd = _compute_macd(closes)
        atr = _compute_atr(history)
        vwap = _compute_vwap(history)
        volume_strength = _compute_volume_strength(history)

        # Volatility as percentage of price
        if current_price > 0 and atr > 0:
            volatility_pct = (atr / current_price) * 100

    # Technical bullish/bearish scoring
    tech_bull = 0.0
    tech_bear = 0.0

    # RSI signals
    if rsi > 60:
        tech_bull += 0.25
    elif rsi > 50:
        tech_bull += 0.10
    elif rsi < 40:
        tech_bear += 0.25
    elif rsi < 50:
        tech_bear += 0.10

    # Extreme RSI
    if rsi > 75:
        tech_bear += 0.10  # overbought reversal risk
    elif rsi < 25:
        tech_bull += 0.10  # oversold bounce potential

    # MACD signals
    if macd["histogram"] > 0:
        tech_bull += 0.20
    else:
        tech_bear += 0.20

    if macd["macd_line"] > 0:
        tech_bull += 0.10
    else:
        tech_bear += 0.10

    # Price vs VWAP
    if current_price > 0 and vwap > 0:
        if current_price > vwap:
            tech_bull += 0.15
        else:
            tech_bear += 0.15

    # Price trend
    if price_trend > 0.005:
        tech_bull += 0.20
    elif price_trend < -0.005:
        tech_bear += 0.20

    tech_bull = min(tech_bull, 1.0)
    tech_bear = min(tech_bear, 1.0)

    # =================================================================
    # 2. NEWS SENTIMENT
    # =================================================================
    news_bull = 0.0
    news_bear = 0.0
    avg_news = 0.0

    if news_data:
        scores = [n.get("sentiment_score", 0) for n in news_data]
        avg_news = sum(scores) / len(scores)
        pos_count = sum(1 for s in scores if s > 0.05)
        neg_count = sum(1 for s in scores if s < -0.05)
        total = len(scores)

        news_bull = (pos_count / total) * 0.5 + max(avg_news, 0) * 0.5
        news_bear = (neg_count / total) * 0.5 + abs(min(avg_news, 0)) * 0.5

    news_bull = min(news_bull, 1.0)
    news_bear = min(news_bear, 1.0)

    # =================================================================
    # 3. SOCIAL SENTIMENT
    # =================================================================
    social_bull = 0.0
    social_bear = 0.0
    avg_social = 0.0

    if social_data:
        scores = [s.get("sentiment_score", 0) for s in social_data]
        avg_social = sum(scores) / len(scores)
        if avg_social > 0.1:
            social_bull = min(avg_social * 2, 1.0)
        elif avg_social < -0.1:
            social_bear = min(abs(avg_social) * 2, 1.0)
        else:
            social_bull = 0.3
            social_bear = 0.3

    # =================================================================
    # 4. MACRO FACTORS (from live global data)
    # =================================================================
    macro_bull = 0.0
    macro_bear = 0.0
    macro_catalysts = []

    if global_macro:
        macro_bull = global_macro.get("macro_bull", 0)
        macro_bear = global_macro.get("macro_bear", 0)
        macro_catalysts = global_macro.get("catalysts", [])
    elif macro_insights:
        # Legacy fallback
        ms = macro_insights.get("macro_sentiment_score", 0)
        if ms > 0:
            macro_bull = min(ms, 1.0)
        else:
            macro_bear = min(abs(ms), 1.0)
        macro_catalysts = macro_insights.get("macro_catalysts", [])

    # =================================================================
    # 5. VOLUME DIMENSION
    # =================================================================
    vol_bull = 0.0
    vol_bear = 0.0

    if volume_strength > 1.3 and price_trend > 0:
        vol_bull = 0.6  # high volume confirming uptrend
    elif volume_strength > 1.3 and price_trend < 0:
        vol_bear = 0.6  # high volume confirming downtrend
    elif volume_strength < 0.7:
        # Low volume → lack of conviction, slight bearish
        vol_bear = 0.2
    else:
        vol_bull = 0.3
        vol_bear = 0.3

    # =================================================================
    # 6. WEIGHTED AGGREGATION (Bullish vs Bearish)
    # =================================================================
    total_bull = (
        tech_bull * weights["technical"] +
        macro_bull * weights["macro"] +
        news_bull * weights["news"] +
        social_bull * weights["social"] +
        vol_bull * weights["volume"]
    )

    total_bear = (
        tech_bear * weights["technical"] +
        macro_bear * weights["macro"] +
        news_bear * weights["news"] +
        social_bear * weights["social"] +
        vol_bear * weights["volume"]
    )

    # Ensure non-zero denominator
    total_score = total_bull + total_bear
    if total_score == 0:
        total_score = 0.01

    bull_confidence = round((total_bull / total_score) * 100, 1)
    bear_confidence = round((total_bear / total_score) * 100, 1)

    # Direction
    margin = abs(bull_confidence - bear_confidence)
    if margin < 5:
        prediction = "SIDEWAYS"
        confidence = round(max(bull_confidence, bear_confidence), 1)
    elif bull_confidence > bear_confidence:
        prediction = "UP"
        confidence = bull_confidence
    else:
        prediction = "DOWN"
        confidence = bear_confidence

    # =================================================================
    # 7. TRADE SIGNAL
    # =================================================================
    net_score = total_bull - total_bear
    if net_score > 0.15:
        trade_signal = "STRONG BUY"
    elif net_score > 0.05:
        trade_signal = "BUY"
    elif net_score < -0.15:
        trade_signal = "STRONG SELL"
    elif net_score < -0.05:
        trade_signal = "SELL"
    else:
        trade_signal = "HOLD"

    # =================================================================
    # 8. RISK PROFILE (ATR-based)
    # =================================================================
    risk_score = "MEDIUM"
    if volatility_pct > 2.5:
        risk_score = "HIGH"
    elif volatility_pct > 1.0:
        risk_score = "MEDIUM"
    else:
        risk_score = "LOW"

    # Indices have tighter risk bounds
    if asset_key in ("NIFTY_50", "SENSEX", "BANKNIFTY", "NIFTY_IT", "NIFTY_AUTO"):
        if volatility_pct > 1.5:
            risk_score = "HIGH"
        elif volatility_pct > 0.6:
            risk_score = "MEDIUM"
        else:
            risk_score = "LOW"

    # =================================================================
    # 9. SHAP-STYLE FACTORS & EXPLANATIONS
    # =================================================================
    def fmt(v, is_pct=False):
        val = round(v, 2)
        s = f"{val}"
        if is_pct:
            s += "%"
        if val > 0:
            s = "+" + s
        return s

    # Identify dominant factor
    factor_impacts = {
        "Technical": abs(tech_bull - tech_bear) * weights["technical"],
        "Macro":     abs(macro_bull - macro_bear) * weights["macro"],
        "News":      abs(news_bull - news_bear) * weights["news"],
        "Social":    abs(social_bull - social_bear) * weights["social"],
        "Volume":    abs(vol_bull - vol_bear) * weights["volume"],
    }
    dominant_factor = max(factor_impacts, key=factor_impacts.get)

    # Build explanations
    explanations = []

    # Dominant factor explanation — asset-class specific
    if asset_key == "BANKNIFTY":
        if dominant_factor == "Macro":
            explanations.append(f"[DOMINANT: {dominant_factor}] Bond yield movements and RBI policy outlook driving banking sector direction")
        else:
            explanations.append(f"[DOMINANT: {dominant_factor}] {dominant_factor} factors currently overriding macro sensitivity in banking")
    elif asset_key == "NIFTY_IT":
        if dominant_factor == "Macro":
            explanations.append(f"[DOMINANT: {dominant_factor}] NASDAQ trend + USD/INR movement acting as primary IT sector catalyst")
        else:
            explanations.append(f"[DOMINANT: {dominant_factor}] {dominant_factor} signals currently leading IT sector prediction")
    elif asset_key == "SENSEX":
        explanations.append(f"[DOMINANT: {dominant_factor}] Institutional flow patterns and {dominant_factor.lower()} data shaping SENSEX outlook")
    elif asset_key == "NIFTY_AUTO":
        if dominant_factor == "Macro":
            explanations.append(f"[DOMINANT: {dominant_factor}] Fuel prices and consumption demand metrics driving auto sector")
        else:
            explanations.append(f"[DOMINANT: {dominant_factor}] {dominant_factor} indicators leading auto sector prediction")
    else:
        explanations.append(f"[DOMINANT: {dominant_factor}] Primary prediction driver for {symbol}")

    # RSI explanation
    if rsi > 70:
        explanations.append(f"RSI at {round(rsi, 1)} — overbought territory, potential reversal risk")
    elif rsi < 30:
        explanations.append(f"RSI at {round(rsi, 1)} — oversold territory, bounce potential")
    elif rsi > 55:
        explanations.append(f"RSI at {round(rsi, 1)} — bullish momentum intact")
    elif rsi < 45:
        explanations.append(f"RSI at {round(rsi, 1)} — bearish momentum building")

    # Volume explanation
    if volume_strength > 1.5:
        explanations.append(f"Volume surge ({round(volume_strength, 1)}x avg) confirms directional conviction")
    elif volume_strength < 0.6:
        explanations.append(f"Low volume ({round(volume_strength, 1)}x avg) — weak conviction, breakout unlikely")

    # Keep top 4 explanations max
    explanations = explanations[:4]

    # =================================================================
    # 10. FINAL OUTPUT
    # =================================================================

    vol_label = "High" if volume_strength > 1.3 else "Low" if volume_strength < 0.7 else "Normal"
    vol_pct_label = "High" if volatility_pct > 1.5 else "Low" if volatility_pct < 0.5 else "Medium"

    return {
        "symbol": symbol,
        "asset_class": asset_key,
        "prediction": prediction,
        "trade_signal": trade_signal,
        "risk_profile": risk_score,
        "confidence": confidence,
        "bull_confidence": bull_confidence,
        "bear_confidence": bear_confidence,
        "score_internal": round(net_score, 4),
        "shap_features": {
            "News Sentiment": fmt(avg_news),
            "Social Sentiment": fmt(avg_social),
            "Price Trend": fmt(price_trend * 100, True),
            "Macro Environment": fmt(macro_bull - macro_bear),
            "Volume Strength": vol_label + f" ({round(volume_strength, 1)}x)",
            "Volatility (ATR)": vol_pct_label + f" ({fmt(volatility_pct, True)})"
        },
        "technical_indicators": {
            "rsi": round(rsi, 1),
            "macd_histogram": round(macd["histogram"], 4),
            "atr": round(atr, 2),
            "vwap": round(vwap, 2),
            "volume_strength": round(volume_strength, 2)
        },
        "weights_used": weights,
        "explanations": explanations,
        "macro_factors": macro_catalysts
    }
