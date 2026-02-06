import { eq, desc, lt, and, isNull } from 'drizzle-orm';
import { db } from './index';
import { users, decks, organizations, upgradeEvents, donorUploads } from './schema';
import type { BrandData } from '@/lib/types';
import type { Plan, BillingCycle, DeckType } from './schema';

// ============================================================================
// User queries
// ============================================================================

export async function upsertUser(clerkId: string, email: string, name?: string) {
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (existing.length > 0) {
    await db.update(users)
      .set({ email, name, updatedAt: new Date() })
      .where(eq(users.clerkId, clerkId));
    return existing[0];
  }
  const [user] = await db.insert(users).values({ clerkId, email, name }).returning();
  return user;
}

export async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return user ?? null;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function updateUserPlan(
  userId: number,
  data: {
    plan: Plan;
    planBillingCycle?: BillingCycle | null;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    stripeCurrentPeriodEnd?: Date;
  }
) {
  await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function incrementUserDecks(clerkId: string) {
  const user = await getUserByClerkId(clerkId);
  if (user) {
    await db.update(users)
      .set({ decksGenerated: user.decksGenerated + 1, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }
}

export async function incrementDashboardVisits(userId: number) {
  const user = await getUserById(userId);
  if (user) {
    await db.update(users)
      .set({ dashboardVisitCount: user.dashboardVisitCount + 1, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}

export async function updateUserEmailVerification(userId: number, verified: boolean) {
  await db.update(users)
    .set({
      emailVerified: verified,
      emailVerifiedAt: verified ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string) {
  await db.update(users)
    .set({ stripeCustomerId, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// ============================================================================
// Organization queries
// ============================================================================

export async function createOrganization(data: {
  userId: number;
  name: string;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
  brandData?: Record<string, unknown>;
}) {
  const [org] = await db.insert(organizations).values(data).returning();
  return org;
}

export async function getOrganizationBySlug(slug: string) {
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return org ?? null;
}

export async function getOrganizationById(id: number) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return org ?? null;
}

export async function getUserOrganizations(userId: number) {
  return db.select().from(organizations).where(eq(organizations.userId, userId)).orderBy(desc(organizations.createdAt));
}

export async function updateOrganization(id: number, data: Partial<{
  name: string;
  slug: string;
  websiteUrl: string;
  logoUrl: string;
  brandData: Record<string, unknown>;
}>) {
  await db.update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, id));
}

// ============================================================================
// Deck queries
// ============================================================================

export async function createDeck(data: {
  userId?: number | null;
  organizationId?: number | null;
  slug: string;
  orgName: string;
  orgUrl: string;
  deckType?: DeckType;
  triggerRunId?: string;
  tempToken?: string;
  expiresAt?: Date;
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
  donorName?: string;
  donorSlug?: string;
  donorEmail?: string;
  donorAmount?: string;
  parentDeckId?: number;
}) {
  const [deck] = await db.insert(decks).values({
    userId: data.userId ?? null,
    organizationId: data.organizationId ?? null,
    slug: data.slug,
    orgName: data.orgName,
    orgUrl: data.orgUrl,
    deckType: data.deckType ?? 'impact',
    triggerRunId: data.triggerRunId,
    tempToken: data.tempToken,
    expiresAt: data.expiresAt,
    city: data.city,
    region: data.region,
    country: data.country,
    lat: data.lat,
    lng: data.lng,
    donorName: data.donorName,
    donorSlug: data.donorSlug,
    donorEmail: data.donorEmail,
    donorAmount: data.donorAmount,
    parentDeckId: data.parentDeckId,
  }).returning();
  return deck;
}

export async function completeDeck(slug: string, data: {
  deckUrl: string;
  ogImageUrl: string;
  sector?: string;
  brandData?: BrandData;
  orgName?: string;
}) {
  try {
    await db.update(decks)
      .set({
        status: 'complete',
        deckUrl: data.deckUrl,
        ogImageUrl: data.ogImageUrl,
        sector: data.sector,
        brandData: data.brandData as unknown as Record<string, unknown>,
        orgName: data.orgName,
        updatedAt: new Date(),
      })
      .where(eq(decks.slug, slug));
  } catch (error) {
    console.error('completeDeck error details:', error);
    throw error;
  }
}

export async function failDeck(slug: string, errorMessage: string) {
  try {
    await db.update(decks)
      .set({
        status: 'failed',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(decks.slug, slug));
  } catch (error) {
    console.error('failDeck error (deck still generated but DB not updated):', error);
    // Don't rethrow - deck generation succeeded, just DB update failed
  }
}

export async function getDeckBySlug(slug: string) {
  const [deck] = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);
  return deck ?? null;
}

export async function getDeckByTempToken(tempToken: string) {
  const [deck] = await db.select().from(decks).where(eq(decks.tempToken, tempToken)).limit(1);
  return deck ?? null;
}

export async function getUserDecks(userId: number) {
  return db.select().from(decks).where(eq(decks.userId, userId)).orderBy(desc(decks.createdAt));
}

export async function getOrganizationDecks(organizationId: number) {
  return db.select().from(decks).where(eq(decks.organizationId, organizationId)).orderBy(desc(decks.createdAt));
}

export async function getDeckById(id: number) {
  const [deck] = await db.select().from(decks).where(eq(decks.id, id)).limit(1);
  return deck ?? null;
}

export async function claimDeck(
  deckId: number,
  userId: number,
  organizationId: number
) {
  await db.update(decks)
    .set({
      userId,
      organizationId,
      tempToken: null,
      expiresAt: null,
      isExpired: false,
      updatedAt: new Date(),
    })
    .where(eq(decks.id, deckId));
}

export async function markExpiredDecks() {
  const now = new Date();
  const result = await db.update(decks)
    .set({ isExpired: true, updatedAt: new Date() })
    .where(
      and(
        isNull(decks.userId),
        lt(decks.expiresAt, now),
        eq(decks.isExpired, false)
      )
    )
    .returning({ id: decks.id });
  return result.length;
}

export async function incrementDeckViews(slug: string) {
  const deck = await getDeckBySlug(slug);
  if (deck) {
    await db.update(decks)
      .set({ viewCount: deck.viewCount + 1, updatedAt: new Date() })
      .where(eq(decks.slug, slug));
  }
}

export async function incrementDeckClicks(slug: string) {
  const deck = await getDeckBySlug(slug);
  if (deck) {
    await db.update(decks)
      .set({ clickCount: deck.clickCount + 1, updatedAt: new Date() })
      .where(eq(decks.slug, slug));
  }
}

export async function incrementDeckShares(slug: string) {
  const deck = await getDeckBySlug(slug);
  if (deck) {
    await db.update(decks)
      .set({ shareCount: deck.shareCount + 1, updatedAt: new Date() })
      .where(eq(decks.slug, slug));
  }
}

// Get personalized decks for a parent deck
export async function getPersonalizedDecks(parentDeckId: number) {
  return db.select().from(decks).where(eq(decks.parentDeckId, parentDeckId)).orderBy(desc(decks.createdAt));
}

// ============================================================================
// Upgrade events queries
// ============================================================================

export async function createUpgradeEvent(data: {
  userId: number;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  const [event] = await db.insert(upgradeEvents).values(data).returning();
  return event;
}

export async function getUserUpgradeEvents(userId: number) {
  return db.select().from(upgradeEvents).where(eq(upgradeEvents.userId, userId)).orderBy(desc(upgradeEvents.createdAt));
}

export async function markUpgradeEventEmailSent(eventId: number) {
  await db.update(upgradeEvents)
    .set({ emailSent: true })
    .where(eq(upgradeEvents.id, eventId));
}

// ============================================================================
// Donor uploads queries
// ============================================================================

export async function createDonorUpload(data: {
  userId: number;
  organizationId: number;
  baseDeckId: number;
  fileName: string;
  donorCount: number;
}) {
  const [upload] = await db.insert(donorUploads).values(data).returning();
  return upload;
}

export async function getDonorUploadById(id: number) {
  const [upload] = await db.select().from(donorUploads).where(eq(donorUploads.id, id)).limit(1);
  return upload ?? null;
}

export async function updateDonorUploadProgress(id: number, processedCount: number) {
  await db.update(donorUploads)
    .set({ processedCount })
    .where(eq(donorUploads.id, id));
}

export async function completeDonorUpload(id: number, resultsCsvUrl: string) {
  await db.update(donorUploads)
    .set({ status: 'complete', resultsCsvUrl })
    .where(eq(donorUploads.id, id));
}

export async function failDonorUpload(id: number) {
  await db.update(donorUploads)
    .set({ status: 'failed' })
    .where(eq(donorUploads.id, id));
}

export async function getUserDonorUploads(userId: number) {
  return db.select().from(donorUploads).where(eq(donorUploads.userId, userId)).orderBy(desc(donorUploads.createdAt));
}
