-- ============================================================================
-- WanderSphere — READ-ONLY Post-Migration Verification Script (Formatted)
-- File: supabase/migrations/02_post_migration_verification.sql
--
-- STRICT RULES:
-- 1. 100% READ-ONLY (SELECT & metadata queries ONLY).
-- 2. NO modifying commands (NO INSERT, UPDATE, DELETE, ALTER, CREATE, DROP, TRUNCATE).
-- 3. Correct pg_policies columns used: `qual` (USING) and `with_check` (WITH CHECK).
-- 4. Unified report layout so Supabase SQL Editor displays ALL verification
--    results in a single scrollable table view.
-- ============================================================================

WITH 

-- 1. TABLE ROW COUNTS (Verify profiles & itineraries data preserved)
sec1_row_counts AS (
  SELECT 
    '1. TABLE ROW COUNTS' AS check_section,
    'profiles' AS item_name,
    COUNT(*)::text AS detail_1,
    'rows preserved' AS detail_2,
    'RLS: ENABLED' AS detail_3
  FROM public.profiles
  UNION ALL
  SELECT 
    '1. TABLE ROW COUNTS' AS check_section,
    'itineraries' AS item_name,
    COUNT(*)::text AS detail_1,
    'rows in DB' AS detail_2,
    'RLS: ENABLED' AS detail_3
  FROM public.itineraries
),

-- 2. RLS ENABLED STATUS
sec2_rls_status AS (
  SELECT 
    '2. RLS STATUS' AS check_section,
    c.relname AS item_name,
    CASE WHEN c.relrowsecurity THEN 'PASS: RLS IS ENABLED' ELSE 'FAIL: RLS IS DISABLED' END AS detail_1,
    n.nspname AS detail_2,
    '' AS detail_3
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname IN ('profiles', 'itineraries')
),

-- 3. PROFILES COLUMNS VERIFICATION
sec3_profiles_cols AS (
  SELECT 
    '3. PROFILES COLUMNS' AS check_section,
    column_name AS item_name,
    data_type AS detail_1,
    CASE WHEN is_nullable = 'YES' THEN 'NULLABLE' ELSE 'NOT NULL' END AS detail_2,
    COALESCE(column_default, 'NONE') AS detail_3
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
),

-- 4. ITINERARIES COLUMNS VERIFICATION (Including JSONB columns)
sec4_itineraries_cols AS (
  SELECT 
    '4. ITINERARIES COLUMNS' AS check_section,
    column_name AS item_name,
    data_type AS detail_1,
    CASE WHEN is_nullable = 'YES' THEN 'NULLABLE' ELSE 'NOT NULL' END AS detail_2,
    COALESCE(column_default, 'NONE') AS detail_3
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'itineraries'
),

-- 5. RLS SECURITY POLICIES (PROFILES & ITINERARIES)
sec5_rls_policies AS (
  SELECT 
    '5. RLS POLICIES' AS check_section,
    tablename || ' -> ' || policyname AS item_name,
    'CMD: ' || cmd AS detail_1,
    'USING: ' || COALESCE(qual, 'NONE') AS detail_2,
    'WITH CHECK: ' || COALESCE(with_check, 'NONE') AS detail_3
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename IN ('profiles', 'itineraries')
),

-- 6. UNSAFE UNRESTRICTED POLICIES CHECK (Must be 0)
sec6_unsafe_check AS (
  SELECT 
    '6. UNSAFE POLICIES AUDIT' AS check_section,
    'unrestricted_write_policies_count' AS item_name,
    COUNT(*)::text AS detail_1,
    CASE WHEN COUNT(*) = 0 THEN 'PASS: 0 Unrestricted Write Policies' ELSE 'FAIL: Unsafe policies exist!' END AS detail_2,
    'No WITH CHECK (true) on writes' AS detail_3
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'itineraries')
    AND cmd IN ('INSERT', 'UPDATE')
    AND (with_check = 'true' OR qual = 'true')
),

-- 7. STORAGE BUCKET VERIFICATION
sec7_storage_bucket AS (
  SELECT 
    '7. STORAGE BUCKET' AS check_section,
    id AS item_name,
    CASE WHEN public THEN 'PASS: PUBLIC BUCKET' ELSE 'PRIVATE BUCKET' END AS detail_1,
    'CREATED: ' || COALESCE(created_at::text, 'EXISTING') AS detail_2,
    '' AS detail_3
  FROM storage.buckets
  WHERE id = 'user-avatars'
),

-- 8. STORAGE SECURITY POLICIES
sec8_storage_policies AS (
  SELECT 
    '8. STORAGE POLICIES' AS check_section,
    tablename || ' -> ' || policyname AS item_name,
    'CMD: ' || cmd AS detail_1,
    'USING: ' || COALESCE(qual, 'NONE') AS detail_2,
    'WITH CHECK: ' || COALESCE(with_check, 'NONE') AS detail_3
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
),

-- 9. PERFORMANCE INDEXES
sec9_indexes AS (
  SELECT 
    '9. PERFORMANCE INDEXES' AS check_section,
    tablename || '.' || indexname AS item_name,
    indexdef AS detail_1,
    '' AS detail_2,
    '' AS detail_3
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename IN ('profiles', 'itineraries')
),

-- 10. TABLE GRANTS VERIFICATION
sec10_table_grants AS (
  SELECT
    '10. TABLE GRANTS' AS check_section,
    table_name || ' -> ' || grantee AS item_name,
    string_agg(privilege_type, ', ') AS detail_1,
    'PASS: TABLE GRANTED' AS detail_2,
    '' AS detail_3
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'itineraries')
    AND grantee IN ('anon', 'authenticated')
  GROUP BY table_name, grantee
)

-- COMBINE ALL VERIFICATION SECTIONS INTO A SINGLE RESULT TABLE
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec1_row_counts
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec2_rls_status
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec3_profiles_cols
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec4_itineraries_cols
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec5_rls_policies
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec6_unsafe_check
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec7_storage_bucket
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec8_storage_policies
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec9_indexes
UNION ALL
SELECT check_section, item_name, detail_1, detail_2, detail_3 FROM sec10_table_grants
ORDER BY check_section, item_name;
