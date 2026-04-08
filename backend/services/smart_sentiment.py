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
    catalysts = [
        "Uncertainty in broader tech sector policies.",
        "Retail investor sentiment holding steady.",
        "Awaiting next quarter earnings reports."
    ]
    
    # Very basic heuristic from mock data
    if news:
        s = sum(1 for n in news if "positive" in str(n).lower()) - sum(1 for n in news if "negative" in str(n).lower())
        score += s * 0.1
    if reddit:
        score += sum(r.get("sentiment_score", 0) for r in reddit[:5]) / 5.0
        
    score = max(-1.0, min(1.0, score))
    
    # Adjust mock catalysts based on score
    if score > 0.2:
        catalysts = [
            "Strong bullish retail momentum identified.",
            "Favorable regulatory shifts anticipated.",
            "Solid institutional backing in recent news."
        ]
    elif score < -0.2:
        catalysts = [
            "Bearish overhang from retail selling pressure.",
            "Macro headwinds impacting sector valuation.",
            "Negative sentiment cascading through social feeds."
        ]
        
    return {
        "macro_sentiment_score": score,
        "macro_catalysts": catalysts
    }
