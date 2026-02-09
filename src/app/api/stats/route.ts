import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { decks, deckEvents, users } from '@/db/schema';
import { desc, sql, eq, isNotNull, and } from 'drizzle-orm';

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
    // Existing queries
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

    // Today's decks
    const todaysDecks = await db.select({ count: sql<number>`count(*)` })
      .from(decks)
      .where(sql`${decks.createdAt} >= CURRENT_DATE`);

    // Today's users
    const todaysUsers = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= CURRENT_DATE`);

    // Decks per day (last 30 days)
    const decksPerDay = await db.select({
      day: sql<string>`DATE(${decks.createdAt})`,
      count: sql<number>`count(*)`,
    })
      .from(decks)
      .where(and(
        eq(decks.status, 'complete'),
        sql`${decks.createdAt} > NOW() - INTERVAL '30 days'`
      ))
      .groupBy(sql`DATE(${decks.createdAt})`)
      .orderBy(sql`DATE(${decks.createdAt})`);

    // Users per day (last 30 days)
    const usersPerDay = await db.select({
      day: sql<string>`DATE(${users.createdAt})`,
      count: sql<number>`count(*)`,
    })
      .from(users)
      .where(sql`${users.createdAt} > NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // Decks per sector (all time)
    const decksPerSector = await db.select({
      sector: decks.sector,
      count: sql<number>`count(*)`,
    })
      .from(decks)
      .where(and(
        eq(decks.status, 'complete'),
        isNotNull(decks.sector)
      ))
      .groupBy(decks.sector)
      .orderBy(sql`count(*) DESC`);

    // Top decks (expanded to 100, includes sector)
    const topDecks = await db.select({
      slug: decks.slug,
      orgName: decks.orgName,
      sector: decks.sector,
      viewCount: decks.viewCount,
      clickCount: decks.clickCount,
      city: decks.city,
      region: decks.region,
      country: decks.country,
      createdAt: decks.createdAt,
    })
      .from(decks)
      .where(eq(decks.status, 'complete'))
      .orderBy(desc(decks.createdAt))
      .limit(100);

    const recentDonorsparkClicks = await db.select({
      slug: deckEvents.slug,
      createdAt: deckEvents.createdAt,
      referrer: deckEvents.referrer,
    })
      .from(deckEvents)
      .where(eq(deckEvents.eventType, 'donorspark_click'))
      .orderBy(desc(deckEvents.createdAt))
      .limit(50);

    // Location data for heatmap
    const locations = await db.select({
      lat: decks.lat,
      lng: decks.lng,
      city: decks.city,
      country: decks.country,
    })
      .from(decks)
      .where(and(isNotNull(decks.lat), isNotNull(decks.lng)));

    const data = {
      overview: {
        totalDecks: totalDecks[0]?.count || 0,
        completedDecks: completedDecks[0]?.count || 0,
        totalViews: aggregates[0]?.totalViews || 0,
        totalDonateClicks: aggregates[0]?.totalClicks || 0,
        donorsparkClicks: donorsparkClicks[0]?.count || 0,
        todaysDecks: todaysDecks[0]?.count || 0,
        todaysUsers: todaysUsers[0]?.count || 0,
      },
      topDecks,
      recentDonorsparkClicks,
      locations,
      decksPerDay,
      usersPerDay,
      decksPerSector,
    };

    if (wantsJson) {
      return NextResponse.json(data);
    }

    const html = generateDashboardHtml(data, queryKey || '');
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

interface DashboardData {
  overview: {
    totalDecks: number;
    completedDecks: number;
    totalViews: number;
    totalDonateClicks: number;
    donorsparkClicks: number;
    todaysDecks: number;
    todaysUsers: number;
  };
  topDecks: {
    slug: string;
    orgName: string;
    sector: string | null;
    viewCount: number | null;
    clickCount: number | null;
    city: string | null;
    region: string | null;
    country: string | null;
    createdAt: Date | null;
  }[];
  recentDonorsparkClicks: { slug: string; createdAt: Date | null; referrer: string | null }[];
  locations: { lat: number | null; lng: number | null; city: string | null; country: string | null }[];
  decksPerDay: { day: string; count: number }[];
  usersPerDay: { day: string; count: number }[];
  decksPerSector: { sector: string | null; count: number }[];
}

function generateDashboardHtml(data: DashboardData, apiKey: string): string {
  const { overview, topDecks, recentDonorsparkClicks, locations, decksPerDay, usersPerDay, decksPerSector } = data;

  const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const formatLocation = (city: string | null, region: string | null, country: string | null) => {
    const parts = [city, region, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Build deck rows with data attributes for sorting/filtering
  const deckRows = topDecks.map(d => {
    const ts = d.createdAt ? new Date(d.createdAt).getTime() : 0;
    return `<tr data-sector="${escHtml(d.sector || '')}" data-views="${d.viewCount || 0}" data-clicks="${d.clickCount || 0}" data-date="${ts}">
      <td class="org-name"><a href="https://donorspark.app/decks/${d.slug}" target="_blank">${escHtml(d.orgName || d.slug)}</a></td>
      <td class="sector-cell">${escHtml(d.sector || '-')}</td>
      <td class="location">${escHtml(formatLocation(d.city, d.region, d.country))}</td>
      <td class="num">${d.viewCount || 0}</td>
      <td class="num">${d.clickCount || 0}</td>
      <td class="date">${formatDate(d.createdAt)}</td>
    </tr>`;
  }).join('');

  const clickRows = recentDonorsparkClicks.length > 0
    ? recentDonorsparkClicks.map(c => `
        <tr>
          <td><a href="https://donorspark.app/decks/${c.slug}" target="_blank">${c.slug}</a></td>
          <td class="date">${formatDate(c.createdAt)}</td>
          <td class="referrer">${escHtml(c.referrer || '-')}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" class="empty">No clicks yet</td></tr>';

  // Heatmap data
  const heatmapPoints = locations
    .filter(l => l.lat && l.lng)
    .map(l => `[${l.lat}, ${l.lng}, 0.5]`)
    .join(',');
  const hasMapData = locations.filter(l => l.lat && l.lng).length > 0;

  // Sector table rows
  const sectorTotal = decksPerSector.reduce((s, r) => s + r.count, 0);
  const sectorRows = decksPerSector.map(s => {
    const pct = sectorTotal > 0 ? ((s.count / sectorTotal) * 100).toFixed(1) : '0';
    return `<tr><td>${escHtml(s.sector || 'Unknown')}</td><td class="num">${s.count}</td><td class="num">${pct}%</td></tr>`;
  }).join('');

  // Collect unique sectors for filter dropdown
  const uniqueSectors = Array.from(new Set(topDecks.map(d => d.sector).filter(Boolean))).sort() as string[];
  const sectorOptions = uniqueSectors.map(s => `<option value="${escHtml(s)}">${escHtml(s)}</option>`).join('');

  // JSON data for charts
  const chartData = JSON.stringify({
    decksPerDay: decksPerDay.map(d => ({ day: d.day, count: d.count })),
    usersPerDay: usersPerDay.map(d => ({ day: d.day, count: d.count })),
    decksPerSector: decksPerSector.map(d => ({ sector: d.sector || 'Unknown', count: d.count })),
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DonorSpark Analytics</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #e4e4e7;
      padding: 2rem;
    }
    .container { max-width: 1400px; margin: 0 auto; }
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
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1rem;
      padding: 1.25rem;
    }
    .stat-card .label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a1a1aa;
      margin-bottom: 0.5rem;
    }
    .stat-card .value {
      font-size: 2rem;
      font-weight: 700;
      color: white;
    }
    .stat-card.highlight .value { color: #C15A36; }
    .stat-card.today { border-color: rgba(59,130,246,0.3); }
    .stat-card.today .value { color: #3b82f6; }
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
    #map {
      width: 100%;
      height: 400px;
      border-radius: 0.75rem;
      overflow: hidden;
    }
    .map-empty {
      width: 100%;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.2);
      border-radius: 0.75rem;
      color: #52525b;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 1024px) {
      .two-col { grid-template-columns: 1fr; }
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      padding: 0.75rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    th.sortable {
      cursor: pointer;
      user-select: none;
      transition: color 0.2s;
    }
    th.sortable:hover { color: #C15A36; }
    th.sortable::after {
      content: ' \\2195';
      font-size: 0.6rem;
      opacity: 0.5;
    }
    th.sort-asc::after { content: ' \\2191'; opacity: 1; }
    th.sort-desc::after { content: ' \\2193'; opacity: 1; }
    td {
      padding: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 0.8rem;
    }
    tr:hover { background: rgba(255,255,255,0.02); }
    .org-name { max-width: 200px; }
    .org-name a {
      color: #e4e4e7;
      text-decoration: none;
      transition: color 0.2s;
    }
    .org-name a:hover { color: #C15A36; }
    .sector-cell { color: #a1a1aa; font-size: 0.75rem; }
    .location { color: #71717a; font-size: 0.75rem; max-width: 150px; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .date { color: #71717a; white-space: nowrap; font-size: 0.75rem; }
    .referrer { color: #71717a; font-size: 0.7rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .empty { text-align: center; color: #52525b; padding: 2rem; }
    a { color: #C15A36; }
    .last-updated {
      text-align: center;
      font-size: 0.75rem;
      color: #52525b;
      margin-top: 2rem;
    }
    .leaflet-container { background: #1a1a2e; }
    .chart-container {
      position: relative;
      height: 280px;
    }
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .filter-bar select {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #e4e4e7;
      padding: 0.4rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-family: inherit;
    }
    .filter-bar select option { background: #1a1a2e; color: #e4e4e7; }
    .filter-bar label { font-size: 0.75rem; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1><span>DonorSpark</span> Analytics</h1>
      <button class="refresh-btn" onclick="location.reload()">Refresh</button>
    </header>

    <!-- Row 1: Stat Cards -->
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
      <div class="stat-card today">
        <div class="label">Today's Decks</div>
        <div class="value">${overview.todaysDecks}</div>
      </div>
      <div class="stat-card today">
        <div class="label">Today's Users</div>
        <div class="value">${overview.todaysUsers}</div>
      </div>
    </div>

    <!-- Row 2: Time-Series Charts -->
    <div class="two-col">
      <section>
        <h2>Decks Per Day (Last 30 Days)</h2>
        <div class="chart-container">
          <canvas id="decksChart"></canvas>
        </div>
      </section>
      <section>
        <h2>New Users Per Day (Last 30 Days)</h2>
        <div class="chart-container">
          <canvas id="usersChart"></canvas>
        </div>
      </section>
    </div>

    <!-- Row 3: Sector Breakdown -->
    <div class="two-col">
      <section>
        <h2>Decks by Sector</h2>
        <div class="chart-container">
          <canvas id="sectorChart"></canvas>
        </div>
      </section>
      <section>
        <h2>Sector Breakdown</h2>
        <div style="max-height: 340px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Sector</th>
                <th style="text-align:right">Count</th>
                <th style="text-align:right">%</th>
              </tr>
            </thead>
            <tbody>
              ${sectorRows || '<tr><td colspan="3" class="empty">No sector data yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Row 4: Heatmap -->
    <section>
      <h2>Deck Generation Heatmap</h2>
      ${hasMapData ? '<div id="map"></div>' : '<div class="map-empty">No location data yet. Generate a deck to see the map!</div>'}
    </section>

    <!-- Row 5: Top Decks Table (enhanced) -->
    <section>
      <h2>All Decks</h2>
      <div class="filter-bar">
        <label for="sectorFilter">Sector:</label>
        <select id="sectorFilter" onchange="filterBySector(this.value)">
          <option value="">All Sectors</option>
          ${sectorOptions}
        </select>
      </div>
      <div style="max-height: 600px; overflow-y: auto;">
        <table id="decksTable">
          <thead>
            <tr>
              <th>Organization</th>
              <th class="sortable" data-sort="sector" onclick="sortTable('sector')">Sector</th>
              <th>Location</th>
              <th class="sortable num" data-sort="views" onclick="sortTable('views')" style="text-align:right">Views</th>
              <th class="sortable num" data-sort="clicks" onclick="sortTable('clicks')" style="text-align:right">Clicks</th>
              <th class="sortable" data-sort="date" onclick="sortTable('date')">Created</th>
            </tr>
          </thead>
          <tbody id="decksBody">
            ${deckRows}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Row 6: Recent DS clicks -->
    <section>
      <h2>Recent DonorSpark Link Clicks</h2>
      <div style="max-height: 400px; overflow-y: auto;">
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
      </div>
    </section>

    <div class="last-updated">
      Last updated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
    </div>
  </div>

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <script>
    // Embedded chart data
    var CHART_DATA = ${chartData};

    // Chart.js defaults for dark theme
    Chart.defaults.color = '#71717a';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

    var sectorColors = [
      '#C15A36','#3b82f6','#8b5cf6','#ec4899','#f97316',
      '#10b981','#06b6d4','#eab308','#ef4444','#6366f1',
      '#14b8a6','#f59e0b','#84cc16','#a855f7','#fb923c',
      '#22d3ee','#e879f9','#facc15','#4ade80','#f87171'
    ];

    function formatDay(d) {
      var parts = d.split('-');
      return parts[1] + '/' + parts[2];
    }

    // Decks per day bar chart
    new Chart(document.getElementById('decksChart'), {
      type: 'bar',
      data: {
        labels: CHART_DATA.decksPerDay.map(function(d) { return formatDay(d.day); }),
        datasets: [{
          label: 'Decks',
          data: CHART_DATA.decksPerDay.map(function(d) { return d.count; }),
          backgroundColor: 'rgba(193,90,54,0.7)',
          borderColor: '#C15A36',
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });

    // Users per day bar chart
    new Chart(document.getElementById('usersChart'), {
      type: 'bar',
      data: {
        labels: CHART_DATA.usersPerDay.map(function(d) { return formatDay(d.day); }),
        datasets: [{
          label: 'Users',
          data: CHART_DATA.usersPerDay.map(function(d) { return d.count; }),
          backgroundColor: 'rgba(59,130,246,0.7)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });

    // Sector doughnut chart
    new Chart(document.getElementById('sectorChart'), {
      type: 'doughnut',
      data: {
        labels: CHART_DATA.decksPerSector.map(function(d) { return d.sector; }),
        datasets: [{
          data: CHART_DATA.decksPerSector.map(function(d) { return d.count; }),
          backgroundColor: CHART_DATA.decksPerSector.map(function(_, i) {
            return sectorColors[i % sectorColors.length];
          }),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
          }
        }
      }
    });

    // Table sorting
    var currentSort = { col: null, dir: null };

    function sortTable(col) {
      var tbody = document.getElementById('decksBody');
      var rows = Array.from(tbody.querySelectorAll('tr'));

      // Toggle direction
      if (currentSort.col === col) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.col = col;
        currentSort.dir = (col === 'views' || col === 'clicks' || col === 'date') ? 'desc' : 'asc';
      }

      // Update header indicators
      document.querySelectorAll('#decksTable th.sortable').forEach(function(th) {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === col) {
          th.classList.add(currentSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
        }
      });

      rows.sort(function(a, b) {
        var aVal, bVal;
        if (col === 'views') {
          aVal = parseInt(a.dataset.views); bVal = parseInt(b.dataset.views);
        } else if (col === 'clicks') {
          aVal = parseInt(a.dataset.clicks); bVal = parseInt(b.dataset.clicks);
        } else if (col === 'date') {
          aVal = parseInt(a.dataset.date); bVal = parseInt(b.dataset.date);
        } else if (col === 'sector') {
          aVal = a.dataset.sector.toLowerCase(); bVal = b.dataset.sector.toLowerCase();
          if (aVal < bVal) return currentSort.dir === 'asc' ? -1 : 1;
          if (aVal > bVal) return currentSort.dir === 'asc' ? 1 : -1;
          return 0;
        }
        return currentSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
      });

      rows.forEach(function(row) { tbody.appendChild(row); });
    }

    // Sector filter
    function filterBySector(sector) {
      var rows = document.querySelectorAll('#decksBody tr');
      rows.forEach(function(row) {
        if (!sector || row.dataset.sector === sector) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  </script>

  ${hasMapData ? `
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"><\/script>
  <script>
    var map = L.map('map').setView([39.8, -98.5], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    var heatData = [${heatmapPoints}];

    if (heatData.length > 0) {
      var heat = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.2: '#3b82f6',
          0.4: '#8b5cf6',
          0.6: '#ec4899',
          0.8: '#f97316',
          1.0: '#C15A36'
        }
      }).addTo(map);

      heatData.forEach(function(point) {
        L.circleMarker([point[0], point[1]], {
          radius: 6,
          fillColor: '#C15A36',
          color: '#fff',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.6
        }).addTo(map);
      });

      if (heatData.length > 1) {
        var bounds = L.latLngBounds(heatData.map(function(p) { return [p[0], p[1]]; }));
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([heatData[0][0], heatData[0][1]], 6);
      }
    }
  <\/script>
  ` : ''}
</body>
</html>`;
}
