# Supabase Setup Guide

## Step 1: Create Environment File

Create a `.env.local` file in the root directory with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://puyqzdoveokrdhitjwug.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_Pwa1B6cM6miveVrWpI6yCA_R8zDyR5s
```

**Note:** The `.env.local` file is already in `.gitignore` so it won't be committed to git.

## Step 2: Create Supabase Table

Go to your Supabase dashboard (https://supabase.com/dashboard) and create a table called `presets` with the following structure:

### SQL to Create Table:

```sql
CREATE TABLE presets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  css_body TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read and insert (adjust as needed)
CREATE POLICY "Allow public read and insert" ON presets
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Or Create via Supabase Dashboard:

1. Go to **Table Editor** in your Supabase dashboard
2. Click **New Table**
3. Name it `presets`
4. Add the following columns:
   - `id` - Type: `int8` - Primary Key - Default: `auto increment`
   - `name` - Type: `text` - Required
   - `css_body` - Type: `text` - Required
   - `primary_color` - Type: `text` - Required
   - `secondary_color` - Type: `text` - Required
   - `created_at` - Type: `timestamptz` - Default: `now()`
5. Save the table

## Step 3: Set Up Row Level Security (RLS)

1. Go to **Authentication** > **Policies** in Supabase
2. Select the `presets` table
3. Create policies based on your needs:

   **For public read/write (testing):**
   - Policy Name: `Allow public access`
   - Allowed Operation: `ALL`
   - USING expression: `true`
   - WITH CHECK expression: `true`

   **For authenticated users only (recommended for production):**
   - Allow SELECT for authenticated users
   - Allow INSERT for authenticated users

## Step 4: Test the Connection

After setting up the table, test the connection:

1. Start your dev server: `npm run dev`
2. Open the app in your browser
3. Go to the Gallery tab
4. Try to save a preset to cloud (hover over a card and click "Save to Cloud")
5. Check your Supabase `presets` table to see if the data was inserted

## Troubleshooting

### If you get permission errors:
- Check that Row Level Security policies are set correctly
- Verify the publishable key is correct

### If the table doesn't exist:
- Make sure the table name is exactly `presets` (lowercase)
- Verify all columns are named correctly

### If connection fails:
- Verify your Supabase URL and key are correct in `.env.local`
- Check that your Supabase project is active
- Ensure the Supabase JS library is installed: `npm install @supabase/supabase-js`

