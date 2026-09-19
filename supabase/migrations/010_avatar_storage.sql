-- ============================================================
-- 010 — PROFILE PICTURE STORAGE
-- Creates the public 'avatars' bucket and storage RLS policies so
-- staff can upload their own profile picture with their signed-in
-- session (no service-role key required). Idempotent.
-- ============================================================

-- ------------------------------------------------------------------
-- BUCKET (public read, 2MB, image-only)
-- ------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

-- Let authenticated users see the bucket
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can view avatars bucket" ON storage.buckets;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Authenticated users can view avatars bucket"
  ON storage.buckets FOR SELECT TO authenticated
  USING (id = 'avatars');

-- ------------------------------------------------------------------
-- OBJECT POLICIES
-- ------------------------------------------------------------------
-- Public read (avatars are intentionally public URLs)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users upload / overwrite only into their own folder
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
    AND (octet_length(coalesce(metadata->>'contentType', '')) = 0 OR coalesce(metadata->>'contentType', '') IN ('image/jpeg', 'image/png', 'image/webp'))
  );

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Broad object access for the service role so old admin flows still work
DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role object access for avatars" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Service role object access for avatars"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

select 'Avatars bucket and storage policies ready (public read; users upload to their own folder).' as status;