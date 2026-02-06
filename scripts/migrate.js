const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.POSTGRES_URL);

async function migrate() {
  console.log('Starting migration...');

  // Add new columns to users table
  console.log('Adding columns to users table...');
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' NOT NULL,
    ADD COLUMN IF NOT EXISTS plan_billing_cycle text,
    ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
    ADD COLUMN IF NOT EXISTS stripe_price_id text,
    ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamp,
    ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS email_verified_at timestamp,
    ADD COLUMN IF NOT EXISTS email_verification_reminded_at timestamp,
    ADD COLUMN IF NOT EXISTS dashboard_visit_count integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS decks_generated integer DEFAULT 0 NOT NULL
  `;

  // Create organizations table
  console.log('Creating organizations table...');
  await sql`
    CREATE TABLE IF NOT EXISTS organizations (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id),
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      website_url text,
      logo_url text,
      brand_data jsonb,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `;

  // Add new columns to decks table
  console.log('Adding columns to decks table...');
  await sql`
    ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS organization_id integer REFERENCES organizations(id),
    ADD COLUMN IF NOT EXISTS temp_token text UNIQUE,
    ADD COLUMN IF NOT EXISTS expires_at timestamp,
    ADD COLUMN IF NOT EXISTS is_expired boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS deck_type text DEFAULT 'impact' NOT NULL,
    ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS share_count integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS donor_name text,
    ADD COLUMN IF NOT EXISTS donor_slug text,
    ADD COLUMN IF NOT EXISTS donor_email text,
    ADD COLUMN IF NOT EXISTS donor_amount text,
    ADD COLUMN IF NOT EXISTS parent_deck_id integer REFERENCES decks(id)
  `;

  // Create upgrade_events table
  console.log('Creating upgrade_events table...');
  await sql`
    CREATE TABLE IF NOT EXISTS upgrade_events (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id),
      event_type text NOT NULL,
      metadata jsonb,
      email_sent boolean DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;

  // Create donor_uploads table
  console.log('Creating donor_uploads table...');
  await sql`
    CREATE TABLE IF NOT EXISTS donor_uploads (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id),
      organization_id integer NOT NULL REFERENCES organizations(id),
      base_deck_id integer NOT NULL REFERENCES decks(id),
      file_name text NOT NULL,
      donor_count integer NOT NULL,
      processed_count integer DEFAULT 0 NOT NULL,
      status text DEFAULT 'processing' NOT NULL,
      results_csv_url text,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;

  console.log('Migration complete!');
}

migrate().catch(console.error);
