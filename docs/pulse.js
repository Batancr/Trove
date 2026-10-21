// Trove: the Pulse tab in the seller dashboard. A dark, animated "mission control" view of the shop, built for looks.
// Exact figures stay on Money and Insights; every shape here still comes from the seller's real orders, views and listings,
// and has a hover or keyboard tooltip. Animations stop for people who ask their device for reduced motion.
// Loaded before app.js; it only uses app.js helpers inside functions, at render time.

const PULSE = ['#169dbd', '#e2549d', '#8270ff', '#bd8121'];   // checked with the dataviz palette validator on #0c1322
const P_OTHER = '#5b6780';
const P_RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days']];
const P_METRICS = {
  total: { label: 'Sales', axis: v => shortMoney(v), big: v => money(v) },
  count: { label: 'Orders', axis: v => String(Math.round(v)), big: v => String(v) },
  views: { label: 'Views', axis: v => String(Math.round(v)), big: v => String(v) },
};
let pulseDays = 30, pulseMetric = 'total';

const pPolar = (cx, cy, r, deg) => { const a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
const pArc = (cx, cy, r, a0, a1) => {
  const [sx, sy] = pPolar(cx, cy, r, a0), [ex, ey] = pPolar(cx, cy, r, a1);
  return `M${sx.toFixed(2)} ${sy.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
};
const pTip = t => tipAttrs(esc(t));
const pPanel = (cls, title, body, sub = '', id = '') => {
  const L = pulseLayout(), size = (id && L.size[id]) || cls, min = id && L.min[id];
  const ctl = id ? `<span class="pctl">
      <button type="button" class="pgrab" data-pa="grab" aria-label="${esc(tr('Move'))}: ${esc(tr(title))}" title="${esc(tr('Drag, or use the arrow keys'))}">⠿</button>
      <button type="button" data-pa="size" aria-label="${esc(tr('Resize'))}: ${esc(tr(title))}" title="${esc(tr('Resize'))}">⤢</button>
      <button type="button" data-pa="min" aria-expanded="${!min}" aria-label="${esc(tr(min ? 'Open' : 'Minimise'))}: ${esc(tr(title))}" title="${esc(tr(min ? 'Open' : 'Minimise'))}">${min ? '+' : '–'}</button></span>` : '';
  return `<section class="pz ${size}${min ? ' pmin' : ''}" ${id ? `data-pid="${id}"` : ''}><h3><i></i><span>${tr(title)}</span>${ctl}</h3><div class="pbody">${sub ? `<p class="psub">${sub}</p>` : ''}${body}</div></section>`;
};

// Speedometer-style ring: this week's sales against the week before, as a 0 to 100 score (50 means level).
function pGauge(score, delta, kpis) {
  const a0 = 135, a1 = 405, val = a0 + (a1 - a0) * score / 100;
  const ticks = Array.from({ length: 46 }, (_, i) => {
    const a = a0 + (a1 - a0) * i / 45, [x1, y1] = pPolar(100, 100, 90, a), [x2, y2] = pPolar(100, 100, i % 5 ? 94 : 97, a);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${a <= val ? 'on' : ''}"/>`;
  }).join('');
  const [nx, ny] = pPolar(100, 100, 78, val);
  return `<div class="pgauge"><svg viewBox="0 0 200 178" role="img" aria-label="${esc(tr('Shop pulse'))} ${score}">
      <defs><linearGradient id="pgG" x1="0" x2="1"><stop offset="0" stop-color="${PULSE[0]}"/><stop offset="1" stop-color="${PULSE[1]}"/></linearGradient></defs>
      <g class="ticks">${ticks}</g>
      <path d="${pArc(100, 100, 78, a0, a1)}" class="track"/>
      <path d="${pArc(100, 100, 78, a0, Math.max(a0 + .5, val))}" class="val" stroke="url(#pgG)" pathLength="100" filter="url(#pglow)"/>
      <circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="5" class="tip-dot"/><circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="5" class="ping"/>
      <text x="100" y="104" class="big">${score}</text>
      <text x="100" y="126" class="lab">${esc(tr('SALES'))}</text>
      <text x="100" y="150" class="lab2">${esc(delta)}</text>
    </svg>
    <div class="pkpis">${kpis.map(([v, l]) => `<div><b>${v}</b><span>${tr(l)}</span></div>`).join('')}</div></div>`;
}

// Thirty days of sales as a glowing line with a sweeping scan bar.
function pSignal(days, metric) {
  const W = 600, H = 210, L = 44, R = 12, T = 14, B = 26;
  const m = P_METRICS[metric], val = d => d[metric];
  const max = Math.max(1, ...days.map(val)), n = days.length;
  const x = i => L + i * (W - L - R) / Math.max(1, n - 1), y = v => T + (H - T - B) * (1 - v / max);
  const pts = days.map((d, i) => [x(i), y(val(d))]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  const grid = [0, .25, .5, .75, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${y(max * f).toFixed(1)}" y2="${y(max * f).toFixed(1)}" class="g"/>
    <text x="${L - 6}" y="${(y(max * f) + 4).toFixed(1)}" class="ax" text-anchor="end">${esc(m.axis(max * f))}</text>`).join('');
  const lab = i => `<text x="${x(i).toFixed(1)}" y="${H - 6}" class="ax" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(shortDate(days[i].start))}</text>`;
  const step = (W - L - R) / Math.max(1, n - 1);
  const hits = days.map((d, i) => `<rect x="${(x(i) - step / 2).toFixed(1)}" y="${T}" width="${step.toFixed(1)}" height="${H - T - B}" class="hit" ${pTip(`${shortDate(d.start)}\n${money(d.total)} · ${d.count} ${tr(d.count === 1 ? 'order' : 'orders')} · ${d.views} ${tr('views')}`)}/>`).join('');
  const last = pts[n - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="psig" role="img" aria-label="${esc(tr(m.label))}">
    <defs><linearGradient id="psA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PULSE[0]}" stop-opacity=".45"/><stop offset="1" stop-color="${PULSE[0]}" stop-opacity="0"/></linearGradient>
      <linearGradient id="psS" x1="0" x2="1"><stop offset="0" stop-color="#5fe3ff" stop-opacity="0"/><stop offset=".9" stop-color="#5fe3ff" stop-opacity=".22"/><stop offset="1" stop-color="#5fe3ff" stop-opacity=".7"/></linearGradient>
      <clipPath id="psC"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath></defs>
    ${grid}
    <path d="${line}L${x(n - 1)} ${H - B}L${L} ${H - B}Z" fill="url(#psA)"/>
    <path d="${line}" class="ln" pathLength="100" filter="url(#pglow)"/>
    <g clip-path="url(#psC)"><rect class="scan" x="${L - 80}" y="${T}" width="80" height="${H - T - B}" fill="url(#psS)"/></g>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4" class="tip-dot"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4" class="ping"/>
    ${lab(0)}${lab(Math.floor(n / 2))}${lab(n - 1)}${hits}</svg>`;
}

// A 24-hour clock: one spoke per hour, longer when more sales happened then.
function pClock(hours) {
  const max = Math.max(1, ...hours), peak = hours.indexOf(Math.max(...hours));
  const fmtH = h => timeOnly(new Date(2026, 0, 1, h).getTime());
  const spokes = hours.map((v, h) => {
    const a = -90 + h * 15, [x1, y1] = pPolar(100, 100, 44, a), [x2, y2] = pPolar(100, 100, 48 + 40 * v / max, a);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="animation-delay:${h * 40}ms;opacity:${(.35 + .65 * v / max).toFixed(2)}" ${pTip(`${fmtH(h)}\n${v} ${tr(v === 1 ? 'sale' : 'sales')}`)}/>`;
  }).join('');
  const marks = [0, 6, 12, 18].map(h => { const [x, y] = pPolar(100, 100, 96, -90 + h * 15); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="ax" text-anchor="middle">${h}</text>`; }).join('');
  return `<svg viewBox="0 0 200 200" class="pclock" role="img" aria-label="${esc(tr('Sales by hour'))}">
    <circle cx="100" cy="100" r="92" class="ring"/><circle cx="100" cy="100" r="40" class="ring"/>
    <g class="sp" filter="url(#pglow)">${spokes}</g>${marks}
    <text x="100" y="98" class="mid">${esc(max > 0 && hours[peak] ? fmtH(peak) : '–')}</text><text x="100" y="114" class="lab">${esc(tr('BUSIEST'))}</text></svg>`;
}

// Categories as planets: the further out and bigger, the more that type has earned.
function pOrbit(cats, initial) {
  const top = cats.slice(0, 4), rest = cats.slice(4).reduce((s, c) => s + c.total, 0);
  const list = rest ? top.concat({ category: 'Other', total: rest, other: true }) : top;
  const max = Math.max(1, ...list.map(c => c.total));
  const rings = list.map((c, i) => {
    const r = 34 + i * 14, size = 3.5 + 7 * Math.sqrt(c.total / max), col = c.other ? P_OTHER : PULSE[i];
    const [px, py] = pPolar(100, 100, r, -90 + i * 77);
    return `<circle cx="100" cy="100" r="${r}" class="orb"/>
      <g class="spin" style="animation-duration:${18 + i * 9}s"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${size.toFixed(1)}" fill="${col}" filter="url(#pglow)" ${pTip(`${tr(c.category)}\n${money(c.total)}`)}/></g>`;
  }).join('');
  return `<div class="porbit"><svg viewBox="0 0 200 200" role="img" aria-label="${esc(tr('Sales by type'))}">
      <circle cx="100" cy="100" r="16" class="sun"/><text x="100" y="105" class="sunt">${esc(initial)}</text>${rings}</svg>
    <ul class="plegend">${list.map((c, i) => `<li><i style="background:${c.other ? P_OTHER : PULSE[i]}"></i><span>${tr(c.category)}</span><b>${esc(shortMoney(c.total))}</b></li>`).join('')}</ul></div>`;
}

// Six traits of the shop on a radar, each scored 0 to 1.
function pRadar(axes) {
  const n = axes.length, pt = (i, f) => pPolar(100, 100, 74 * f, -90 + i * 360 / n);
  const poly = f => axes.map((_, i) => pt(i, f).map(v => v.toFixed(1)).join(',')).join(' ');
  const shape = axes.map((a, i) => pt(i, Math.max(.04, a.v)).map(v => v.toFixed(1)).join(',')).join(' ');
  return `<svg viewBox="-34 -6 268 212" class="pradar" role="img" aria-label="${esc(tr('Shop profile'))}">
    ${[.25, .5, .75, 1].map(f => `<polygon points="${poly(f)}" class="web"/>`).join('')}
    ${axes.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="100" y1="100" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="web"/>`; }).join('')}
    <polygon points="${shape}" class="shape" filter="url(#pglow)"/>
    ${axes.map((a, i) => { const [x, y] = pt(i, Math.max(.04, a.v)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" class="v" ${pTip(`${tr(a.label)}\n${Math.round(a.v * 100)} / 100`)}/>`; }).join('')}
    ${axes.map((a, i) => { const [x, y] = pt(i, 1.2); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="ax" text-anchor="${Math.abs(x - 100) < 8 ? 'middle' : x > 100 ? 'start' : 'end'}">${esc(tr(a.label))}</text>`; }).join('')}</svg>`;
}

// Views flowing into saves, carts and sales, as bands with moving particles.
function pFlow(steps) {
  const W = 600, H = 180, mid = 92, max = Math.max(1, ...steps.map(s => s.value));
  const h = v => 8 + 104 * Math.sqrt(v / max), xs = steps.map((_, i) => 30 + i * 175), bw = 14;
  const bands = steps.slice(0, -1).map((s, i) => {
    const h1 = h(s.value), h2 = h(steps[i + 1].value), x1 = xs[i] + bw, x2 = xs[i + 1], c = (x1 + x2) / 2;
    return `<path d="M${x1} ${mid - h1 / 2}C${c} ${mid - h1 / 2} ${c} ${mid - h2 / 2} ${x2} ${mid - h2 / 2}L${x2} ${mid + h2 / 2}C${c} ${mid + h2 / 2} ${c} ${mid + h1 / 2} ${x1} ${mid + h1 / 2}Z" fill="url(#pfG)" class="band"/>
      <path d="M${x1} ${mid}C${c} ${mid} ${c} ${mid} ${x2} ${mid}" class="dots"/>`;
  }).join('');
  const nodes = steps.map((s, i) => `<rect x="${xs[i]}" y="${(mid - h(s.value) / 2).toFixed(1)}" width="${bw}" height="${h(s.value).toFixed(1)}" rx="4" fill="${PULSE[i]}" filter="url(#pglow)" ${pTip(`${tr(s.step)}\n${s.value}`)}/>
    <text x="${xs[i] + bw / 2}" y="${H - 22}" class="fv" text-anchor="middle">${s.value}</text>
    <text x="${xs[i] + bw / 2}" y="${H - 6}" class="ax" text-anchor="middle">${esc(tr(s.step))}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="pflow" role="img" aria-label="${esc(tr('Buyer flow, last 30 days'))}">
    <defs><linearGradient id="pfG" x1="0" x2="1"><stop offset="0" stop-color="${PULSE[0]}" stop-opacity=".35"/><stop offset="1" stop-color="${PULSE[2]}" stop-opacity=".2"/></linearGradient></defs>
    ${bands}${nodes}</svg>`;
}

// Twelve weeks as a honeycomb: one cell per day, brighter on days with more sales.
function pHex(cells) {
  const r = 9, w = Math.sqrt(3) * r, max = Math.max(1, ...cells.map(c => c.count));
  const loc = lang() === 'zh' ? 'zh-CN' : 'en-CA';
  const hex = (cx, cy) => Array.from({ length: 6 }, (_, k) => pPolar(cx, cy, r - 1, -90 + k * 60).map(v => v.toFixed(1)).join(',')).join(' ');
  const out = cells.map((c, i) => {
    const col = Math.floor(i / 7), row = new Date(c.start).getDay();
    const cx = 34 + col * w + (row % 2 ? w / 2 : 0), cy = 14 + row * r * 1.5;
    const f = c.count / max;
    return `<polygon points="${hex(cx, cy)}" class="hx${c.count ? ' lit' : ''}" style="fill-opacity:${c.count ? (.25 + .75 * f).toFixed(2) : 0}" ${pTip(`${new Date(c.start).toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric' })}\n${c.count} ${tr(c.count === 1 ? 'sale' : 'sales')}`)}/>`;
  }).join('');
  const days = [1, 3, 5].map(d => `<text x="22" y="${(14 + d * r * 1.5 + 4).toFixed(1)}" class="ax" text-anchor="end">${esc(new Date(2026, 1, 1 + d).toLocaleDateString(loc, { weekday: 'narrow' }))}</text>`).join('');
  return `<svg viewBox="0 0 ${Math.ceil(34 + 12 * w + w)} ${Math.ceil(14 + 6 * r * 1.5 + r + 4)}" class="phex" role="img" aria-label="${esc(tr('Sales by day, last 12 weeks'))}">${days}${out}</svg>`;
}

// Twelve weeks of sales as an equalizer with a mirror under the floor.
function pEq(weeks) {
  const W = 600, H = 200, base = 140, max = Math.max(1, ...weeks.map(w => w.total)), bw = (W - 20) / weeks.length;
  const top = weeks.indexOf(weeks.reduce((a, b) => b.total > a.total ? b : a, weeks[0]));
  const bars = weeks.map((w, i) => {
    const hh = Math.max(3, 120 * w.total / max), x = 10 + i * bw + bw * .18, ww = bw * .64;
    return `<g class="bar" style="animation-delay:${i * 60}ms"><rect x="${x.toFixed(1)}" y="${(base - hh).toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}" rx="4" fill="url(#peG)" ${pTip(`${tr('Week of')} ${shortDate(w.start + DAY)}\n${money(w.total)}`)}/></g>
      <rect x="${x.toFixed(1)}" y="${base + 3}" width="${ww.toFixed(1)}" height="${(hh * .35).toFixed(1)}" rx="4" fill="url(#peR)"/>
      ${i === top || i === weeks.length - 1 ? `<text x="${(x + ww / 2).toFixed(1)}" y="${(base - hh - 7).toFixed(1)}" class="fv" text-anchor="middle">${esc(shortMoney(w.total))}</text>` : ''}`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="peq" role="img" aria-label="${esc(tr('Sales by week'))}">
    <defs><linearGradient id="peG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${PULSE[2]}"/><stop offset="1" stop-color="${PULSE[1]}"/></linearGradient>
      <linearGradient id="peR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PULSE[2]}" stop-opacity=".28"/><stop offset="1" stop-color="${PULSE[2]}" stop-opacity="0"/></linearGradient></defs>
    <line x1="6" x2="${W - 6}" y1="${base + 1}" y2="${base + 1}" class="floor"/>${bars}
    <text x="10" y="${H - 6}" class="ax">${esc(shortDate(weeks[0].start + DAY))}</text><text x="${W - 10}" y="${H - 6}" class="ax" text-anchor="end">${esc(tr('This week'))}</text></svg>`;
}

// Four progress rings, one inside the other, each with its own label.
function pRings(rings) {
  return `<div class="prings"><svg viewBox="0 0 200 200" role="img" aria-label="${esc(tr('Shop health'))}">
      ${rings.map((g, i) => { const r = 84 - i * 18; return `<circle cx="100" cy="100" r="${r}" class="trk"/>
        <circle cx="100" cy="100" r="${r}" class="arc" pathLength="100" stroke="${PULSE[i]}" stroke-dasharray="${Math.max(.5, g.v * 100).toFixed(1)} 100" style="animation-delay:${i * 120}ms" filter="url(#pglow)" transform="rotate(-90 100 100)" ${pTip(`${tr(g.label)}\n${g.text}`)}/>`; }).join('')}
    </svg>
    <ul class="plegend">${rings.map((g, i) => `<li><i style="background:${PULSE[i]}"></i><span>${tr(g.label)}</span><b>${esc(g.text)}</b></li>`).join('')}</ul></div>`;
}

// ---------- Heartbeat: "Track the pulse of your business" ----------
// The seller weights nine factors (logic.js HB_FACTORS); the weighted score becomes a heart rate.
// Sliders, presets and "what if" boosts update the heart in place, without redrawing the page.
let pulseSim = new Set(), pulseBooted = false, pulseNow = null, pulsePrev = null;
const P_SIZES = ['c4', 'c6', 'c8', 'c12'];
const P_ACTIONS = {
  sales: ['List more items', '#/sell/new'], orders: ['List more items', '#/sell/new'], attention: ['Share your listings', '#/dashboard/listings'],
  demand: ['Check your prices', '#/dashboard/listings'], conversion: ['Improve photos and titles', '#/dashboard/listings'], fresh: ['Add new stock', '#/sell/new'],
  replies: ['Answer questions', '#/dashboard/todo'], speed: ['Ship sooner', '#/dashboard/todo'], trust: ['Sort out open problems', '#/dashboard/todo'],
};
const P_ZONES = { resting: 'Resting', steady: 'Steady', rising: 'Rising', racing: 'Racing' };

function pulseWeights() {
  const st = S();
  if (!st.prefs.pulseWeights) st.prefs.pulseWeights = Object.fromEntries(HB_FACTORS.map(f => [f.key, f.w]));
  return st.prefs.pulseWeights;
}
function pulseLayout() {
  const st = S();
  if (!st.prefs.pulseLayout) st.prefs.pulseLayout = { order: [], size: {}, min: {} };
  return st.prefs.pulseLayout;
}

// Score every factor 0 to 1 for the days [from, to), with `before` the same-length window just before it.
function pulseScores({ orders, events, mineItems, sid, from, to, stats }) {
  const len = to - from, mineIds = new Set(mineItems.map(i => i.id));
  const sold = (a, b) => orders.filter(o => o.sellerId === sid && o.closedAt && o.closedAt >= a && o.closedAt < b);
  const ev = (a, b, kinds) => events.filter(e => mineIds.has(e.itemId) && kinds.includes(e.kind) && e.at >= a && e.at < b).length;
  const now = sold(from, to), was = sold(from - len, from);
  const total = list => list.reduce((t, o) => t + o.subtotal, 0);
  const views = ev(from, to, ['view']), viewsWas = ev(from - len, from, ['view']);
  const live = mineItems.filter(i => i.status === 'active' && (i.listedAt || 0) < to);
  const qs = mineItems.flatMap(i => i.questions || []);
  return {
    sales: momentum(total(now), total(was)),
    orders: momentum(now.length, was.length),
    attention: momentum(views, viewsWas),
    demand: Math.min(1, ev(from, to, ['save', 'cart']) / Math.max(1, live.length) / 2),
    conversion: views ? Math.min(1, now.length / views / 0.1) : 0,
    fresh: Math.min(1, mineItems.filter(i => i.listedAt >= from && i.listedAt < to).length / Math.max(1, live.length) / 0.3),
    replies: qs.length ? qs.filter(q => q.a).length / qs.length : 1,
    speed: stats.avgShipDays == null ? 0.7 : 1 - Math.min(stats.avgShipDays, 5) / 5,
    trust: stats.sales ? 1 - stats.problems / stats.sales : 0.8,
  };
}

// The ECG line: six beats drawn 100 units apart, slid left by one beat per heartbeat.
function pEcgPath() {
  let d = 'M-100 40';
  for (let i = -1; i < 7; i++) { const x = i * 100; d += ` L${x + 28} 40 Q${x + 33} 31 ${x + 38} 40 L${x + 44} 40 L${x + 47} 48 L${x + 51} 6 L${x + 55} 70 L${x + 59} 40 L${x + 68} 40 Q${x + 76} 26 ${x + 84} 40 L${x + 100} 40`; }
  return d;
}

function pHeart(hb, prevBpm) {
  const C = 2 * Math.PI * 96, arc = 0.75 * C;
  const diff = hb.bpm - prevBpm;
  const ticks = Array.from({ length: 60 }, (_, i) => { const [x1, y1] = pPolar(130, 130, 122, i * 6), [x2, y2] = pPolar(130, 130, i % 5 ? 117 : 112, i * 6); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; }).join('');
  return `<div class="phcore" style="--beat:${(60 / hb.bpm).toFixed(3)}s" data-zone="${hb.zone}">
    <svg viewBox="0 0 260 260" class="phring" role="img" aria-label="${esc(tr('Heart rate'))} ${hb.bpm} bpm, ${esc(tr(P_ZONES[hb.zone]))}">
      <g class="phticks">${ticks}</g>
      <circle cx="130" cy="130" r="96" class="phtrack" stroke-dasharray="${arc.toFixed(1)} ${C.toFixed(1)}" transform="rotate(135 130 130)"/>
      <circle cx="130" cy="130" r="96" class="phval" id="phArc" stroke-dasharray="${(arc * hb.composite).toFixed(1)} ${C.toFixed(1)}" transform="rotate(135 130 130)" filter="url(#pglow)"/>
      <circle cx="130" cy="130" r="74" class="phglow"/>
      <circle cx="130" cy="130" r="58" class="phinner"/>
      <g transform="translate(130 88) scale(.5) translate(-130 -133)"><path class="phheart" d="M130 116c-6-12-26-11-26 4 0 12 15 22 26 31 11-9 26-19 26-31 0-15-20-16-26-4z"/></g>
      <text x="130" y="146" text-anchor="middle" class="phbpm" id="phBpm">${hb.bpm}</text>
      <text x="130" y="166" text-anchor="middle" class="phunit">BPM</text>
      <text x="130" y="200" text-anchor="middle" class="phzone" id="phZone">${esc(tr(P_ZONES[hb.zone]).toUpperCase())}</text>
    </svg>
    <p class="phdelta ${diff >= 0 ? 'up' : 'down'}" id="phDelta">${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff)} bpm <em>${tr('vs the period before')}</em></p>
    <p class="phsim" id="phSim" hidden></p>
    <svg viewBox="0 0 600 80" preserveAspectRatio="none" class="pecg" aria-hidden="true"><path class="pecgbase" d="M0 40H600"/><g class="pecgmove"><path d="${pEcgPath()}" filter="url(#pglow)"/></g></svg>
  </div>`;
}

function pConsole(hb) {
  const W = pulseWeights();
  const rows = HB_FACTORS.map(f => {
    const p = hb.parts.find(x => x.key === f.key);
    return `<div class="pfac${pulseSim.has(f.key) ? ' sim' : ''}" data-k="${f.key}">
      <div class="pfname"><b>${tr(f.label)}</b><span class="pfscore" ${tipAttrs(esc(tr(f.why)))}>${Math.round(p.score * 100)}</span></div>
      <div class="pfbar"><i style="width:${(p.score * 100).toFixed(0)}%"></i></div>
      <label class="pfw"><span class="sr">${tr('Weight')}: ${tr(f.label)}</span><input type="range" min="0" max="5" step="1" value="${W[f.key]}" data-pw="${f.key}"><output>${W[f.key]}</output></label>
      <span class="pfadd" data-add="${f.key}">+${p.bpm.toFixed(0)}</span>
      <button type="button" class="pfboost" data-pa="sim" data-k="${f.key}" aria-pressed="${pulseSim.has(f.key)}" title="${esc(tr('What if this were perfect?'))}">${tr('Boost')}</button>
    </div>`;
  }).join('');
  const preset = Object.keys(HB_PRESETS).find(k => HB_FACTORS.every(f => HB_PRESETS[k][f.key] === +W[f.key])) || '';
  return `<div class="pcon">
    <div class="pconhead"><b>${tr('Power routing')}</b><span>${tr('Drag a slider to decide how much each factor counts.')}</span></div>
    <div class="seg pseg ppre" role="group" aria-label="${esc(tr('Presets'))}">${['balanced', 'growth', 'reputation', 'hustle'].map(k => `<button type="button" data-pa="preset" data-k="${k}" aria-pressed="${preset === k}">${tr({ balanced: 'Balanced', growth: 'Growth', reputation: 'Reputation', hustle: 'Hustle' }[k])}</button>`).join('')}</div>
    <div class="pfhead"><span>${tr('Factor')}</span><span>${tr('Score')}</span><span>${tr('Weight')}</span><span>bpm</span><span></span></div>
    ${rows}
    <p class="pnext" id="pNext"></p>
  </div>`;
}

// Recompute the heart from the saved scores and update the page in place.
function pulseRefresh() {
  if (!pulseNow || !document.getElementById('phBpm')) return;
  const W = pulseWeights(), hb = heartbeat(pulseNow, W), prev = heartbeat(pulsePrev, W).bpm;
  const core = document.querySelector('.phcore'), C = 2 * Math.PI * 96;
  core.style.setProperty('--beat', (60 / hb.bpm).toFixed(3) + 's'); core.dataset.zone = hb.zone;
  document.getElementById('phBpm').textContent = hb.bpm;
  document.getElementById('phZone').textContent = tr(P_ZONES[hb.zone]).toUpperCase();
  document.getElementById('phArc').setAttribute('stroke-dasharray', `${(0.75 * C * hb.composite).toFixed(1)} ${C.toFixed(1)}`);
  document.querySelector('.phring').setAttribute('aria-label', `${tr('Heart rate')} ${hb.bpm} bpm, ${tr(P_ZONES[hb.zone])}`);
  const d = hb.bpm - prev, del = document.getElementById('phDelta');
  del.className = 'phdelta ' + (d >= 0 ? 'up' : 'down');
  del.firstChild.textContent = `${d >= 0 ? '▲' : '▼'} ${Math.abs(d)} bpm `;
  hb.parts.forEach(p => { const el = document.querySelector(`[data-add="${p.key}"]`); if (el) el.textContent = '+' + p.bpm.toFixed(0); });
  const sim = document.getElementById('phSim');
  if (pulseSim.size) {
    const boosted = { ...pulseNow }; pulseSim.forEach(k => { boosted[k] = 1; });
    const to = heartbeat(boosted, W).bpm;
    sim.hidden = false; sim.innerHTML = `${tr('With your boosts')}: <b>${to} bpm</b> (+${to - hb.bpm})`;
  } else sim.hidden = true;
  const g = heartGains(pulseNow, W)[0], next = document.getElementById('pNext');
  if (g) { const [label, href] = P_ACTIONS[g.key]; next.innerHTML = `<span>${tr('Fastest way up')}:</span> <b>${tr(HB_FACTORS.find(f => f.key === g.key).label)}</b> +${g.gain} bpm · <a href="${href}">${tr(label)} →</a>`; }
  else next.innerHTML = `<span>${tr('Every factor is maxed out. Nice.')}</span>`;
  const preset = Object.keys(HB_PRESETS).find(k => HB_FACTORS.every(f => HB_PRESETS[k][f.key] === +W[f.key])) || '';
  document.querySelectorAll('[data-pa="preset"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === preset));
}

function pulseSaveOrder() {
  const L = pulseLayout();
  L.order = [...document.querySelectorAll('.pgrid > .pz[data-pid]')].map(el => el.dataset.pid);
  save();
}

// Sliders: live while dragging, saved when let go.
document.addEventListener('input', e => {
  const r = e.target.closest && e.target.closest('[data-pw]');
  if (!r) return;
  pulseWeights()[r.dataset.pw] = +r.value;
  r.nextElementSibling.textContent = r.value;
  pulseRefresh();
});
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('[data-pw]')) save(); });

document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-pa]');
  if (!b || !b.closest('.pulse')) return;
  const L = pulseLayout(), panel = b.closest('.pz'), id = panel && panel.dataset.pid;
  switch (b.dataset.pa) {
    case 'preset': Object.assign(pulseWeights(), HB_PRESETS[b.dataset.k]); save();
      document.querySelectorAll('[data-pw]').forEach(r => { r.value = pulseWeights()[r.dataset.pw]; r.nextElementSibling.textContent = r.value; });
      pulseRefresh(); break;
    case 'sim': { const k = b.dataset.k; pulseSim.has(k) ? pulseSim.delete(k) : pulseSim.add(k);
      b.setAttribute('aria-pressed', pulseSim.has(k)); b.closest('.pfac').classList.toggle('sim', pulseSim.has(k)); pulseRefresh(); break; }
    case 'size': { const cur = P_SIZES.find(c => panel.classList.contains(c)) || 'c4', nxt = P_SIZES[(P_SIZES.indexOf(cur) + 1) % P_SIZES.length];
      panel.classList.remove(...P_SIZES, 'c5', 'c7'); panel.classList.add(nxt); L.size[id] = nxt; save(); break; }
    case 'min': { const m = !panel.classList.contains('pmin'); panel.classList.toggle('pmin', m); L.min[id] = m;
      b.textContent = m ? '+' : '–'; b.setAttribute('aria-expanded', !m); save(); break; }
    case 'reset': S().prefs.pulseLayout = null; S().prefs.pulseWeights = null; pulseSim.clear(); save(); route(); break;
    case 'mode': S().prefs.pulseMode = S().prefs.pulseMode === 'mark' ? 'arc' : 'mark'; save();
      document.querySelector('.pulse').dataset.mode = S().prefs.pulseMode; b.setAttribute('aria-pressed', S().prefs.pulseMode === 'mark'); break;
  }
});

// Moving panels: drag the grip with a mouse or finger, or focus it and use the arrow keys.
let pDrag = null;
document.addEventListener('pointerdown', e => {
  const g = e.target.closest && e.target.closest('.pgrab');
  if (!g) return;
  e.preventDefault();
  pDrag = g.closest('.pz'); pDrag.classList.add('pdrag'); g.setPointerCapture(e.pointerId);
});
document.addEventListener('pointermove', e => {
  if (!pDrag) return;
  if (e.clientY < 70) scrollBy(0, -18); else if (e.clientY > innerHeight - 70) scrollBy(0, 18);   // scroll the page while dragging near an edge
  const over = document.elementsFromPoint(e.clientX, e.clientY).map(el => el.closest('.pz')).find(el => el && el !== pDrag && el.parentNode === pDrag.parentNode);
  if (!over) return;
  const r = over.getBoundingClientRect();
  const after = e.clientY > r.bottom - r.height / 3 || (e.clientY > r.top + r.height / 3 && e.clientX > r.left + r.width / 2);
  const ref = after ? over.nextSibling : over;
  if (ref !== pDrag && ref !== pDrag.nextSibling) pDrag.parentNode.insertBefore(pDrag, ref);
});
const pDrop = () => { if (!pDrag) return; pDrag.classList.remove('pdrag'); pDrag = null; pulseSaveOrder(); };
document.addEventListener('pointerup', pDrop);
document.addEventListener('pointercancel', pDrop);
document.addEventListener('keydown', e => {
  const g = e.target.closest && e.target.closest('.pgrab');
  if (!g || !['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault();
  const p = g.closest('.pz'), back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
  const sib = back ? p.previousElementSibling : p.nextElementSibling;
  if (!sib) return;
  p.parentNode.insertBefore(p, back ? sib : sib.nextSibling);
  g.focus(); pulseSaveOrder();
});

function renderDashPulse() {
  const st = S(), sid = st.actingSeller, now = Store.now(), me = sellerById(sid) || {}, N = pulseDays;
  const orders = mainOrders(), items = mainItems(), events = st.events || [];
  const mineItems = items.filter(i => i.sellerId === sid), mineIds = new Set(mineItems.map(i => i.id));
  const done = orders.filter(o => o.sellerId === sid && o.closedAt);
  const sum = a => a.reduce((x, y) => x + y, 0);
  const both = salesByDay(orders, sid, now, N * 2).map(d => ({ ...d, views: events.filter(e => e.kind === 'view' && mineIds.has(e.itemId) && e.at >= d.start && e.at < d.end).length }));
  const cur = both.slice(N), prev = both.slice(0, N);
  const tot = (list, k) => sum(list.map(d => d[k]));
  const kpi = k => ({ now: tot(cur, k), before: tot(prev, k) });
  const sales = kpi('total'), count = kpi('count'), views = kpi('views');
  const aov = { now: count.now ? Math.round(sales.now / count.now) : 0, before: count.before ? Math.round(sales.before / count.before) : 0 };
  const ratio = sales.before ? sales.now / sales.before : sales.now ? 2 : 1;
  const score = Math.max(3, Math.min(99, Math.round(100 * ratio / (1 + ratio))));
  const change = ({ now: a, before: b }) => b ? Math.round((a - b) / b * 100) : null;
  const deltaTxt = c => c == null ? tr('New this period') : `${c >= 0 ? '▲' : '▼'} ${Math.abs(c)}%`;
  const inRange = done.filter(o => o.closedAt > now - N * DAY);

  const hours = Array(24).fill(0);
  inRange.forEach(o => { hours[new Date((o.meetup && o.meetup.at) || o.createdAt).getHours()]++; });
  const byCat = {};
  inRange.forEach(o => o.items.forEach(line => { const it = itemById(line.id); const c = (it && it.category) || 'Other'; byCat[c] = (byCat[c] || 0) + line.price * line.qty; }));
  const cats = Object.entries(byCat).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);

  const stats = sellerStats(orders, sid);
  const live = mineItems.filter(i => i.status === 'active');
  const end = Store.now();
  pulseNow = pulseScores({ orders, events, mineItems, sid, from: end - N * DAY, to: end, stats });
  pulsePrev = pulseScores({ orders, events, mineItems, sid, from: end - 2 * N * DAY, to: end - N * DAY, stats });
  const hb = heartbeat(pulseNow, pulseWeights()), prevBpm = heartbeat(pulsePrev, pulseWeights()).bpm;
  const qs = mineItems.flatMap(i => i.questions || []);
  const interest = interestByItem(events, live).reduce((s, r) => s + r.save + r.cart, 0);
  const axes = [
    { label: 'Speed', v: stats.avgShipDays == null ? .7 : 1 - Math.min(stats.avgShipDays, 5) / 5 },
    { label: 'Trust', v: stats.sales ? 1 - stats.problems / stats.sales : .8 },
    { label: 'Variety', v: new Set(live.map(i => i.category)).size / CATEGORIES.length },
    { label: 'Replies', v: qs.length ? qs.filter(q => q.a).length / qs.length : 1 },
    { label: 'Demand', v: Math.min(1, interest / Math.max(1, live.length) / 3) },
    { label: 'Momentum', v: score / 100 },
  ];
  const held = orders.filter(o => o.sellerId === sid && ['paid_held', 'shipped', 'delivered'].includes(o.state)).reduce((s, o) => s + o.subtotal, 0);
  const released = sum(inRange.map(o => o.subtotal));
  const goal = Math.max(1, Math.round(20 * N / 30));
  const rings = [
    { label: 'Listings live', v: mineItems.length ? live.length / mineItems.length : 0, text: `${live.length} / ${mineItems.length}` },
    { label: 'Questions answered', v: qs.length ? qs.filter(q => q.a).length / qs.length : 1, text: `${qs.filter(q => q.a).length} / ${qs.length}` },
    { label: 'Money released', v: released + held ? released / (released + held) : 0, text: `${shortMoney(released)} / ${shortMoney(released + held)}` },
    { label: 'Sales goal', v: Math.min(1, inRange.length / goal), text: `${inRange.length} / ${goal}` },
  ];

  const feed = [];
  done.slice().sort((a, b) => b.closedAt - a.closedAt).slice(0, 8).forEach(o => feed.push({ at: o.closedAt, t: `+${shortMoney(o.subtotal)} · ${o.items[0].title}`, k: 'sale' }));
  events.filter(e => mineIds.has(e.itemId) && e.kind !== 'view').slice(-10).forEach(e => { const it = itemById(e.itemId); if (it) feed.push({ at: e.at, t: `${tr({ save: 'Saved', cart: 'Added to cart', question: 'Question' }[e.kind] || e.kind)} · ${it.title}`, k: e.kind }); });
  feed.sort((a, b) => b.at - a.at);
  const tick = feed.map(f => `<span class="k-${f.k}"><i></i>${esc(f.t)}</span>`).join('');

  const hero = (label, big, c, why, metric) => `<button type="button" class="phero${pulseMetric === metric ? ' on' : ''}" data-act="pmetric" data-m="${metric || pulseMetric}" ${metric ? '' : 'disabled'} aria-pressed="${pulseMetric === metric}">
    <span>${tr(label)}</span><b>${big}</b><small class="${c == null ? '' : c >= 0 ? 'up' : 'down'}">${deltaTxt(c)} <em>${tr('vs the period before')}</em></small><i>${tr(why)}</i></button>`;
  const m = P_METRICS[pulseMetric], mNow = tot(cur, pulseMetric);
  const seg = `<div class="seg" role="group" aria-label="${esc(tr('Date range'))}">${P_RANGES.map(([d, l]) => `<button type="button" data-act="prange" data-days="${d}" aria-pressed="${N === d}">${tr(l)}</button>`).join('')}</div>`;
  const clock = new Date(now).toLocaleTimeString(lang() === 'zh' ? 'zh-CN' : 'en-CA', { hour: '2-digit', minute: '2-digit' });
  const panels = {
    gauge: pPanel('c4', 'Sales gauge', pGauge(score, deltaTxt(change(sales)), [[esc(shortMoney(released)), 'Released'], [esc(shortMoney(held)), 'Held'], [String(live.length), 'Live']]), tr('Sales this period against the one before. 50 means level.'), 'gauge'),
    signal: pPanel('c8', 'Signal', `<div class="psighead"><div><b>${esc(m.big(mNow))}</b><span>${tr(m.label)} · ${tr(P_RANGES.find(r => r[0] === N)[1])}</span></div>
        <div class="seg pseg" role="group" aria-label="${esc(tr('Show'))}">${Object.entries(P_METRICS).map(([k, v]) => `<button type="button" data-act="pmetric" data-m="${k}" aria-pressed="${pulseMetric === k}">${tr(v.label)}</button>`).join('')}</div></div>
        ${pSignal(cur, pulseMetric)}`, tr('Spot busy and quiet days. Tap a number above or switch here to change what it shows.'), 'signal'),
    clock: pPanel('c4', 'Sales clock', pClock(hours), tr('Set meetups and post new listings when buyers are most active.'), 'clock'),
    orbit: pPanel('c4', 'Category orbit', pOrbit(cats, (me.name || '?')[0]), tr('Which types earn the most, so you know what to buy more of.'), 'orbit'),
    radar: pPanel('c4', 'Shop profile', pRadar(axes), tr('Your strongest and weakest habits as a seller, out of 100.'), 'radar'),
    flow: pPanel('c8', 'Buyer flow', pFlow(salesFunnel(events, orders, items, sid, now - N * DAY, now)), tr('Where buyers drop off between looking and buying.'), 'flow'),
    hex: pPanel('c4', 'Sales honeycomb', pHex(salesByDay(orders, sid, now, 84)), tr('Streaks and gaps over 12 weeks, one cell per day.'), 'hex'),
    eq: pPanel('c8', 'Weekly equalizer', pEq(weeklySales(orders, sid, now, 12)), tr('Is the shop growing week to week?'), 'eq'),
    rings: pPanel('c4', 'Shop health', pRings(rings), tr('Small habits that keep buyers coming back.'), 'rings'),
  };
  const L = pulseLayout(), order = L.order.filter(k => panels[k]).concat(Object.keys(panels).filter(k => !L.order.includes(k)));
  const mode = st.prefs.pulseMode || 'arc', boot = !pulseBooted; pulseBooted = true;
  app.innerHTML = dashHead('pulse', seg) + `<div class="pulse${boot ? ' pboot' : ''}" data-mode="${mode}">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="pglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></svg>
    <header class="ptop"><span class="plive"><i></i>${tr('LIVE')}</span><b>TROVE // ${esc((me.name || '').toUpperCase())}</b><span class="pclockt">${esc(clock)}</span>
      <span class="ptools"><button type="button" class="ptool" data-pa="mode" aria-pressed="${mode === 'mark'}">${tr('Red and gold')}</button><button type="button" class="ptool" data-pa="reset">${tr('Reset layout')}</button></span>
      <a href="#/dashboard/insights">${tr('Exact numbers are in Insights')} →</a></header>
    ${tick ? `<div class="ptick" aria-label="${esc(tr('Recent activity'))}"><div class="ptrack">${tick}${tick}</div></div>` : ''}
    <section class="phb" aria-labelledby="phTitle">
      <div class="phleft"><h2 id="phTitle">${tr('Track the pulse of your business.')}</h2>
        <p class="phlede">${tr('Your heart rate climbs as sales, buyers and good habits pick up. You decide what counts.')}</p>
        ${pHeart(hb, prevBpm)}</div>
      ${pConsole(hb)}
    </section>
    <div class="pheros">
      ${hero('Sales', money(sales.now), change(sales), 'What buyers paid for your items.', 'total')}
      ${hero('Orders', String(count.now), change(count), 'Finished sales, any size.', 'count')}
      ${hero('Views', String(views.now), change(views), 'People opening your listings.', 'views')}
      ${hero('Average order', money(aov.now), change(aov), 'Bundle items to raise this.')}
    </div>
    <p class="phint">${tr('Drag ⠿ to rearrange panels, ⤢ to resize, – to tuck one away.')}</p>
    <div class="pgrid">${order.map(k => panels[k]).join('')}</div></div>`;
  pulseRefresh();
}
