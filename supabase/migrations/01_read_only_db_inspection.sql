-- ============================================================================
-- WanderSphere — READ-ONLY Database Inspection Script (Formatted & Structured)
-- File: supabase/migrations/01_read_only_db_inspection.sql
--
-- STRICT RULES:
-- 1. 100% READ-ONLY (SELECT & metadata queries ONLY).
-- 2. NO modifying commands (NO INSERT, UPDATE, DELETE, ALTER, CREATE, DROP, TRUNCATE).
-- 3. Combines all 9 inspection areas into a clean unified report table so that
--    Supabase SQL Editor displays ALL sections in a single, clear result view.
-- ============================================================================

-- ============================================================================
-- UNIFIED DATABASE INSPECTION REPORT (All 9 Sections in a Single Scrollable View)
-- ============================================================================
WITH 

-- 1. TABLE ROW COUNTS
sec1_row_counts AS (
  SELECT 
    '1. TABLE ROW COUNTS' AS section,
    'profiles' AS item_name,
    COUNT(*)::text AS detail_1,
    'rows' AS detail_2,
    '' AS detail_3,
    '' AS detail_4
  FROM public.profiles
  UNION ALL
  SELECT 
    '1. TABLE ROW COUNTS' AS section,
    'itineraries' AS item_name,
    COUNT(*)::text AS detail_1,
    'rows' AS detail_2,
    '' AS detail_3,
    '' AS detail_4
  FROM public.itineraries
),

-- 2. PROFILES COLUMNS
sec2_profiles_cols AS (
  SELECT 
    '2. PROFILES COLUMNS' AS section,
    column_name AS item_name,
    data_type AS detail_1,
    CASE WHEN is_nullable = 'YES' THEN 'NULLABLE' ELSE 'NOT NULL' END AS detail_2,
    COALESCE(column_default, 'NONE') AS detail_3,
    '' AS detail_4
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
),

-- 3. ITINERARIES COLUMNS
sec3_itineraries_cols AS (
  SELECT 
    '3. ITINERARIES COLUMNS' AS section,
    column_name AS item_name,
    data_type AS detail_1,
    CASE WHEN is_nullable = 'YES' THEN 'NULLABLE' ELSE 'NOT NULL' END AS detail_2,
    COALESCE(column_default, 'NONE') AS detail_3,
    '' AS detail_4
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'itineraries'
),

-- 4. FOREIGN KEYS
sec4_foreign_keys AS (
  SELECT 
    '4. FOREIGN KEYS' AS section,
    tc.constraint_name AS item_name,
    tc.table_name || '.' || kcu.column_name AS detail_1,
    'REFERENCES ' || ccu.table_schema || '.' || ccu.table_name || '(' || ccu.column_name || ')' AS detail_2,
    '' AS detail_3,
    '' AS detail_4
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('profiles', 'itineraries')
),

-- 5. RLS STATUS
sec5_rls_status AS (
  SELECT 
    '5. RLS STATUS' AS section,
    c.relname AS item_name,
    CASE WHEN c.relrowsecurity THEN 'RLS ENABLED' ELSE 'RLS DISABLED' END AS detail_1,
    n.nspname AS detail_2,
    '' AS detail_3,
    '' AS detail_4
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname IN ('profiles', 'itineraries')
),

-- 6. EXISTING RLS POLICIES
sec6_rls_policies AS (
  SELECT 
    '6. EXISTING RLS POLICIES' AS section,
    tablename || ' -> ' || policyname AS item_name,
    'CMD: ' || cmd AS detail_1,
    'ROLES: ' || array_to_string(roles, ', ') AS detail_2,
    'USING: ' || COALESCE(qual, 'NONE') AS detail_3,
    'WITH CHECK: ' || COALESCE(with_check, 'NONE') AS detail_4
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename IN ('profiles', 'itineraries')
),

-- 7. EXISTING INDEXES
sec7_indexes AS (
  SELECT 
    '7. EXISTING INDEXES' AS section,
    tablename || '.' || indexname AS item_name,
    indexdef AS detail_1,
    '' AS detail_2,
    '' AS detail_3,
    '' AS detail_4
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename IN ('profiles', 'itineraries')
),

-- 8. STORAGE BUCKETS
sec8_buckets AS (
  SELECT 
    '8. STORAGE BUCKETS' AS section,
    id AS item_name,
    CASE WHEN public THEN 'PUBLIC BUCKET' ELSE 'PRIVATE BUCKET' END AS detail_1,
    'CREATED: ' || COALESCE(created_at::text, 'UNKNOWN') AS detail_2,
    '' AS detail_3,
    '' AS detail_4
  FROM storage.buckets
  WHERE id = 'user-avatars'
),

-- 9. STORAGE POLICIES
sec9_storage_policies AS (
  SELECT 
    '9. STORAGE POLICIES' AS section,
    tablename || ' -> ' || policyname AS item_name,
    'CMD: ' || cmd AS detail_1,
    'USING: ' || COALESCE(qual, 'NONE') AS detail_2,
    'WITH CHECK: ' || COALESCE(with_check, 'NONE') AS detail_3,
    '' AS detail_4
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
)

-- COMBINE ALL SECTIONS INTO A SINGLE FORMATTED REPORT TABLE
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec1_row_counts
UNION ALL
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec2_profiles_cols
UNION ALL
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec3_itineraries_cols
UNION ALL
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec4_foreign_keys
UNION ALL
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec5_rls_status
UNION ALL
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec6_rls_policies
UNION ALL
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec7_indexes
UNION ALL
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec8_buckets
UNION ALL
SELECT section, item_name, detail_1, detail_2, detail_3, detail_4 FROM sec9_storage_policies
ORDER BY section, item_name;
