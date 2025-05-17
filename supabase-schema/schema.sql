create table public.users (
  id uuid not null,
  created_at timestamp with time zone not null default now(),
  email text not null,
  role text not null,
  full_name text null,
  profile_completed boolean null default false,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_role_check check (
    (
      role = any (
        array[
          'student'::text,
          'employer'::text,
          'tpo'::text,
          'admin'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;



create table public.user_interests (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  interests text[] not null,
  tech_stack text[] not null,
  role_preference text[] not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_interests_pkey primary key (id),
  constraint user_interests_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.user_achievements (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  past_accomplishments text[] null,
  current_projects text[] null,
  future_plans text[] null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_achievements_pkey primary key (id),
  constraint user_achievements_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.student_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  college text null,
  degree text null,
  graduation_year integer null,
  skills text[] null,
  resume_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint student_profiles_pkey primary key (id),
  constraint student_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;




create table public.profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  avatar_url text null,
  bio text null,
  location text null,
  website text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  message text not null,
  is_read boolean null default false,
  created_at timestamp with time zone not null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;




create table public.employer_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  company_name text not null,
  industry text null,
  company_size text null,
  logo_url text null,
  description text null,
  website text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint employer_profiles_pkey primary key (id),
  constraint employer_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;




create table public.job_listings (
  id uuid not null default gen_random_uuid (),
  employer_id uuid not null,
  title text not null,
  description text not null,
  type text not null,
  location text not null,
  remote boolean null default false,
  skills_required text[] null,
  salary_min integer null,
  salary_max integer null,
  application_deadline timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  status text not null default 'draft'::text,
  constraint job_listings_pkey primary key (id),
  constraint job_listings_employer_id_fkey foreign KEY (employer_id) references employer_profiles (id) on delete CASCADE,
  constraint job_listings_status_check check (
    (
      status = any (
        array['draft'::text, 'published'::text, 'closed'::text]
      )
    )
  ),
  constraint job_listings_type_check check (
    (
      type = any (array['job'::text, 'internship'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_job_listings_status on public.job_listings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_job_listings_type on public.job_listings using btree (type) TABLESPACE pg_default;




create table public.saved_jobs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  job_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint saved_jobs_pkey primary key (id),
  constraint saved_jobs_user_id_job_id_key unique (user_id, job_id),
  constraint saved_jobs_job_id_fkey foreign KEY (job_id) references job_listings (id) on delete CASCADE,
  constraint saved_jobs_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;






create table public.applications (
  id uuid not null default gen_random_uuid (),
  job_id uuid not null,
  student_id uuid not null,
  resume_url text not null,
  cover_letter text null,
  video_url text null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint applications_pkey primary key (id),
  constraint applications_job_id_fkey foreign KEY (job_id) references job_listings (id) on delete CASCADE,
  constraint applications_student_id_fkey foreign KEY (student_id) references users (id) on delete CASCADE,
  constraint applications_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'reviewed'::text,
          'shortlisted'::text,
          'rejected'::text,
          'accepted'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_applications_status on public.applications using btree (status) TABLESPACE pg_default;


-- Events Table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL,
  location TEXT,
  registration_fee DECIMAL(10, 2) DEFAULT 0.00,
  speaker_1 TEXT,
  speaker_2 TEXT,
  event_category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT events_event_type_check CHECK (
    event_type = ANY (ARRAY['In-Person'::text, 'Virtual'::text, 'Hybrid'::text])
  ),
  CONSTRAINT events_event_category_check CHECK (
    event_category = ANY (ARRAY[
      'Workshop'::text, 
      'Seminar'::text, 
      'Webinar'::text, 
      'Internship'::text, 
      'Conference'::text,
      'Hackathon'::text,
      'Training'::text,
      'Other'::text
    ])
  ),
  CONSTRAINT events_status_check CHECK (
    status = ANY (ARRAY['draft'::text, 'published'::text, 'cancelled'::text, 'completed'::text])
  )
) TABLESPACE pg_default;

CREATE INDEX idx_events_event_type ON public.events USING btree (event_type) TABLESPACE pg_default;
CREATE INDEX idx_events_event_category ON public.events USING btree (event_category) TABLESPACE pg_default;
CREATE INDEX idx_events_status ON public.events USING btree (status) TABLESPACE pg_default;

-- Event Registrations Table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  registration_status TEXT NOT NULL DEFAULT 'registered',
  payment_status TEXT DEFAULT 'pending',
  payment_amount DECIMAL(10, 2) DEFAULT 0.00,
  payment_date TIMESTAMP WITH TIME ZONE,
  CONSTRAINT event_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT event_registrations_user_event_unique UNIQUE (user_id, event_id),
  CONSTRAINT event_registrations_status_check CHECK (
    registration_status = ANY (ARRAY['registered'::text, 'cancelled'::text, 'attended'::text])
  ),
  CONSTRAINT event_registrations_payment_status_check CHECK (
    payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'refunded'::text, 'failed'::text, 'free'::text])
  )
) TABLESPACE pg_default;

CREATE INDEX idx_event_registrations_event_id ON public.event_registrations USING btree (event_id) TABLESPACE pg_default;
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations USING btree (user_id) TABLESPACE pg_default;

-- Super Admin Table
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  CONSTRAINT super_admins_pkey PRIMARY KEY (id),
  CONSTRAINT super_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT super_admins_user_id_key UNIQUE (user_id)
) TABLESPACE pg_default;

-- Add super_admin role to users table constraint
ALTER TABLE public.users
DROP CONSTRAINT users_role_check,
ADD CONSTRAINT users_role_check CHECK (
  role = ANY (ARRAY[
    'student'::text,
    'employer'::text,
    'tpo'::text,
    'admin'::text,
    'super_admin'::text
  ])
);

-- Sample Data for Events
INSERT INTO public.events (
  title, 
  description, 
  logo_url, 
  image_url, 
  start_date, 
  end_date, 
  event_type, 
  location, 
  registration_fee, 
  speaker_1, 
  speaker_2, 
  event_category, 
  status, 
  created_by
) VALUES 
(
  'Project Management Workshop',
  'Learn the fundamentals of project management and how to apply them in real-world scenarios.',
  'https://example.com/logos/pm-workshop.png',
  'https://example.com/images/pm-workshop.jpg',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '8 days',
  'In-Person',
  'Main Campus, Building A, Room 101',
  49.99,
  'Jane Smith, PMP',
  'John Doe, Agile Coach',
  'Workshop',
  'published',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Coding with AI Webinar',
  'Discover how to leverage AI tools to enhance your coding productivity and solve complex problems.',
  'https://example.com/logos/ai-coding.png',
  'https://example.com/images/ai-coding.jpg',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days' + INTERVAL '3 hours',
  'Virtual',
  NULL,
  0.00,
  'Dr. Alex Johnson, AI Researcher',
  'Sarah Williams, Senior Developer',
  'Webinar',
  'published',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Future Skills Seminar',
  'Explore the most in-demand skills for the future job market and how to acquire them.',
  'https://example.com/logos/future-skills.png',
  'https://example.com/images/future-skills.jpg',
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '21 days' + INTERVAL '6 hours',
  'Hybrid',
  'Technology Center, Conference Hall',
  29.99,
  'Michael Brown, Career Coach',
  'Lisa Chen, Industry Expert',
  'Seminar',
  'published',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);



-- Event Participants Table (extends event_registrations with additional details)
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  registration_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  institution TEXT,
  department TEXT,
  year_of_study TEXT,
  additional_info JSONB,
  CONSTRAINT event_participants_pkey PRIMARY KEY (id),
  CONSTRAINT event_participants_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
  CONSTRAINT event_participants_registration_id_key UNIQUE (registration_id)
) TABLESPACE pg_default;

CREATE INDEX idx_event_participants_registration_id ON public.event_participants USING btree (registration_id) TABLESPACE pg_default;

-- Add RLS policies for event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can do everything on event_participants" 
  ON public.event_participants 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- Users can view their own participant details
CREATE POLICY "Users can view their own participant details" 
  ON public.event_participants 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_registrations.id = event_participants.registration_id
      AND event_registrations.user_id = auth.uid()
    )
  );

-- Users can insert their own participant details
CREATE POLICY "Users can insert their own participant details" 
  ON public.event_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_registrations.id = event_participants.registration_id
      AND event_registrations.user_id = auth.uid()
    )
  );


-- Add TPO profile table
CREATE TABLE public.tpo_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    institute_name text NOT NULL,
    department text NOT NULL,
    website text,
    CONSTRAINT tpo_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT tpo_profiles_user_id_key UNIQUE (user_id)
) TABLESPACE pg_default;

ALTER TABLE public.tpo_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view TPO profiles" 
    ON public.tpo_profiles 
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can update their own TPO profile" 
    ON public.tpo_profiles 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TPO profile" 
    ON public.tpo_profiles 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TPO profile" 
    ON public.tpo_profiles 
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);
