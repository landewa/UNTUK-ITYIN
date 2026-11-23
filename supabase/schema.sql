-- Supabase schema for Our Little Universe persistent storage
-- Run this in your Supabase SQL Editor before deploying with SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.universe_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security so anonymous/public anon keys cannot mutate data directly.
-- The Express server accesses this table server-side using SUPABASE_SERVICE_ROLE_KEY.
alter table public.universe_state enable row level security;

-- Create a public read storage bucket named "universe-photos" (or match SUPABASE_STORAGE_BUCKET)
-- in Supabase Dashboard -> Storage -> New Bucket (Public: true for serving uploaded portrait images).
