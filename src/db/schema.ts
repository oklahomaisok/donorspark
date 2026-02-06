import { pgTable, text, timestamp, integer, jsonb, serial, doublePrecision, boolean } from 'drizzle-orm/pg-core';

// Plan types
export const planEnum = ['free', 'starter', 'growth'] as const;
export type Plan = typeof planEnum[number];

export const billingCycleEnum = ['monthly', 'annual'] as const;
export type BillingCycle = typeof billingCycleEnum[number];

// Deck types
export const deckTypeEnum = ['impact', 'thankyou', 'event', 'annual'] as const;
export type DeckType = typeof deckTypeEnum[number];

// Status types
export const deckStatusEnum = ['generating', 'complete', 'failed'] as const;
export type DeckStatus = typeof deckStatusEnum[number];

export const uploadStatusEnum = ['processing', 'complete', 'failed'] as const;
export type UploadStatus = typeof uploadStatusEnum[number];

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  name: text('name'),
  // Plan & billing
  plan: text('plan', { enum: planEnum }).default('free').notNull(),
  planBillingCycle: text('plan_billing_cycle', { enum: billingCycleEnum }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end'),
  // Email verification (delayed)
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerifiedAt: timestamp('email_verified_at'),
  emailVerificationRemindedAt: timestamp('email_verification_reminded_at'),
  // Behavior tracking for upgrade triggers
  dashboardVisitCount: integer('dashboard_visit_count').default(0).notNull(),
  decksGenerated: integer('decks_generated').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(), // human-readable: boys-girls-club-permian-basin
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),
  brandData: jsonb('brand_data'), // cached brand extraction
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const decks = pgTable('decks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id), // null = anonymous
  organizationId: integer('organization_id').references(() => organizations.id),
  // Anonymous claim flow
  tempToken: text('temp_token').unique(), // for anonymous → registered claim
  expiresAt: timestamp('expires_at'), // 48h TTL for anonymous decks
  isExpired: boolean('is_expired').default(false).notNull(),
  // Deck identification
  slug: text('slug').unique().notNull(),
  deckType: text('deck_type', { enum: deckTypeEnum }).default('impact').notNull(),
  // Org data (kept for backwards compat)
  orgName: text('org_name').notNull(),
  orgUrl: text('org_url').notNull(),
  sector: text('sector'),
  // Generation status
  status: text('status', { enum: deckStatusEnum }).default('generating').notNull(),
  deckUrl: text('deck_url'),
  ogImageUrl: text('og_image_url'),
  triggerRunId: text('trigger_run_id'),
  brandData: jsonb('brand_data'),
  errorMessage: text('error_message'),
  // Analytics
  viewCount: integer('view_count').default(0).notNull(),
  clickCount: integer('click_count').default(0).notNull(),
  shareCount: integer('share_count').default(0).notNull(),
  // Personalization (for thankyou decks)
  donorName: text('donor_name'),
  donorSlug: text('donor_slug'),
  donorEmail: text('donor_email'),
  donorAmount: text('donor_amount'),
  parentDeckId: integer('parent_deck_id'), // Self-reference for personalized decks
  // Geo + timestamps
  city: text('city'),
  region: text('region'),
  country: text('country'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deckEvents = pgTable('deck_events', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull(),
  eventType: text('event_type').notNull(),
  sessionId: text('session_id').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const upgradeEvents = pgTable('upgrade_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  eventType: text('event_type').notNull(), // 'edit_attempt', 'share_milestone', 'dashboard_visit'
  metadata: jsonb('metadata'),
  emailSent: boolean('email_sent').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const donorUploads = pgTable('donor_uploads', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  baseDeckId: integer('base_deck_id').references(() => decks.id).notNull(),
  fileName: text('file_name').notNull(),
  donorCount: integer('donor_count').notNull(),
  processedCount: integer('processed_count').default(0).notNull(),
  status: text('status', { enum: uploadStatusEnum }).default('processing').notNull(),
  resultsCsvUrl: text('results_csv_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports for use in queries
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
export type DeckEvent = typeof deckEvents.$inferSelect;
export type UpgradeEvent = typeof upgradeEvents.$inferSelect;
export type DonorUpload = typeof donorUploads.$inferSelect;
