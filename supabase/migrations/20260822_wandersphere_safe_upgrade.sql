-- ============================================================================
-- WanderSphere — SAFE, NON-DESTRUCTIVE DATABASE UPGRADE MIGRATION
-- Migration File: 20260822_wandersphere_safe_upgrade.sql
--
-- TARGETED UPGRADE BASED ON LIVE SUPABASE INSPECTION:
-- - Preserves existing 1 profile row completely (ID, name, avatar, timestamps).
-- - Upgrades public.itineraries by adding config JSONB & itinerary_data JSONB.
-- - Explicitly ENABLES RLS on public.itineraries.
-- - Replaces unsafe policies (WITH CHECK (true) / USING (true)) on writes.
-- - Replaces duplicate Storage policies with strict folder-ownership rules.
-- - Preserves existing user-avatars storage bucket and auth triggers untouched.
--
-- STRICT SAFETY GUARANTEES:
-- 1. NO DROP TABLE, NO DROP SCHEMA, NO TRUNCATE, NO DELETE FROM statements.
-- 2. NO bucket creation or bucket modification.
-- 3. NO auth trigger or auth function recreation.
-- 4. Preserves existing profiles, auth users, avatars, and timestamps.
-- 5. Idempotent — safe to review and run in Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS & PREREQUISITES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. SAFE COLUMN UPGRADES — PROFILES TABLE
-- ----------------------------------------------------------------------------
-- Ensure profiles table exists (will not modify if already present)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add missing columns without modifying existing row data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS travel_style TEXT DEFAULT 'explorer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraint from profiles.id to auth.users.id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'profiles_id_fkey check complete.';
END $$;

-- ----------------------------------------------------------------------------
-- 2. SAFE COLUMN UPGRADES — ITINERARIES TABLE
-- ----------------------------------------------------------------------------
-- Ensure itineraries table exists (will not modify if already present)
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add JSONB columns required by the application without removing description
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.itineraries ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.itineraries ALTER COLUMN description SET DEFAULT '';
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS itinerary_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS share_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add UNIQUE constraint on share_token if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'itineraries_share_token_key' AND table_name = 'itineraries'
  ) THEN
    ALTER TABLE public.itineraries ADD CONSTRAINT itineraries_share_token_key UNIQUE (share_token);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'itineraries_share_token_key check complete.';
END $$;

-- Add foreign key constraint from itineraries.user_id to auth.users.id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'itineraries_user_id_fkey' AND table_name = 'itineraries'
  ) THEN
    ALTER TABLE public.itineraries 
      ADD CONSTRAINT itineraries_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'itineraries_user_id_fkey check complete.';
END $$;

-- ----------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS) & GRANT TABLE PRIVILEGES
-- ----------------------------------------------------------------------------
-- Enable RLS explicitly on itineraries (inspection showed RLS was disabled)
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Ensure RLS remains enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant table privileges to anon, authenticated, and service_role so PostgreSQL delegates security to RLS policies
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.itineraries TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. CLEAN UP OBSOLETE / UNSECURE RLS POLICIES (PROFILES & ITINERARIES)
-- ----------------------------------------------------------------------------
-- Drop existing unsecure/conflicting profile policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Drop existing unsecure/conflicting itinerary policies
DROP POLICY IF EXISTS "Itineraries are viewable by everyone" ON public.itineraries;
DROP POLICY IF EXISTS "Users can view their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can create itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can create their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can delete itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can delete their own itineraries" ON public.itineraries;

-- ----------------------------------------------------------------------------
-- 5. CREATE OWNERSHIP-BASED RLS POLICIES — PROFILES
-- ----------------------------------------------------------------------------
-- 1. Public SELECT: Anyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- 2. Owner INSERT: Authenticated user can insert ONLY matching their auth.uid()
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Owner UPDATE: Authenticated user can update ONLY matching their auth.uid()
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 6. CREATE OWNERSHIP-BASED RLS POLICIES — ITINERARIES
-- ----------------------------------------------------------------------------
-- 1. SELECT: Owner can view own itineraries, OR anyone can view if is_public = true
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- 2. Owner INSERT: Authenticated user must set user_id = auth.uid()
CREATE POLICY "Users can create their own itineraries"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Owner UPDATE: Authenticated user can update ONLY their own itineraries
CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Owner DELETE: Authenticated user can delete ONLY their own itineraries
CREATE POLICY "Users can delete their own itineraries"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. CLEAN UP & RECREATE STORAGE POLICIES — USER-AVATARS
-- ----------------------------------------------------------------------------
-- Drop all duplicate/permissive storage policies identified during inspection
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Create 4 clear, non-duplicate, folder-owner-restricted storage policies:

-- 1. Public SELECT for user-avatars objects
CREATE POLICY "Public read user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

-- 2. Owner INSERT: Upload permitted ONLY when first folder segment equals auth.uid()
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Owner UPDATE: Update permitted ONLY when first folder segment equals auth.uid() (USING & WITH CHECK)
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Owner DELETE: Delete permitted ONLY when first folder segment equals auth.uid()
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 8. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries(created_at);
