import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { decks, deckEvents } from '@/db/schema';
import { desc, sql, eq } from 'drizzle-orm';

const STATS_API_KEY = process.env.STATS_API_KEY;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const headerKey = authHeader?.replace('Bearer ', '');
  const queryKey = req.nextUrl.searchParams.get('key');
  const providedKey = headerKey || queryKey;
  const wantsJson = req.nextUrl.searchParams.get('format') === 'json';

  if (!STATS_API_KEY || providedKey !== STATS_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const totalDecks = await db.select({ count: sql<number>`count(*)` }).from(decks);
    const completedDecks = await db.select({ count: sql<number>`count(*)` })
      .from(decks)
      .where(eq(decks.status, 'complete'));

    const aggregates = await db.select({
      totalViews: sql<number>`coalesce(sum(${decks.viewCount}), 0)`,
      totalClicks: sql<number>`coalesce(sum(${decks.clickCount}), 0)`,
    }).from(decks);

    const donorsparkClicks = await db.select({ count: sql<number>`count(*)` })
      .from(deckEvents)
      .where(eq(deckEvents.eventType, 'donorspark_click'));

    const topDecks = await db.select({
      slug: decks.slug,
      orgName: decks.orgName,
      viewCount: decks.viewCount,
      clickCount: decks.clickCount,
      createdAt: decks.createdAt,
    })
      .from(decks)
      .where(eq(decks.status, 'complete'))
      .orderBy(desc(decks.createdAt))
      .limit(50);

    const recentDonorsparkClicks = await db.select({
      slug: deckEvents.slug,
      createdAt: deckEvents.createdAt,
      referrer: deckEvents.referrer,
    })
      .from(deckEvents)
      .where(eq(deckEvents.eventType, 'donorspark_click'))
      .orderBy(desc(deckEvents.createdAt))
      .limit(50);

    const data = {
      overview: {
        totalDecks: totalDecks[0]?.count || 0,
        completedDecks: completedDecks[0]?.count || 0,
        totalViews: aggregates[0]?.totalViews || 0,
        totalDonateClicks: aggregates[0]?.totalClicks || 0,
        donorsparkClicks: donorsparkClicks[0]?.count || 0,
      },
      topDecks,
      recentDonorsparkClicks,
    };

    if (wantsJson) {
      return NextResponse.json(data);
    }

    // Return HTML dashboard
    const html = generateDashboardHtml(data, queryKey || '');
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

function generateDashboardHtml(data: {
  overview: {
    totalDecks: number;
    completedDecks: number;
    totalViews: number;
    totalDonateClicks: number;
    donorsparkClicks: number;
  };
  topDecks: { slug: string; orgName: string; viewCount: number | null; clickCount: number | null; createdAt: Date | null }[];
  recentDonorsparkClicks: { slug: string; createdAt: Date | null; referrer: string | null }[];
}, apiKey: string): string {
  const { overview, topDecks, recentDonorsparkClicks } = data;

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const deckRows = topDecks.map(d => `
    <tr>
      <td class="org-name">
        <a href="https://donorspark.app/decks/${d.slug}" target="_blank">${escHtml(d.orgName || d.slug)}</a>
      </td>
      <td class="num">${d.viewCount || 0}</td>
      <td class="num">${d.clickCount || 0}</td>
      <td class="date">${formatDate(d.createdAt)}</td>
    </tr>
  `).join('');

  const clickRows = recentDonorsparkClicks.length > 0
    ? recentDonorsparkClicks.map(c => `
        <tr>
          <td><a href="https://donorspark.app/decks/${c.slug}" target="_blank">${c.slug}</a></td>
          <td class="date">${formatDate(c.createdAt)}</td>
          <td class="referrer">${escHtml(c.referrer || '-')}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" class="empty">No clicks yet</td></tr>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DonorSpark Analytics</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #e4e4e7;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    h1 span { color: #C15A36; }
    .refresh-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .refresh-btn:hover { background: rgba(255,255,255,0.2); }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1rem;
      padding: 1.5rem;
    }
    .stat-card .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a1a1aa;
      margin-bottom: 0.5rem;
    }
    .stat-card .value {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
    }
    .stat-card.highlight .value { color: #C15A36; }
    section {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    h2 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      padding: 0.75rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    td {
      padding: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 0.875rem;
    }
    tr:hover { background: rgba(255,255,255,0.02); }
    .org-name { max-width: 300px; }
    .org-name a {
      color: #e4e4e7;
      text-decoration: none;
      transition: color 0.2s;
    }
    .org-name a:hover { color: #C15A36; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .date { color: #71717a; white-space: nowrap; }
    .referrer { color: #71717a; font-size: 0.75rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
    .empty { text-align: center; color: #52525b; padding: 2rem; }
    a { color: #C15A36; }
    .last-updated {
      text-align: center;
      font-size: 0.75rem;
      color: #52525b;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1><span>DonorSpark</span> Analytics</h1>
      <button class="refresh-btn" onclick="location.reload()">Refresh</button>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Decks</div>
        <div class="value">${overview.totalDecks}</div>
      </div>
      <div class="stat-card highlight">
        <div class="label">Completed</div>
        <div class="value">${overview.completedDecks}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Views</div>
        <div class="value">${overview.totalViews}</div>
      </div>
      <div class="stat-card">
        <div class="label">Donate Clicks</div>
        <div class="value">${overview.totalDonateClicks}</div>
      </div>
      <div class="stat-card highlight">
        <div class="label">DonorSpark Clicks</div>
        <div class="value">${overview.donorsparkClicks}</div>
      </div>
    </div>

    <section>
      <h2>Recent Decks</h2>
      <table>
        <thead>
          <tr>
            <th>Organization</th>
            <th style="text-align:right">Views</th>
            <th style="text-align:right">Clicks</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${deckRows}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Recent DonorSpark Link Clicks</h2>
      <table>
        <thead>
          <tr>
            <th>Deck</th>
            <th>Time</th>
            <th>Referrer</th>
          </tr>
        </thead>
        <tbody>
          ${clickRows}
        </tbody>
      </table>
    </section>

    <div class="last-updated">
      Last updated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
    </div>
  </div>
</body>
</html>`;
}
