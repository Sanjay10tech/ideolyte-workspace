# Ideolyte Workspace - Supabase Setup Guide

## Prerequisites

- A Supabase account (https://supabase.com)
- Node.js 18+ installed

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it (e.g., "ideolyte-workspace")
4. Set a strong database password
5. Choose a region closest to your users
6. Wait for the project to be provisioned

## Step 2: Get Your API Keys

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **anon/public key** (safe for frontend)
   - **service_role key** (server-only, NEVER expose in frontend)

## Step 3: Configure Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 4: Run Database Migrations

Go to your Supabase Dashboard > **SQL Editor** and run these files **in order**:

### Migration 1: Schema
Open `supabase/migrations/001_schema.sql` and execute the entire file.

This creates:
- All enum types (user_role, project_status, task_status, etc.)
- All 17 tables with proper constraints
- Indexes for performance
- Auto-update triggers for `updated_at` columns
- Auto-create profile trigger on user signup

### Migration 2: RLS Policies
Open `supabase/migrations/002_rls_policies.sql` and execute the entire file.

This creates:
- Row Level Security policies on all tables
- Admin has full access to everything
- Clients can ONLY access their own data
- Helper functions: `is_admin()` and `get_my_client_id()`

### Migration 3: Storage
Open `supabase/migrations/003_storage.sql` and execute the entire file.

This creates:
- `project-files` bucket (private, 50MB max)
- `avatars` bucket (public, 5MB max)
- Storage access policies

## Step 5: Configure Authentication

1. Go to **Authentication > Providers** in Supabase
2. Ensure **Email** provider is enabled
3. (Optional) Disable "Confirm email" for development:
   - Go to **Authentication > Settings**
   - Under "Email Auth", toggle off "Enable email confirmations"
4. Set the **Site URL** to `http://localhost:3000`
5. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

## Step 6: Create Admin User

1. Go to **Authentication > Users** in Supabase
2. Click "Add User" > "Create New User"
3. Enter admin email and password
4. After user is created, go to **Table Editor > profiles**
5. Find the new user's row and change `role` to `admin`

Alternatively, run this SQL (replace email/password):
```sql
-- After creating the user via Auth dashboard, update their role:
UPDATE profiles SET role = 'admin' WHERE email = 'admin@ideolyte.com';
```

## Step 7: Create Test Client User

1. Go to **Authentication > Users**
2. Click "Add User" > "Create New User"
3. Enter client email and password
4. The profile will auto-create with role `client`
5. Then create a client record:

```sql
-- Get the profile ID
INSERT INTO clients (profile_id, company, status)
SELECT id, 'TechVision Inc.', 'active'
FROM profiles WHERE email = 'client@example.com';
```

## Step 8: Install Dependencies & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/login` and sign in!

- **Admin** → Redirected to `/admin`
- **Client** → Redirected to `/client`

## Architecture

### Authentication Flow

1. User submits login form
2. Server action calls `supabase.auth.signInWithPassword()`
3. On success, queries `profiles` table for role
4. Redirects to appropriate portal (`/admin` or `/client`)
5. Middleware protects routes on every request

### Security Layers

1. **Middleware** (`src/middleware.ts`): Intercepts all requests, refreshes sessions, enforces route access
2. **RLS Policies**: Database-level security. Even if frontend is bypassed, data is protected
3. **Server Actions**: Auth operations run server-side only
4. **Service Role Key**: Only used server-side, never exposed to browser

### Route Protection

| Route | Access |
|-------|--------|
| `/` | Public |
| `/services`, `/portfolio`, etc. | Public |
| `/login` | Public (redirects if logged in) |
| `/admin/*` | Admin only |
| `/client/*` | Client only |
| `/unauthorized` | Public (shown when access denied) |

## Troubleshooting

- **"Invalid login credentials"**: Check email/password, ensure user exists in Auth
- **Redirect loops**: Clear browser cookies, check `.env.local` values
- **RLS errors**: Make sure migrations ran in order (001 → 002 → 003)
- **Profile not created**: Check the `on_auth_user_created` trigger exists
- **Storage errors**: Ensure buckets were created via migration 003
