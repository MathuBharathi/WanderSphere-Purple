-- =====================================================
-- WanderSphere — Supabase Database Schema (Production)
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query)
-- =====================================================

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Grant schema & table privileges so RLS policies are evaluated for anon & authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.itineraries TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow the trigger function (SECURITY DEFINER) to insert profiles for new users
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 2. ITINERARIES TABLE (STORES USER TRIPS)
-- =====================================================
-- Create table if not exists (for fresh setups)
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT, -- Legacy column, kept for backward compatibility
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  itinerary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_image TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add JSONB columns to existing table if they don't exist
DO $$
BEGIN
  -- Add config column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'itineraries' AND column_name = 'config'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Add itinerary_data column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'itineraries' AND column_name = 'itinerary_data'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN itinerary_data JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'itineraries' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END
$$;

-- Migrate existing data from description TEXT to JSONB columns
-- This safely converts existing JSON-in-text rows to proper JSONB
UPDATE public.itineraries
SET
  config = CASE
    WHEN description IS NOT NULL AND description != '' AND config = '{}'::jsonb
    THEN COALESCE((description::jsonb)->>'config', '{}')::jsonb
    ELSE config
  END,
  itinerary_data = CASE
    WHEN description IS NOT NULL AND description != '' AND itinerary_data = '{}'::jsonb
    THEN COALESCE((description::jsonb)->>'itinerary_data', '{}')::jsonb
    ELSE itinerary_data
  END
WHERE description IS NOT NULL
  AND description != ''
  AND (config = '{}'::jsonb OR itinerary_data = '{}'::jsonb);

-- Enable Row Level Security (RLS)
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Itineraries RLS Policies — Ownership-based
DROP POLICY IF EXISTS "Itineraries are viewable by everyone" ON public.itineraries;
DROP POLICY IF EXISTS "Users can view their own itineraries" ON public.itineraries;
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can create itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can create their own itineraries" ON public.itineraries;
CREATE POLICY "Users can create their own itineraries"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itineraries;
CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can delete their own itineraries" ON public.itineraries;
CREATE POLICY "Users can delete their own itineraries"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries(created_at DESC);

-- =====================================================
-- 3. STORAGE BUCKET FOR USER AVATARS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies — Avatar ownership
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- 4. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically backfill profiles for any existing registered users
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;