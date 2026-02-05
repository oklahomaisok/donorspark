import { pgTable, text, timestamp, integer, jsonb, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  name: text('name'),
  plan: text('plan').default('free').notNull(),
  decksGenerated: integer('decks_generated').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const decks = pgTable('decks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  slug: text('slug').unique().notNull(),
  orgName: text('org_name').notNull(),
  orgUrl: text('org_url').notNull(),
  sector: text('sector'),
  status: text('status', { enum: ['generating', 'complete', 'failed'] }).default('generating').notNull(),
  deckUrl: text('deck_url'),
  ogImageUrl: text('og_image_url'),
  triggerRunId: text('trigger_run_id'),
  brandData: jsonb('brand_data'),
  errorMessage: text('error_message'),
  viewCount: integer('view_count').default(0).notNull(),
  clickCount: integer('click_count').default(0).notNull(),
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
