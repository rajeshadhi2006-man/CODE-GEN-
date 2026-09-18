import os
from dotenv import load_dotenv

load_dotenv()

# Default live Supabase credentials for NEXUS WORKFORCE OS
DEFAULT_SUPABASE_URL = "https://svuxowuosmhzujcekqnk.supabase.co"
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dXhvd3Vvc21oenVqY2VrcW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjE3MzYsImV4cCI6MjEwNTI5NzczNn0.uaJ-FvEVI7fCZIn3y5jTkMfmsUSouDcQWkEQlOroFGk"

SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", DEFAULT_SUPABASE_URL))
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", DEFAULT_SUPABASE_KEY))

PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")

# SMTP Automated Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "rajeshadhi2006@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USER", "rajeshadhi2006@gmail.com"))
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "NEXUS Workforce OS Dispatch")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "*"
]
