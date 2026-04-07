import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mock.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "mock_key")

supabase: Client = None

if SUPABASE_URL != "https://mock.supabase.co" and SUPABASE_KEY != "mock_key":
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to initialize Supabase: {e}")
        supabase = None
else:
    print("WARNING: Supabase URL/KEY not found. Running in mock DB mode.")

def get_supabase() -> Client:
    return supabase
