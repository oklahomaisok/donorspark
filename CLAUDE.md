# DonorSpark V3

AI-powered impact deck generator for nonprofits.

## Architecture

- **Next.js 15** App Router on Vercel
- **Trigger.dev v4** for background job processing (separate deployment)
- **Neon Postgres** via `@neondatabase/serverless`
- **Clerk** for authentication (Google OAuth)
- **Stripe** for subscription billing
- **Resend** for transactional emails
- **Vercel Blob** for deck HTML + OG images

## Key Files

| Purpose | Location |
|---------|----------|
| Database schema | `src/db/schema.ts` |
| Database queries | `src/db/queries.ts` |
| Deck generation task | `src/trigger/tasks/generate-deck.ts` |
| Pipeline logger | `src/trigger/lib/logger.ts` |
| Logo discovery | `src/trigger/pipeline/02-discover-logo.ts` |
| Color extraction | `src/trigger/pipeline/03-extract-colors.ts` |
| Brand processing | `src/trigger/pipeline/07-process-brand.ts` |
| Donor batch task | `src/trigger/tasks/generate-donor-decks.ts` |
| Deck HTML template | `src/lib/templates/deck-template.ts` |
| OG image template | `src/lib/templates/og-template.ts` |
| Deck route (preview injection) | `src/app/decks/[slug]/route.ts` |
| Deck editor | `src/app/dashboard/decks/[id]/edit/page.tsx` |
| Locked feature component | `src/components/editor/locked-feature.tsx` |
| Stripe config | `src/lib/stripe.ts` |
| Email client | `src/lib/resend.ts` |

## URL Structure

- `/` - Landing page with deck generator
- `/s/[orgSlug]` - Organization's public deck
- `/s/[orgSlug]/thankyou/[donorSlug]` - Personalized donor thank-you
- `/decks/[slug]` - Legacy URLs (redirect to `/s/`)
- `/dashboard` - Authenticated user dashboard
- `/claim/[tempToken]` - Anonymous deck claim flow
- `/pricing` - Subscription plans

## Deployment

### Vercel (Next.js)
Push to GitHub auto-deploys. Required env vars:
- `POSTGRES_URL` - Neon connection string
- `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_MONTHLY_PRICE_ID` / `STRIPE_STARTER_ANNUAL_PRICE_ID`
- `STRIPE_GROWTH_MONTHLY_PRICE_ID` / `STRIPE_GROWTH_ANNUAL_PRICE_ID`
- `RESEND_API_KEY`
- `CRON_SECRET` - For cron job auth
- `SITE_PASSWORD` - Optional password protection
- `BLOB_READ_WRITE_TOKEN`
- `ANTHROPIC_API_KEY`
- `TRIGGER_SECRET_KEY`

### Trigger.dev
Separate deployment: `npx trigger.dev@latest deploy`
Set same `POSTGRES_URL`, `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN` in Trigger.dev dashboard.

## Deck Generation Pipeline

1. Screenshot website (Puppeteer)
2. Discover logo + detect fonts (Apistemic API → DOM scrape → Google favicon)
3. Extract colors (Vision API + logo analysis)
4. Find about page content
5. Extract metrics (regex scraping)
6. Analyze with Claude (colors, content, sector)
7. Process brand data (merge all sources, contrast checks)
7b. Trim logo padding
8. Generate deck HTML
9. Generate OG HTML
10. Screenshot OG to PNG
11. Deploy to Vercel Blob + update DB

### Structured Logging
Pipeline uses `PipelineLogger` class for structured JSON logs. View in Trigger.dev dashboard under run logs. Each step logs duration, status, and relevant data.

### Color Selection Logic
Colors are selected in this priority order:
1. `extractedAccent` - from buttons/links on the page (Vision API)
2. `logoAccent` - vibrant colors from logo
3. `claudeAccent` - Claude's suggestion
4. Fallback - white (dark bg) or black (light bg)

**Contrast check**: If accent doesn't have WCAG AA contrast (ratio ≥ 3) against primary:
- Use original accent if it passes
- Fall back to white (if primary luminance < 0.65) or black (otherwise)
- No hue manipulation - keeps colors clean

### Logo Handling
- Logos display directly on header background (no forced white wrapper)
- Logo sources tried in order: Apistemic API → DOM scrape → apple-touch-icon → Google favicon
- DOM scrape validates URLs are actual images (rejects homepage URLs from text-based CSS logos)
- Favicon uses extracted logo when available, falls back to generated initial

### Anonymous Preview Mode
Anonymous decks get preview mode injected at serve-time (`/decks/[slug]/route.ts`):
- Full-width countdown banner on CTA slide showing time until expiration
- Share buttons replaced with "Create Free Account" CTA
- Countdown timer updates in real-time

## User Plans

| Plan | Features |
|------|----------|
| Free | 1 deck, DonorSpark branding, basic analytics |
| Starter ($29/mo) | 5 decks, no branding, priority support |
| Growth ($79/mo) | 10 decks, 50 donor personalization decks (CSV upload) |

## Deck Editor & Freemium Access

All users can access the deck editor at `/dashboard/decks/[id]/edit`. Free users have limited editing capabilities.

### Free Users Can Edit:
- **Logo** - Upload, replace, or remove
- **Metrics** - Add/edit numbers and descriptions
- **Testimonials** - Edit quotes, author names, titles, upload photos
- **Slide visibility** - Show/hide any slide

### Locked for Free Users (requires upgrade):
- Colors and fonts
- Slide reordering (drag-and-drop)
- Hero, Mission, Challenge, Programs, CTA slide content
- Background images for all slides

### Implementation
- UI uses `<LockedFeature>` component to overlay locked sections with upgrade prompt
- API (`/api/decks/[id]`) filters incoming updates - only allowed fields are saved for free users
- `canSave: true` for all users, but free users' changes are restricted server-side

## Database Tables

- `users` - Clerk-synced users with plan info
- `organizations` - Nonprofits with brand data
- `decks` - Generated decks (parent or personalized)
- `donor_uploads` - CSV upload tracking
- `upgrade_events` - Behavior tracking for upgrade triggers

## Security Notes

- Rate limiting: 10 req/hour per user ID (or IP for anonymous)
- CSV injection prevention on donor uploads
- Cron endpoints require `CRON_SECRET` Bearer token
- Stripe webhooks verified with signature

## Common Issues & Fixes

### Clerk auth() returns null
- **Cause**: `clerkMiddleware()` not configured in `middleware.ts`
- **Fix**: Ensure middleware.ts exports `clerkMiddleware()` with proper matcher

### User not found after sign-up
- **Cause**: Clerk webhook hasn't fired yet
- **Fix**: Checkout endpoint auto-creates user from Clerk data as fallback

### Stripe webhook 500 errors
- **Cause**: `STRIPE_WEBHOOK_SECRET` missing or has line breaks
- **Fix**: Re-paste the secret in Vercel, ensure no trailing whitespace

### "Not a valid URL" in Stripe checkout
- **Cause**: Environment variable has trailing `\n` (line break)
- **Fix**: Re-enter the value in Vercel without copy-paste artifacts

### useSearchParams() build error
- **Cause**: Next.js requires Suspense boundary for client components using useSearchParams
- **Fix**: Wrap component in `<Suspense>` or move to separate client component

### Logo not found / using Google favicon
- **Cause**: Apistemic API returned small image, DOM scrape didn't find logo
- **Debug**: Check Trigger.dev logs for `[Logo Discovery]` entries
- **Common issues**: JS-heavy sites, lazy-loaded images, non-standard selectors

### Logo shows as broken image
- **Cause**: Site uses text-based CSS logo (no actual `<img>` element), scraper returned homepage URL
- **Fix**: `isValidImageUrl()` validation rejects non-image URLs, falls back to Apistemic
- **Example**: ASPCA.org uses `<a class='footer-logo'>ASPCA</a>` instead of an image

### Wrong accent color (too dark/light)
- **Cause**: Color contrast function adjusted or fell back
- **Debug**: Check logs for `claudeAccent` vs final `accentColor`
- **Logic**: If accent fails contrast test with primary, falls back to white/black

### Accent text unreadable (same color as background)
- **Cause**: Both primary and accent are similar colors
- **Fix**: Contrast check should catch this and fall back to white/black
- **Debug**: Check `[Colors]` log entries for contrast ratio and luminance

## Testing Checklist

### Anonymous Flow
1. Visit `/` → Generate deck with nonprofit URL
2. View generated deck at `/decks/[slug]`
3. Verify preview banner shows for anonymous users

### Sign-up + Checkout Flow
1. Visit `/pricing` → Click "Start Free Trial"
2. Redirects to `/sign-up` with checkout intent preserved
3. Complete Google OAuth sign-up
4. Auto-redirects to Stripe checkout
5. Complete payment (test card: `4242 4242 4242 4242`)
6. Redirects to `/dashboard?upgraded=true`
7. Dashboard shows correct plan (not "Free Plan")

### Deck Claim Flow
1. Generate deck while anonymous
2. Sign up for account
3. Deck should auto-claim to new account

---

<!-- TRIGGER.DEV basic START -->
# Trigger.dev Basic Tasks (v4)

**MUST use `@trigger.dev/sdk`, NEVER `client.defineJob`**

## Basic Task

```ts
import { task } from "@trigger.dev/sdk";

export const processData = task({
  id: "process-data",
  retry: {
    maxAttempts: 10,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (payload: { userId: string; data: any[] }) => {
    // Task logic - runs for long time, no timeouts
    console.log(`Processing ${payload.data.length} items for user ${payload.userId}`);
    return { processed: payload.data.length };
  },
});
```

## Schema Task (with validation)

```ts
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const validatedTask = schemaTask({
  id: "validated-task",
  schema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
  run: async (payload) => {
    // Payload is automatically validated and typed
    return { message: `Hello ${payload.name}, age ${payload.age}` };
  },
});
```

## Triggering Tasks

### From Backend Code

```ts
import { tasks } from "@trigger.dev/sdk";
import type { processData } from "./trigger/tasks";

// Single trigger
const handle = await tasks.trigger<typeof processData>("process-data", {
  userId: "123",
  data: [{ id: 1 }, { id: 2 }],
});

// Batch trigger (up to 1,000 items, 3MB per payload)
const batchHandle = await tasks.batchTrigger<typeof processData>("process-data", [
  { payload: { userId: "123", data: [{ id: 1 }] } },
  { payload: { userId: "456", data: [{ id: 2 }] } },
]);
```

### Debounced Triggering

Consolidate multiple triggers into a single execution:

```ts
// Multiple rapid triggers with same key = single execution
await myTask.trigger(
  { userId: "123" },
  {
    debounce: {
      key: "user-123-update",  // Unique key for debounce group
      delay: "5s",              // Wait before executing
    },
  }
);

// Trailing mode: use payload from LAST trigger
await myTask.trigger(
  { data: "latest-value" },
  {
    debounce: {
      key: "trailing-example",
      delay: "10s",
      mode: "trailing",  // Default is "leading" (first payload)
    },
  }
);
```

**Debounce modes:**
- `leading` (default): Uses payload from first trigger, subsequent triggers only reschedule
- `trailing`: Uses payload from most recent trigger

### From Inside Tasks (with Result handling)

```ts
export const parentTask = task({
  id: "parent-task",
  run: async (payload) => {
    // Trigger and continue
    const handle = await childTask.trigger({ data: "value" });

    // Trigger and wait - returns Result object, NOT task output
    const result = await childTask.triggerAndWait({ data: "value" });
    if (result.ok) {
      console.log("Task output:", result.output); // Actual task return value
    } else {
      console.error("Task failed:", result.error);
    }

    // Quick unwrap (throws on error)
    const output = await childTask.triggerAndWait({ data: "value" }).unwrap();

    // Batch trigger and wait
    const results = await childTask.batchTriggerAndWait([
      { payload: { data: "item1" } },
      { payload: { data: "item2" } },
    ]);

    for (const run of results) {
      if (run.ok) {
        console.log("Success:", run.output);
      } else {
        console.log("Failed:", run.error);
      }
    }
  },
});

export const childTask = task({
  id: "child-task",
  run: async (payload: { data: string }) => {
    return { processed: payload.data };
  },
});
```

> Never wrap triggerAndWait or batchTriggerAndWait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Waits

```ts
import { task, wait } from "@trigger.dev/sdk";

export const taskWithWaits = task({
  id: "task-with-waits",
  run: async (payload) => {
    console.log("Starting task");

    // Wait for specific duration
    await wait.for({ seconds: 30 });
    await wait.for({ minutes: 5 });
    await wait.for({ hours: 1 });
    await wait.for({ days: 1 });

    // Wait until specific date
    await wait.until({ date: new Date("2024-12-25") });

    // Wait for token (from external system)
    await wait.forToken({
      token: "user-approval-token",
      timeoutInSeconds: 3600, // 1 hour timeout
    });

    console.log("All waits completed");
    return { status: "completed" };
  },
});
```

> Never wrap wait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Key Points

- **Result vs Output**: `triggerAndWait()` returns a `Result` object with `ok`, `output`, `error` properties - NOT the direct task output
- **Type safety**: Use `import type` for task references when triggering from backend
- **Waits > 5 seconds**: Automatically checkpointed, don't count toward compute usage
- **Debounce + idempotency**: Idempotency keys take precedence over debounce settings

## NEVER Use (v2 deprecated)

```ts
// BREAKS APPLICATION
client.defineJob({
  id: "job-id",
  run: async (payload, io) => {
    /* ... */
  },
});
```

Use SDK (`@trigger.dev/sdk`), check `result.ok` before accessing `result.output`

<!-- TRIGGER.DEV basic END -->