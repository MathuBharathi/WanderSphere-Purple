-- =====================================================
-- WanderSphere - Supabase Database Schema (Zero-RLS Lockout)
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query)
-- =====================================================

-- 0. CLEANUP EXISTING TABLES & TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.itineraries CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  phone TEXT,
  travel_style TEXT DEFAULT 'explorer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permissive Profiles RLS Policies (Allows client and DB triggers to read/write)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
CREATE POLICY "Users can update profiles" ON public.profiles FOR UPDATE USING (true);

-- =====================================================
-- 2. ITINERARIES TABLE (STORES USER TRIPS)
-- =====================================================
CREATE TABLE public.itineraries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL, -- Stores serialized JSON: { config, itinerary_data }
  cover_image TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Permissive Itineraries RLS Policies (Allows instant DB sync)
DROP POLICY IF EXISTS "Itineraries are viewable by everyone" ON public.itineraries;
CREATE POLICY "Itineraries are viewable by everyone" ON public.itineraries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create itineraries" ON public.itineraries;
CREATE POLICY "Users can create itineraries" ON public.itineraries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update itineraries" ON public.itineraries;
CREATE POLICY "Users can update itineraries" ON public.itineraries FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete itineraries" ON public.itineraries;
CREATE POLICY "Users can delete itineraries" ON public.itineraries FOR DELETE USING (true);

-- =====================================================
-- 3. STORAGE BUCKET FOR USER AVATARS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;
CREATE POLICY "Users can upload avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Users can update avatar" ON storage.objects;
CREATE POLICY "Users can update avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'user-avatars');

-- =====================================================
-- 4. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP & BACKFILL
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically backfill profiles for any existing registered users
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;