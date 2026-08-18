from supabase import create_client, Client
from app.core.config import settings

# Create a single instance of the Supabase client using URL and Key config
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
