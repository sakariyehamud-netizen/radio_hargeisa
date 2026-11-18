-- =============================================================================
-- Radio Hargeysa — Codka Jamhuuriyadda Somaliland
-- Complete Supabase (PostgreSQL) DDL Script
-- Covers: All 26 Entity Tables, Foreign-Key Relationships, Indexes,
--         RBAC Helper Functions, Row-Level Security (RLS) Policies, & Triggers
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. CORE GOVERNANCE & ADMIN TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Somaliland',
  city text NOT NULL DEFAULT 'Hargeisa',
  contact_email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.stations (
  id text PRIMARY KEY,
  organization_id text REFERENCES public.organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Hargeisa',
  country text NOT NULL DEFAULT 'Somaliland',
  founded_year integer DEFAULT 1942,
  languages jsonb NOT NULL DEFAULT '["so","en","ar"]'::jsonb,
  logo_url text NOT NULL DEFAULT '',
  brand_color text NOT NULL DEFAULT '#047422',
  studio_name text NOT NULL DEFAULT 'Studio 1',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  is_primary boolean NOT NULL DEFAULT false,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  uid text NOT NULL UNIQUE,
  email text NOT NULL,
  password_hash text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  phone text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  staff_role text CHECK (
    staff_role IS NULL OR staff_role IN (
      'SUPER_ADMIN', 'ADMIN', 'RADIO_MANAGER', 'PRODUCER', 'EDITOR', 'PRESENTER'
    )
  ),
  account_status text NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  verified boolean NOT NULL DEFAULT false,
  otp_code text,
  reset_token text,
  last_active_at text,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id text PRIMARY KEY,
  email text NOT NULL,
  staff_role text NOT NULL CHECK (
    staff_role IN ('SUPER_ADMIN', 'ADMIN', 'RADIO_MANAGER', 'PRODUCER', 'EDITOR', 'PRESENTER')
  ),
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED')),
  invited_by text NOT NULL DEFAULT '',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.advertisements (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  name text NOT NULL,
  advertiser text NOT NULL DEFAULT '',
  placement text NOT NULL CHECK (placement IN ('MOBILE_HOME', 'AUDIO_PREROLL', 'VIDEO_PREROLL', 'NEWS_INLINE')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED')),
  creative_url text NOT NULL DEFAULT '',
  target_url text NOT NULL DEFAULT '',
  starts_at text NOT NULL DEFAULT '',
  ends_at text NOT NULL DEFAULT '',
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id text PRIMARY KEY,
  actor_email text NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

-- =============================================================================
-- 2. STUDIO, BROADCAST & EDITORIAL TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'newspaper',
  color_theme text NOT NULL DEFAULT 'green' CHECK (color_theme IN ('green', 'rose', 'blue', 'amber')),
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.programs (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'NEWS',
  cover_url text NOT NULL DEFAULT '/media/radio-studio.jpg',
  presenter_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedule_text text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'so',
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  is_featured boolean NOT NULL DEFAULT false,
  follower_count integer NOT NULL DEFAULT 0,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.episodes (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  program_id text REFERENCES public.programs(id) ON DELETE SET NULL,
  program_title text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  presenter_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL DEFAULT 'NEWS',
  language text NOT NULL DEFAULT 'so',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_url text NOT NULL DEFAULT '/media/radio-studio.jpg',
  audio_url text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0,
  download_allowed boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'PROCESSING', 'AI_PROCESSING', 'PENDING_APPROVAL', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'REJECTED')
  ),
  published_at text,
  transcript text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  chapters jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_recording_id text,
  play_count integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.videos (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  program_id text REFERENCES public.programs(id) ON DELETE SET NULL,
  program_title text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  thumbnail_url text NOT NULL DEFAULT '/media/radio-studio.jpg',
  video_url text NOT NULL DEFAULT '',
  hls_url text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'RECORDED' CHECK (kind IN ('LIVE', 'RECORDED', 'INTERVIEW', 'NEWS', 'STUDIO')),
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'PROCESSING', 'PENDING_APPROVAL', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')
  ),
  view_count integer NOT NULL DEFAULT 0,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.news_articles (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'SOMALILAND',
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '/media/hargeisa-sunset.jpg',
  author text NOT NULL DEFAULT 'Radio Hargeysa Newsroom',
  language text NOT NULL DEFAULT 'en',
  published_at text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
  is_breaking boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  audio_url text NOT NULL DEFAULT '',
  is_demo boolean NOT NULL DEFAULT false,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.presenters (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  role_title text NOT NULL DEFAULT 'Presenter',
  bio text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT '/media/radio-studio.jpg',
  program_titles jsonb NOT NULL DEFAULT '[]'::jsonb,
  languages jsonb NOT NULL DEFAULT '["so"]'::jsonb,
  email text NOT NULL DEFAULT '',
  years_at_station integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  program_id text REFERENCES public.programs(id) ON DELETE SET NULL,
  program_title text NOT NULL,
  presenter_name text NOT NULL DEFAULT '',
  day_of_week text NOT NULL CHECK (
    day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')
  ),
  start_time text NOT NULL,
  end_time text NOT NULL,
  studio text NOT NULL DEFAULT 'Studio 1',
  is_recurring boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'CANCELLED')),
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('AUDIO', 'VIDEO', 'IMAGE', 'RECORDING', 'CLIP', 'THUMBNAIL', 'DOCUMENT')),
  file_uri text NOT NULL,
  program_id text REFERENCES public.programs(id) ON DELETE SET NULL,
  program_title text NOT NULL DEFAULT '',
  presenter_name text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0,
  size_mb double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'PROCESSING', 'ARCHIVED', 'ERROR')),
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  uploaded_by text NOT NULL DEFAULT '',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.media_clips (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  title text NOT NULL,
  source_type text NOT NULL DEFAULT 'RECORDING',
  source_id text,
  file_uri text NOT NULL DEFAULT '',
  start_seconds integer NOT NULL DEFAULT 0,
  end_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'READY',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.live_streams (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'AUDIO' CHECK (kind IN ('AUDIO', 'VIDEO')),
  primary_url text NOT NULL DEFAULT '',
  backup_url text NOT NULL DEFAULT '',
  rtmp_ingest_url text NOT NULL DEFAULT '',
  hls_output_url text NOT NULL DEFAULT '',
  bitrate_kbps integer NOT NULL DEFAULT 64,
  codec text NOT NULL DEFAULT 'AAC',
  qualities jsonb NOT NULL DEFAULT '["32","64","128"]'::jsonb,
  status text NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('LIVE', 'OFFLINE', 'DEGRADED', 'STANDBY')),
  health text NOT NULL DEFAULT 'GOOD' CHECK (health IN ('GOOD', 'WARN', 'ERROR')),
  listener_count integer NOT NULL DEFAULT 0,
  viewer_count integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  uptime_seconds integer NOT NULL DEFAULT 0,
  backup_status text NOT NULL DEFAULT 'OFFLINE',
  recording_status text NOT NULL DEFAULT 'IDLE',
  is_primary boolean NOT NULL DEFAULT false,
  is_placeholder boolean NOT NULL DEFAULT true,
  provider text NOT NULL DEFAULT 'icecast',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  program_id text REFERENCES public.programs(id) ON DELETE SET NULL,
  program_title text NOT NULL,
  presenter_name text NOT NULL DEFAULT '',
  stream_id text REFERENCES public.live_streams(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'LIVE' CHECK (status IN ('LIVE', 'PAUSED', 'EMERGENCY', 'ENDED')),
  started_at text NOT NULL,
  ended_at text,
  duration_seconds integer NOT NULL DEFAULT 0,
  listener_count integer NOT NULL DEFAULT 0,
  listener_peak integer NOT NULL DEFAULT 0,
  is_emergency boolean NOT NULL DEFAULT false,
  recording_status text NOT NULL DEFAULT 'RECORDING',
  notes text NOT NULL DEFAULT '',
  started_by text NOT NULL DEFAULT '',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.recordings (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  broadcast_id text REFERENCES public.broadcasts(id) ON DELETE SET NULL,
  program_id text REFERENCES public.programs(id) ON DELETE SET NULL,
  program_title text NOT NULL DEFAULT '',
  title text NOT NULL,
  file_uri text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0,
  size_mb double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'SAVED' CHECK (status IN ('SAVED', 'PROCESSING', 'PROCESSED', 'FAILED')),
  is_automatic boolean NOT NULL DEFAULT true,
  episode_id text REFERENCES public.episodes(id) ON DELETE SET NULL,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id text PRIMARY KEY,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('TRANSCRIPT', 'SUMMARY', 'CHAPTERS', 'TITLE', 'DESCRIPTION', 'KEYWORDS', 'CAPTION')),
  target_type text NOT NULL CHECK (target_type IN ('EPISODE', 'RECORDING', 'VIDEO', 'NEWS')),
  target_id text NOT NULL,
  target_title text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'so' CHECK (language IN ('so', 'en', 'ar')),
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETE', 'APPROVED', 'REJECTED', 'ERROR')),
  output text NOT NULL DEFAULT '',
  approved_by text,
  approved_at text,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

-- =============================================================================
-- 3. MOBILE / LISTENER & TELEMETRY TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id text PRIMARY KEY,
  item_type text NOT NULL CHECK (item_type IN ('PROGRAM', 'EPISODE', 'VIDEO', 'NEWS', 'PRESENTER')),
  item_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system',
  CONSTRAINT uq_favorites_user_item UNIQUE (created_by_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS public.follows (
  id text PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('PROGRAM', 'PRESENTER')),
  target_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system',
  CONSTRAINT uq_follows_user_target UNIQUE (created_by_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS public.listening_history (
  id text PRIMARY KEY,
  item_type text NOT NULL CHECK (item_type IN ('LIVE', 'EPISODE', 'VIDEO', 'NEWS')),
  item_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  progress_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  last_played_at text NOT NULL,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system',
  CONSTRAINT uq_history_user_item UNIQUE (created_by_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.downloads (
  id text PRIMARY KEY,
  item_type text NOT NULL CHECK (item_type IN ('EPISODE', 'VIDEO')),
  item_id text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  file_uri text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'READY',
  size_mb double precision NOT NULL DEFAULT 0,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system',
  CONSTRAINT uq_downloads_user_item UNIQUE (created_by_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.playlists (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.app_preferences (
  id text PRIMARY KEY,
  language text NOT NULL DEFAULT 'so' CHECK (language IN ('so', 'en', 'ar')),
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  data_saver boolean NOT NULL DEFAULT false,
  audio_quality text NOT NULL DEFAULT 'AUTO',
  video_quality text NOT NULL DEFAULT 'AUTO',
  autoplay boolean NOT NULL DEFAULT true,
  notify_live boolean NOT NULL DEFAULT true,
  notify_news boolean NOT NULL DEFAULT true,
  notify_programs boolean NOT NULL DEFAULT true,
  notify_episodes boolean NOT NULL DEFAULT true,
  notify_videos boolean NOT NULL DEFAULT true,
  onboarded boolean NOT NULL DEFAULT false,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system',
  CONSTRAINT uq_app_preferences_user UNIQUE (created_by_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '/mobile/home',
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  user_id text REFERENCES public.users(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  item_type text,
  item_id text,
  label text,
  duration_seconds integer,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  platform text NOT NULL DEFAULT 'web',
  created_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_date text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  created_by_id text NOT NULL DEFAULT 'anonymous'
);

-- =============================================================================
-- 4. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_station ON public.users (station_id);
CREATE INDEX IF NOT EXISTS idx_categories_status_order ON public.categories (status, sort_order);
CREATE INDEX IF NOT EXISTS idx_programs_status_featured ON public.programs (status, is_featured);
CREATE INDEX IF NOT EXISTS idx_episodes_program_status ON public.episodes (program_id, status);
CREATE INDEX IF NOT EXISTS idx_videos_program_status ON public.videos (program_id, status);
CREATE INDEX IF NOT EXISTS idx_news_status_published ON public.news_articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON public.schedules (day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON public.media_assets (type, status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON public.broadcasts (status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_broadcast ON public.recordings (broadcast_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status_target ON public.ai_jobs (status, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ads_placement_status ON public.advertisements (placement, status);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites (created_by_id);
CREATE INDEX IF NOT EXISTS idx_follows_user ON public.follows (created_by_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON public.listening_history (created_by_id, last_played_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_user ON public.downloads (created_by_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON public.playlists (created_by_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type_created ON public.analytics_events (event_type, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_date DESC);

-- =============================================================================
-- 5. TRIGGER FUNCTIONS & TRIGGERS
-- =============================================================================

-- 5A. Automatic ISO-8601 UTC created_date / updated_date maintenance
CREATE OR REPLACE FUNCTION public.set_iso_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_now text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_date IS NULL OR NEW.created_date = '' THEN
      NEW.created_date := v_now;
    END IF;
  END IF;
  NEW.updated_date := v_now;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'organizations', 'stations', 'users', 'staff_invitations',
    'advertisements', 'audit_logs', 'categories', 'programs', 'episodes', 'videos',
    'news_articles', 'presenters', 'schedules', 'media_assets',
    'media_clips', 'live_streams', 'broadcasts', 'recordings', 'ai_jobs',
    'favorites', 'follows', 'listening_history', 'downloads',
    'playlists', 'app_preferences', 'notifications', 'analytics_events'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_timestamps ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_timestamps BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_iso_timestamps();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- 5B. Automatically stamp published_at when content transitions to PUBLISHED
CREATE OR REPLACE FUNCTION public.stamp_published_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'PUBLISHED' AND (NEW.published_at IS NULL OR NEW.published_at = '') THEN
    NEW.published_at := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_episodes_published_at ON public.episodes;
CREATE TRIGGER trg_episodes_published_at
  BEFORE INSERT OR UPDATE OF status ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.stamp_published_at();

DROP TRIGGER IF EXISTS trg_videos_published_at ON public.videos;
CREATE TRIGGER trg_videos_published_at
  BEFORE INSERT OR UPDATE OF status ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.stamp_published_at();

DROP TRIGGER IF EXISTS trg_news_published_at ON public.news_articles;
CREATE TRIGGER trg_news_published_at
  BEFORE INSERT OR UPDATE OF status ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.stamp_published_at();

-- 5C. Keep programs.follower_count synced with follows table
CREATE OR REPLACE FUNCTION public.sync_program_follower_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'PROGRAM' THEN
    UPDATE public.programs
    SET follower_count = follower_count + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'PROGRAM' THEN
    UPDATE public.programs
    SET follower_count = GREATEST(0, follower_count - 1)
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_follows_sync_program_count ON public.follows;
CREATE TRIGGER trg_follows_sync_program_count
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.sync_program_follower_count();

-- 5D. Enforce at most one primary station
CREATE OR REPLACE FUNCTION public.ensure_single_primary_station()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.stations
    SET is_primary = false
    WHERE id <> NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stations_single_primary ON public.stations;
CREATE TRIGGER trg_stations_single_primary
  BEFORE INSERT OR UPDATE OF is_primary ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_station();

-- 5E. Automatic audit trail on broadcast state changes
CREATE OR REPLACE FUNCTION public.audit_broadcast_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := CASE WHEN NEW.is_emergency THEN 'BROADCAST_EMERGENCY_STARTED' ELSE 'BROADCAST_STARTED' END;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    v_action := 'BROADCAST_' || NEW.status;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_logs (
    id, actor_email, actor_role, action, entity_type, entity_id, details, created_by_id
  )
  VALUES (
    'aud_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
    COALESCE(NULLIF(NEW.started_by, ''), 'studio@radiohargeysa.so'),
    'SYSTEM',
    v_action,
    'Broadcast',
    NEW.id,
    COALESCE(NEW.program_title, ''),
    COALESCE(NEW.created_by_id, 'system')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broadcasts_audit ON public.broadcasts;
CREATE TRIGGER trg_broadcasts_audit
  AFTER INSERT OR UPDATE OF status ON public.broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.audit_broadcast_change();

-- 5F. Supabase Auth -> public.users sync & staff invitation acceptance
CREATE OR REPLACE FUNCTION public.handle_new_supabase_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(COALESCE(NEW.email, ''));
  v_invite record;
  v_staff_role text := NULL;
  v_role text := 'user';
  v_station_id text := NULL;
BEGIN
  SELECT id, staff_role, station_id INTO v_invite
  FROM public.staff_invitations
  WHERE lower(email) = v_email AND status = 'PENDING'
  ORDER BY created_date DESC
  LIMIT 1;

  IF FOUND THEN
    v_staff_role := v_invite.staff_role;
    v_station_id := v_invite.station_id;
    IF v_staff_role = 'SUPER_ADMIN' THEN
      v_role := 'admin';
    END IF;
    UPDATE public.staff_invitations
    SET status = 'ACCEPTED'
    WHERE id = v_invite.id;
  END IF;

  IF v_station_id IS NULL THEN
    SELECT id INTO v_station_id
    FROM public.stations
    WHERE is_primary = true
    LIMIT 1;
  END IF;

  INSERT INTO public.users (
    id, uid, email, full_name, role, staff_role, account_status, station_id, verified, created_by_id
  )
  VALUES (
    NEW.id::text,
    NEW.id::text,
    v_email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(v_email, '@', 1), 'Listener'),
    v_role,
    v_staff_role,
    'ACTIVE',
    v_station_id,
    (NEW.email_confirmed_at IS NOT NULL),
    'supabase_auth'
  )
  ON CONFLICT (uid) DO UPDATE
  SET email = EXCLUDED.email,
      verified = EXCLUDED.verified OR public.users.verified;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_supabase_user();

-- =============================================================================
-- 6. RBAC & SECURITY HELPER FUNCTIONS (7-ROLE MATRIX)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT id FROM public.users WHERE uid = auth.uid()::text OR id = auth.uid()::text LIMIT 1),
    auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user record;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'USER';
  END IF;

  SELECT role, staff_role, account_status
  INTO v_user
  FROM public.users
  WHERE uid = auth.uid()::text OR id = auth.uid()::text
  LIMIT 1;

  IF NOT FOUND OR v_user.account_status = 'SUSPENDED' THEN
    RETURN 'USER';
  END IF;

  IF v_user.role = 'admin' AND v_user.staff_role IS NULL THEN
    RETURN 'SUPER_ADMIN';
  END IF;

  IF v_user.staff_role IN ('SUPER_ADMIN', 'ADMIN', 'RADIO_MANAGER', 'PRODUCER', 'EDITOR', 'PRESENTER') THEN
    RETURN v_user.staff_role;
  END IF;

  IF v_user.role = 'admin' THEN
    RETURN 'SUPER_ADMIN';
  END IF;

  RETURN 'USER';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() <> 'USER';
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() IN ('SUPER_ADMIN', 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION public.has_permission(perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE public.current_app_role()
    WHEN 'SUPER_ADMIN' THEN true
    WHEN 'ADMIN' THEN perm IN (
      'users.read','users.manage','roles.manage','orgs.manage','stations.manage',
      'content.read','content.write','content.publish','media.manage','streams.manage',
      'broadcast.control','broadcast.emergency','ai.run','ai.approve','ads.manage',
      'analytics.read','audit.read','settings.manage','notifications.send',
      'programs.manage','schedules.manage'
    )
    WHEN 'RADIO_MANAGER' THEN perm IN (
      'content.read','content.write','content.publish','media.manage','streams.manage',
      'broadcast.control','broadcast.emergency','ai.run','ai.approve','analytics.read',
      'settings.manage','notifications.send','programs.manage','schedules.manage'
    )
    WHEN 'PRODUCER' THEN perm IN (
      'content.read','content.write','content.publish','media.manage','broadcast.control',
      'ai.run','ai.approve','analytics.read','programs.manage','schedules.manage',
      'notifications.send'
    )
    WHEN 'EDITOR' THEN perm IN ('content.read','content.write','ai.run','ai.approve','analytics.read')
    WHEN 'PRESENTER' THEN perm IN ('content.read','content.write','ai.run','analytics.read')
    ELSE false
  END;
$$;

-- =============================================================================
-- 7. ROW-LEVEL SECURITY (RLS) ENABLEMENT & POLICIES FOR ALL 26 TABLES
-- =============================================================================

ALTER TABLE public.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_clips        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events   ENABLE ROW LEVEL SECURITY;

-- Organizations
DROP POLICY IF EXISTS orgs_select ON public.organizations;
CREATE POLICY orgs_select ON public.organizations
  FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());
DROP POLICY IF EXISTS orgs_manage ON public.organizations;
CREATE POLICY orgs_manage ON public.organizations
  FOR ALL USING (public.has_permission('orgs.manage'))
  WITH CHECK (public.has_permission('orgs.manage'));

-- Stations
DROP POLICY IF EXISTS stations_select ON public.stations;
CREATE POLICY stations_select ON public.stations
  FOR SELECT USING (status = 'ACTIVE' OR public.is_staff());
DROP POLICY IF EXISTS stations_manage ON public.stations;
CREATE POLICY stations_manage ON public.stations
  FOR ALL USING (public.has_permission('stations.manage'))
  WITH CHECK (public.has_permission('stations.manage'));

-- Users
DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users
  FOR SELECT USING (
    uid = auth.uid()::text OR id = public.current_app_user_id() OR public.has_permission('users.read')
  );
DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (uid = auth.uid()::text OR id = public.current_app_user_id())
  WITH CHECK (uid = auth.uid()::text OR id = public.current_app_user_id());
DROP POLICY IF EXISTS users_admin_all ON public.users;
CREATE POLICY users_admin_all ON public.users
  FOR ALL USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));

-- Staff Invitations
DROP POLICY IF EXISTS invites_admin_all ON public.staff_invitations;
CREATE POLICY invites_admin_all ON public.staff_invitations
  FOR ALL USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));

-- Advertisements
DROP POLICY IF EXISTS ads_select ON public.advertisements;
CREATE POLICY ads_select ON public.advertisements
  FOR SELECT USING (status = 'ACTIVE' OR public.has_permission('ads.manage'));
DROP POLICY IF EXISTS ads_manage ON public.advertisements;
CREATE POLICY ads_manage ON public.advertisements
  FOR ALL USING (public.has_permission('ads.manage'))
  WITH CHECK (public.has_permission('ads.manage'));

-- Audit Logs
DROP POLICY IF EXISTS audit_select ON public.audit_logs;
CREATE POLICY audit_select ON public.audit_logs
  FOR SELECT USING (public.has_permission('audit.read'));
DROP POLICY IF EXISTS audit_insert_staff ON public.audit_logs;
CREATE POLICY audit_insert_staff ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_staff());

-- Categories
DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select ON public.categories
  FOR SELECT USING (status = 'ACTIVE' OR public.is_staff());
DROP POLICY IF EXISTS categories_manage ON public.categories;
CREATE POLICY categories_manage ON public.categories
  FOR ALL USING (public.has_permission('programs.manage'))
  WITH CHECK (public.has_permission('programs.manage'));

-- Programs (only PUBLISHED public; staff see all)
DROP POLICY IF EXISTS programs_select ON public.programs;
CREATE POLICY programs_select ON public.programs
  FOR SELECT USING (status = 'PUBLISHED' OR public.is_staff());
DROP POLICY IF EXISTS programs_manage ON public.programs;
CREATE POLICY programs_manage ON public.programs
  FOR ALL USING (public.has_permission('programs.manage'))
  WITH CHECK (public.has_permission('programs.manage'));

-- Episodes (only PUBLISHED public; staff write drafts/pending, publish requires content.publish)
DROP POLICY IF EXISTS episodes_select ON public.episodes;
CREATE POLICY episodes_select ON public.episodes
  FOR SELECT USING (status = 'PUBLISHED' OR public.is_staff());
DROP POLICY IF EXISTS episodes_insert ON public.episodes;
CREATE POLICY episodes_insert ON public.episodes
  FOR INSERT WITH CHECK (
    public.has_permission('content.write')
    AND (status NOT IN ('PUBLISHED', 'SCHEDULED') OR public.has_permission('content.publish'))
  );
DROP POLICY IF EXISTS episodes_update ON public.episodes;
CREATE POLICY episodes_update ON public.episodes
  FOR UPDATE USING (public.has_permission('content.write'))
  WITH CHECK (
    public.has_permission('content.write')
    AND (status NOT IN ('PUBLISHED', 'SCHEDULED') OR public.has_permission('content.publish'))
  );
DROP POLICY IF EXISTS episodes_delete ON public.episodes;
CREATE POLICY episodes_delete ON public.episodes
  FOR DELETE USING (public.has_permission('content.publish') OR public.is_admin());

-- Videos (only PUBLISHED public)
DROP POLICY IF EXISTS videos_select ON public.videos;
CREATE POLICY videos_select ON public.videos
  FOR SELECT USING (status = 'PUBLISHED' OR public.is_staff());
DROP POLICY IF EXISTS videos_insert ON public.videos;
CREATE POLICY videos_insert ON public.videos
  FOR INSERT WITH CHECK (
    public.has_permission('content.write')
    AND (status NOT IN ('PUBLISHED', 'SCHEDULED') OR public.has_permission('content.publish'))
  );
DROP POLICY IF EXISTS videos_update ON public.videos;
CREATE POLICY videos_update ON public.videos
  FOR UPDATE USING (public.has_permission('content.write'))
  WITH CHECK (
    public.has_permission('content.write')
    AND (status NOT IN ('PUBLISHED', 'SCHEDULED') OR public.has_permission('content.publish'))
  );
DROP POLICY IF EXISTS videos_delete ON public.videos;
CREATE POLICY videos_delete ON public.videos
  FOR DELETE USING (public.has_permission('content.publish') OR public.is_admin());

-- News Articles (only PUBLISHED public)
DROP POLICY IF EXISTS news_select ON public.news_articles;
CREATE POLICY news_select ON public.news_articles
  FOR SELECT USING (status = 'PUBLISHED' OR public.is_staff());
DROP POLICY IF EXISTS news_insert ON public.news_articles;
CREATE POLICY news_insert ON public.news_articles
  FOR INSERT WITH CHECK (
    public.has_permission('content.write')
    AND (status NOT IN ('PUBLISHED', 'SCHEDULED') OR public.has_permission('content.publish'))
  );
DROP POLICY IF EXISTS news_update ON public.news_articles;
CREATE POLICY news_update ON public.news_articles
  FOR UPDATE USING (public.has_permission('content.write'))
  WITH CHECK (
    public.has_permission('content.write')
    AND (status NOT IN ('PUBLISHED', 'SCHEDULED') OR public.has_permission('content.publish'))
  );
DROP POLICY IF EXISTS news_delete ON public.news_articles;
CREATE POLICY news_delete ON public.news_articles
  FOR DELETE USING (public.has_permission('content.publish') OR public.is_admin());

-- Presenters
DROP POLICY IF EXISTS presenters_select ON public.presenters;
CREATE POLICY presenters_select ON public.presenters
  FOR SELECT USING (status = 'ACTIVE' OR public.is_staff());
DROP POLICY IF EXISTS presenters_manage ON public.presenters;
CREATE POLICY presenters_manage ON public.presenters
  FOR ALL USING (public.has_permission('content.write'))
  WITH CHECK (public.has_permission('content.write'));

-- Schedules
DROP POLICY IF EXISTS schedules_select ON public.schedules;
CREATE POLICY schedules_select ON public.schedules
  FOR SELECT USING (status <> 'CANCELLED' OR public.is_staff());
DROP POLICY IF EXISTS schedules_manage ON public.schedules;
CREATE POLICY schedules_manage ON public.schedules
  FOR ALL USING (public.has_permission('schedules.manage'))
  WITH CHECK (public.has_permission('schedules.manage'));

-- Media Assets & Clips (Staff only)
DROP POLICY IF EXISTS media_assets_select ON public.media_assets;
CREATE POLICY media_assets_select ON public.media_assets
  FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS media_assets_manage ON public.media_assets;
CREATE POLICY media_assets_manage ON public.media_assets
  FOR ALL USING (public.has_permission('media.manage') OR public.has_permission('content.write'))
  WITH CHECK (public.has_permission('media.manage') OR public.has_permission('content.write'));

DROP POLICY IF EXISTS media_clips_select ON public.media_clips;
CREATE POLICY media_clips_select ON public.media_clips
  FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS media_clips_manage ON public.media_clips;
CREATE POLICY media_clips_manage ON public.media_clips
  FOR ALL USING (public.has_permission('media.manage') OR public.has_permission('content.write'))
  WITH CHECK (public.has_permission('media.manage') OR public.has_permission('content.write'));

-- Live Streams & Broadcasts & Recordings
DROP POLICY IF EXISTS streams_select ON public.live_streams;
CREATE POLICY streams_select ON public.live_streams
  FOR SELECT USING (status IN ('LIVE', 'STANDBY') OR public.is_staff());
DROP POLICY IF EXISTS streams_manage ON public.live_streams;
CREATE POLICY streams_manage ON public.live_streams
  FOR ALL USING (public.has_permission('streams.manage'))
  WITH CHECK (public.has_permission('streams.manage'));

DROP POLICY IF EXISTS broadcasts_select ON public.broadcasts;
CREATE POLICY broadcasts_select ON public.broadcasts
  FOR SELECT USING (status IN ('LIVE', 'PAUSED', 'EMERGENCY') OR public.is_staff());
DROP POLICY IF EXISTS broadcasts_manage ON public.broadcasts;
CREATE POLICY broadcasts_manage ON public.broadcasts
  FOR ALL USING (public.has_permission('broadcast.control'))
  WITH CHECK (public.has_permission('broadcast.control'));

DROP POLICY IF EXISTS recordings_select ON public.recordings;
CREATE POLICY recordings_select ON public.recordings
  FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS recordings_manage ON public.recordings;
CREATE POLICY recordings_manage ON public.recordings
  FOR ALL USING (public.has_permission('content.write'))
  WITH CHECK (public.has_permission('content.write'));

-- AI Jobs (Never public before human approval)
DROP POLICY IF EXISTS ai_jobs_select ON public.ai_jobs;
CREATE POLICY ai_jobs_select ON public.ai_jobs
  FOR SELECT USING (public.has_permission('ai.run'));
DROP POLICY IF EXISTS ai_jobs_insert ON public.ai_jobs;
CREATE POLICY ai_jobs_insert ON public.ai_jobs
  FOR INSERT WITH CHECK (public.has_permission('ai.run'));
DROP POLICY IF EXISTS ai_jobs_update ON public.ai_jobs;
CREATE POLICY ai_jobs_update ON public.ai_jobs
  FOR UPDATE USING (public.has_permission('ai.approve'))
  WITH CHECK (public.has_permission('ai.approve'));
DROP POLICY IF EXISTS ai_jobs_delete ON public.ai_jobs;
CREATE POLICY ai_jobs_delete ON public.ai_jobs
  FOR DELETE USING (public.is_admin());

-- Listener Personal Tables (Owner-scoped)
DROP POLICY IF EXISTS favorites_owner ON public.favorites;
CREATE POLICY favorites_owner ON public.favorites
  FOR ALL USING (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id())
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id());

DROP POLICY IF EXISTS follows_owner ON public.follows;
CREATE POLICY follows_owner ON public.follows
  FOR ALL USING (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id())
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id());

DROP POLICY IF EXISTS history_owner ON public.listening_history;
CREATE POLICY history_owner ON public.listening_history
  FOR ALL USING (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id())
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id());

DROP POLICY IF EXISTS downloads_owner ON public.downloads;
CREATE POLICY downloads_owner ON public.downloads
  FOR ALL USING (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id())
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id());

DROP POLICY IF EXISTS playlists_owner ON public.playlists;
CREATE POLICY playlists_owner ON public.playlists
  FOR ALL USING (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id())
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id());

DROP POLICY IF EXISTS app_preferences_owner ON public.app_preferences;
CREATE POLICY app_preferences_owner ON public.app_preferences
  FOR ALL USING (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id())
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_id = public.current_app_user_id());

-- Notifications
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT USING (
    user_id IS NULL
    OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
    OR public.is_staff()
  );
DROP POLICY IF EXISTS notifications_update_self ON public.notifications;
CREATE POLICY notifications_update_self ON public.notifications
  FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id());
DROP POLICY IF EXISTS notifications_send ON public.notifications;
CREATE POLICY notifications_send ON public.notifications
  FOR ALL USING (public.has_permission('notifications.send'))
  WITH CHECK (public.has_permission('notifications.send'));

-- Analytics Events
DROP POLICY IF EXISTS analytics_insert ON public.analytics_events;
CREATE POLICY analytics_insert ON public.analytics_events
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS analytics_select ON public.analytics_events;
CREATE POLICY analytics_select ON public.analytics_events
  FOR SELECT USING (public.has_permission('analytics.read'));
