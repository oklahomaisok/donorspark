import { eq, desc } from 'drizzle-orm';
import { db } from './index';
import { users, decks } from './schema';
import type { BrandData } from '@/lib/types';

// User queries
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

// Deck queries
export async function createDeck(data: {
  userId?: number | null;
  slug: string;
  orgName: string;
  orgUrl: string;
  triggerRunId?: string;
}) {
  const [deck] = await db.insert(decks).values({
    userId: data.userId ?? null,
    slug: data.slug,
    orgName: data.orgName,
    orgUrl: data.orgUrl,
    triggerRunId: data.triggerRunId,
  }).returning();
  return deck;
}

export async function completeDeck(slug: string, data: {
  deckUrl: string;
  ogImageUrl: string;
  sector?: string;
  brandData?: BrandData;
}) {
  await db.update(decks)
    .set({
      status: 'complete',
      deckUrl: data.deckUrl,
      ogImageUrl: data.ogImageUrl,
      sector: data.sector,
      brandData: data.brandData as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(decks.slug, slug));
}

export async function failDeck(slug: string, errorMessage: string) {
  await db.update(decks)
    .set({
      status: 'failed',
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(decks.slug, slug));
}

export async function getDeckBySlug(slug: string) {
  const [deck] = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);
  return deck ?? null;
}

export async function getUserDecks(userId: number) {
  return db.select().from(decks).where(eq(decks.userId, userId)).orderBy(desc(decks.createdAt));
}

export async function getDeckById(id: number) {
  const [deck] = await db.select().from(decks).where(eq(decks.id, id)).limit(1);
  return deck ?? null;
}

export async function incrementUserDecks(clerkId: string) {
  const user = await getUserByClerkId(clerkId);
  if (user) {
    await db.update(users)
      .set({ decksGenerated: user.decksGenerated + 1, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }
}
