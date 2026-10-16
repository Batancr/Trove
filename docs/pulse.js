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
const pPanel = (cls, title, body, sub = '') => `<section class="pz ${cls}"><h3><i></i><span>${tr(title)}</span></h3>${sub ? `<p class="psub">${sub}</p>` : ''}${body}</section>`;

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
      <text x="100" y="126" class="lab">${esc(tr('PULSE'))}</text>
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
  app.innerHTML = dashHead('pulse', seg) + `<div class="pulse">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="pglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></svg>
    <header class="ptop"><span class="plive"><i></i>${tr('LIVE')}</span><b>TROVE // ${esc((me.name || '').toUpperCase())}</b><span class="pclockt">${esc(clock)}</span>
      <a href="#/dashboard/insights">${tr('Exact numbers are in Insights')} →</a></header>
    ${tick ? `<div class="ptick" aria-label="${esc(tr('Recent activity'))}"><div class="ptrack">${tick}${tick}</div></div>` : ''}
    <div class="pheros">
      ${hero('Sales', money(sales.now), change(sales), 'What buyers paid for your items.', 'total')}
      ${hero('Orders', String(count.now), change(count), 'Finished sales, any size.', 'count')}
      ${hero('Views', String(views.now), change(views), 'People opening your listings.', 'views')}
      ${hero('Average order', money(aov.now), change(aov), 'Bundle items to raise this.')}
    </div>
    <div class="pgrid">
      ${pPanel('c4', 'Shop pulse', pGauge(score, deltaTxt(change(sales)), [[esc(shortMoney(released)), 'Released'], [esc(shortMoney(held)), 'Held'], [String(live.length), 'Live']]), tr('Sales this period against the one before. 50 means level.'))}
      ${pPanel('c8', 'Signal', `<div class="psighead"><div><b>${esc(m.big(mNow))}</b><span>${tr(m.label)} · ${tr(P_RANGES.find(r => r[0] === N)[1])}</span></div>
        <div class="seg pseg" role="group" aria-label="${esc(tr('Show'))}">${Object.entries(P_METRICS).map(([k, v]) => `<button type="button" data-act="pmetric" data-m="${k}" aria-pressed="${pulseMetric === k}">${tr(v.label)}</button>`).join('')}</div></div>
        ${pSignal(cur, pulseMetric)}`, tr('Spot busy and quiet days. Tap a number above or switch here to change what it shows.'))}
      ${pPanel('c4', 'Sales clock', pClock(hours), tr('Set meetups and post new listings when buyers are most active.'))}
      ${pPanel('c4', 'Category orbit', pOrbit(cats, (me.name || '?')[0]), tr('Which types earn the most, so you know what to buy more of.'))}
      ${pPanel('c4', 'Shop profile', pRadar(axes), tr('Your strongest and weakest habits as a seller, out of 100.'))}
      ${pPanel('c8', 'Buyer flow', pFlow(salesFunnel(events, orders, items, sid, now - N * DAY, now)), tr('Where buyers drop off between looking and buying.'))}
      ${pPanel('c4', 'Sales honeycomb', pHex(salesByDay(orders, sid, now, 84)), tr('Streaks and gaps over 12 weeks, one cell per day.'))}
      ${pPanel('c7', 'Weekly equalizer', pEq(weeklySales(orders, sid, now, 12)), tr('Is the shop growing week to week?'))}
      ${pPanel('c5', 'Shop health', pRings(rings), tr('Small habits that keep buyers coming back.'))}
    </div></div>`;
}
