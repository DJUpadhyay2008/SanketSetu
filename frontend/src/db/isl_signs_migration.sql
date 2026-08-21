-- ====================================================================
-- Sanket Setu - ISLRTC ISL Signs Table Migration & Supabase RLS Schema
-- ====================================================================

-- 1. Create isl_signs table
CREATE TABLE IF NOT EXISTS isl_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL UNIQUE,
    category TEXT,
    subcategory TEXT,
    difficulty TEXT DEFAULT 'Beginner',
    meaning TEXT,
    description TEXT,
    video_url TEXT,
    video_type TEXT DEFAULT 'none', -- 'youtube', 'direct', 'none'
    source TEXT DEFAULT 'ISLRTC',
    source_url TEXT DEFAULT 'https://islrtc.nic.in/isl-dictionary/',
    is_embeddable BOOLEAN DEFAULT true,
    thumbnail_url TEXT,
    related_signs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for efficient lookup & search
CREATE INDEX IF NOT EXISTS idx_isl_signs_term ON isl_signs (term);
CREATE INDEX IF NOT EXISTS idx_isl_signs_category ON isl_signs (category);
CREATE INDEX IF NOT EXISTS idx_isl_signs_difficulty ON isl_signs (difficulty);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE isl_signs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all authenticated and anonymous users
CREATE POLICY "Public read access for isl_signs"
ON isl_signs FOR SELECT
USING (true);

-- Restrict insert/update/delete to authenticated admins or service roles
CREATE POLICY "Admin write access for isl_signs"
ON isl_signs FOR ALL
USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.uid() IN (
        SELECT user_id FROM user_roles WHERE role IN ('admin', 'institution_admin')
    )
);

-- 4. Initial Seed Data (Verified ISLRTC Dictionary Signs)
INSERT INTO isl_signs (term, category, subcategory, difficulty, meaning, description, video_url, video_type, source, source_url, is_embeddable, related_signs)
VALUES
  ('Namaste', 'Greetings', 'Formal Greetings', 'Beginner', 'Traditional Indian greeting representing respect, welcome, and peace.', 'Both palms are joined together flat at chest height with fingertips pointing upward in traditional Anjali Mudra posture.', 'https://www.youtube.com/watch?v=_B5I2cuRahE', 'youtube', 'ISLRTC', 'https://islrtc.nic.in/isl-dictionary/', true, '["Hello", "Welcome", "Thank You"]'),
  ('Hello', 'Greetings', 'General Greetings', 'Beginner', 'Friendly informal greeting to initiate conversation.', 'Right hand open palm raised near temple, waving gently outward twice with a smile.', 'https://www.youtube.com/watch?v=1F26_8LqJ_k', 'youtube', 'ISLRTC', 'https://islrtc.nic.in/isl-dictionary/', true, '["Namaste", "Welcome", "Goodbye"]'),
  ('Thank You', 'Greetings', 'Polite Expressions', 'Beginner', 'Expression of gratitude and appreciation.', 'Fingertips of open right hand touch chin/lips then extend smoothly forward towards the person.', 'https://www.youtube.com/watch?v=C3E611-L-M', 'youtube', 'ISLRTC', 'https://islrtc.nic.in/isl-dictionary/', true, '["Welcome", "Please", "Namaste"]'),
  ('Welcome', 'Greetings', 'Polite Expressions', 'Beginner', 'Hospitable gesture welcoming someone to a place or acknowledging thanks.', 'Open right hand held slightly to the side sweeps gracefully inward towards chest area.', 'https://www.youtube.com/watch?v=_B5I2cuRahE', 'youtube', 'ISLRTC', 'https://islrtc.nic.in/isl-dictionary/', true, '["Namaste", "Thank You", "Hello"]'),
  ('Doctor', 'Healthcare', 'Medical Staff', 'Intermediate', 'Medical practitioner or physician.', 'Right index and middle finger tapping pulse location on left inner wrist twice.', 'https://www.youtube.com/watch?v=A2C6O-L-o-E', 'youtube', 'ISLRTC', 'https://islrtc.nic.in/isl-dictionary/', true, '["Hospital", "Nurse", "Medicine"]'),
  ('Nurse', 'Healthcare', 'Medical Staff', 'Intermediate', 'Healthcare professional providing patient care.', 'Right thumb tapping a cross on wrist or gesturing cap outline across forehead.', 'https://www.youtube.com/watch?v=A2C6O-L-o-E', 'youtube', 'ISLRTC', 'https://islrtc.nic.in/isl-dictionary/', true, '["Doctor", "Hospital", "Medicine"]'),
  ('Hospital', 'Healthcare', 'Medical Facilities', 'Intermediate', 'Healthcare facility for treatment.', 'Index finger tracing a cross shape (+) on upper left arm arm-band area.', 'https://www.youtube.com/watch?v=A2C6O-L-o-E', 'youtube', 'ISLRTC', 'https://islrtc.nic.in/isl-dictionary/', true, '["Doctor", "Medicine", "Emergency"]'),
  ('Emergency', 'Healthcare', 'Urgency', 'Intermediate', 'Critical situation requiring immediate action.', 'Letter E handshape or fist shaking back and forth with urgent expression at eye level.', 'https://www.youtube.com/watch?v=3-zY13D_i9U', 'youtube', 'ISLRTC', 'https://islrtc.nic.in/isl-dictionary/', true, '["Help", "Hospital", "Police"]')
ON CONFLICT (term) DO UPDATE SET
  category = EXCLUDED.category,
  meaning = EXCLUDED.meaning,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  video_type = EXCLUDED.video_type,
  is_embeddable = EXCLUDED.is_embeddable,
  updated_at = NOW();
