-- =====================================================
-- WanderSphere - Minimal Supabase Database Schema
-- Run this in your Supabase SQL editor (SQL Editor -> New Query)
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  phone TEXT,
  travel_style TEXT DEFAULT 'explorer', -- explorer, luxury, budget, adventure
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. ITINERARIES TABLE (stores user trips)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL, -- Stores serialized JSON: { config, itinerary_data }
  cover_image TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Itineraries Policies
DROP POLICY IF EXISTS "Public itineraries are viewable by everyone" ON public.itineraries;
CREATE POLICY "Public itineraries are viewable by everyone" 
  ON public.itineraries FOR SELECT 
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own itineraries" ON public.itineraries;
CREATE POLICY "Users can create their own itineraries" 
  ON public.itineraries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itineraries;
CREATE POLICY "Users can update their own itineraries" 
  ON public.itineraries FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own itineraries" ON public.itineraries;
CREATE POLICY "Users can delete their own itineraries" 
  ON public.itineraries FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. PROFILE CREATION TRIGGER ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Extremely important fallback: if profile creation fails for any reason
  -- (e.g., table profiles hasn't been created yet, or column length error),
  -- catch the exception so that the auth.users signup transaction does not fail.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DEVELOPER HELPERS & TROUBLESHOOTING
-- =====================================================
-- 1. To manually confirm a user's email if email verification is enabled and you cannot receive verification emails:
--    UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = 'user@example.com';
--
-- 2. To check if user profile triggers are working:
--    SELECT * FROM public.profiles;