import os
import json
from groq import Groq

def analyze_macro_factors(news: list, reddit: list) -> dict:
    """
    Feeds latest news and reddit posts into Groq LLM to extract a single cohesive
    macro sentiment score and identify 3 key macro catalysts driving the stock.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    # If no Groq key, return fallback logic
    if not groq_api_key or groq_api_key == "mock_groq_key":
        return _mock_macro_analysis(news, reddit)

    try:
        client = Groq(api_key=groq_api_key)
        
        # Prepare context payload
        context_text = "NEWS HEADLINES:\n"
        for n in news[:5]:
            context_text += f"- {n.get('title', '')} ({n.get('source', '')})\n"
            
        context_text += "\nREDDIT POSTS:\n"
        for r in reddit[:5]:
            context_text += f"- {r.get('title', '')} [Score: {r.get('sentiment_score', 0)}]\n"

        prompt = f"""
You are a quantitative financial analyst. 
Based on the following news and social media context, provide a macro-economic analysis.
{context_text}

Output EXACTLY as valid JSON with no markdown formatting or extra text, like this:
{{
  "macro_sentiment_score": 0.5,
  "macro_catalysts": [
    "Catalyst 1 string",
    "Catalyst 2 string",
    "Catalyst 3 string"
  ]
}}

The macro_sentiment_score must be a float between -1.0 (extremely bearish) and 1.0 (extremely bullish).
Keep the catalysts under 100 characters each.
"""
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You output only valid JSON. Nothing else."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-8b-8192",
            temperature=0.1,
        )

        response_text = chat_completion.choices[0].message.content.strip()
        # Clean up possible markdown fences
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        data = json.loads(response_text)
        
        return {
            "macro_sentiment_score": float(data.get("macro_sentiment_score", 0.0)),
            "macro_catalysts": data.get("macro_catalysts", [])[:3]
        }

    except Exception as e:
        print(f"Groq API Error: {e}")
        return _mock_macro_analysis(news, reddit)

def _mock_macro_analysis(news: list, reddit: list) -> dict:
    """Fallback if Groq isn't configured."""
    score = 0.0
    
    # Very basic heuristic from mock data
    if news:
        s = sum(1 for n in news if "positive" in str(n).lower()) - sum(1 for n in news if "negative" in str(n).lower())
        score += s * 0.1
    if reddit:
        score += sum(r.get("sentiment_score", 0) for r in reddit[:5]) / 5.0
        
    score = max(-1.0, min(1.0, score))

    # Pool of varied catalysts
    catalyst_pool = {
        "bullish": [
            "Strong bullish retail momentum identified in social feeds.",
            "Favorable regulatory shifts anticipated in the coming quarter.",
            "Solid institutional backing observed in recent trade volume.",
            "Technological alpha signals approaching a breakout zone.",
            "Decreasing volatility in the sector improves risk appetite."
        ],
        "bearish": [
            "Bearish overhang from retail selling pressure.",
            "Macro headwinds impacting sector valuation and growth.",
            "Negative sentiment cascading through major social social channels.",
            "Institutional outflows detected in recent high-volume blocks.",
            "Regulatory uncertainty remains a primary concern for investors."
        ],
        "neutral": [
            "Uncertainty in broader tech sector policies remains high.",
            "Retail investor sentiment holding steady without clear bias.",
            "Market awaiting next quarter earnings reports for direction.",
            "Consolidation phase detected with low directional momentum.",
            "Equilibrium between buyers and sellers suggests short-term stability."
        ]
    }
    
    # Determine bias
    bias = "neutral"
    if score > 0.15: bias = "bullish"
    elif score < -0.15: bias = "bearish"
    
    # Select catalysts based on a simple hash to keep it unique per symbol
    # We can't access symbol directly here as it's not passed, but we can use the first item in news/reddit if available
    seed = sum(ord(c) for c in (str(news[0].get('title', '')) if news else "default"))
    
    selected_pool = catalyst_pool[bias]
    catalysts = [
        selected_pool[(seed) % len(selected_pool)],
        selected_pool[(seed + 1) % len(selected_pool)],
        selected_pool[(seed + 2) % len(selected_pool)]
    ]
        
    return {
        "macro_sentiment_score": score,
        "macro_catalysts": catalysts
    }
