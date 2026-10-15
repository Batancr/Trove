// Trove: the page. Hash routes, rendering and event handling. Rules live in logic.js, data in store.js,
// Chinese wording in i18n.js.

const app = document.getElementById('app');
const S = () => Store.get();

const CATEGORIES = ['Antiques', 'Collectibles', 'Home', 'Kitchen', 'Clothing', 'Electronics', 'Books', 'Toys and games', 'Sports', 'Other'];
const MEET_SPOTS = [
  'Public library entrance',
  'Police station safe exchange spot, where offered',
  'A busy coffee shop',
  "Seller's door (address shared after you reserve)",
];
const SIZES = [['small', 'Small', 'Shoebox size. Up to 4 share a box'], ['medium', 'Medium', 'Up to 3 share a box'], ['large', 'Large', 'Ships on its own']];
const MAX_PHOTOS = 8;

// ---------- helpers ----------

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const money = c => fmtMoney(c);
const dot = s => /\.\s*$/.test(s) ? s : s + '.';
const fmtDate = (ms, withTime = true) => new Date(ms).toLocaleString(lang() === 'zh' ? 'zh-CN' : 'en-CA', withTime
  ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' });

// The artifact preview blocks confirm() dialogs, so risky buttons ask for a second tap instead.
function confirmTap(btn) {
  if (btn.dataset.armed) return true;
  const label = btn.textContent;
  btn.dataset.armed = '1'; btn.textContent = tr('Tap again to confirm');
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = label; }, 4000);
  return false;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = tr(msg); t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 3200);
}

const itemById = id => S().items.find(i => i.id === id);
const orderById = id => S().orders.find(o => o.id === id);
const sellerById = id => S().sellers.find(s => s.id === id) || { id, name: 'Seller', city: '', about: '' };
const me = () => sellerById(S().actingSeller);

function photo(item, idx = 0) {
  if (item.photos && item.photos[idx]) return `<img src="${item.photos[idx]}" alt="${esc(item.alt || item.title)}">`;
  return artSvg(item.art, item.tone || '#e8dcc4').replace('aria-hidden="true"', `role="img" aria-label="${esc(item.alt || item.title)}"`);
}

const conditionLabel = id => (CONDITIONS.find(c => c[0] === id) || [id, id])[1];
function avatar(seller) { return `<span class="avatar" aria-hidden="true">${esc((seller.name || '?').trim()[0].toUpperCase())}</span>`; }

function readImage(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function save() {
  if (!Store.save()) toast("This browser's storage is full, so the last change may not be kept. Try fewer photos.");
}

// What buyers do on a listing (view, save, question, cart), so a seller can see who is interested in what.
function track(itemId, kind) {
  const st = S();
  st.events = (st.events || []).concat({ itemId, kind, who: st.me.name || 'guest', at: Store.now() }).slice(-2000);
}

function remember(itemId) {
  const st = S();
  st.recent = [itemId].concat((st.recent || []).filter(x => x !== itemId)).slice(0, 12);
}

// Share sheet on phones; elsewhere copy the link so it can be pasted into WeChat, RedNote or Facebook.
async function shareLink(path, title) {
  const url = location.href.split('#')[0] + '#' + path;
  const copied = 'Link copied. Paste it into WeChat, RedNote or Facebook.';
  if (navigator.share && matchMedia('(pointer:coarse)').matches) {
    try { await navigator.share({ title, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); toast(copied); return; } catch (e) { /* fall through */ }
  const ta = document.createElement('textarea');
  ta.value = url; document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  toast(ok ? copied : url);
}

// ---------- charts ----------

const shortMoney = c => c >= 100000 ? '$' + (c / 100000).toFixed(1) + 'k' : '$' + Math.round(c / 100);
const shortDate = ms => new Date(ms).toLocaleDateString(lang() === 'zh' ? 'zh-CN' : 'en-CA', { month: 'short', day: 'numeric' });

// Vertical bars drawn to scale from zero. rows: [{ label, value }]
function barChart(rows, fmt, title) {
  const max = Math.max(1, ...rows.map(r => r.value));
  const W = 50, H = 120, top = 18, bw = W - 14;
  const bars = rows.map((r, i) => {
    const h = Math.round(r.value / max * H), x = i * W + 7, y = top + H - h;
    return `<rect class="bar${r.value ? '' : ' zero'}" x="${x}" y="${r.value ? y : top + H - 2}" width="${bw}" height="${r.value ? h : 2}" rx="4"><title>${esc(r.label)}: ${esc(fmt(r.value))}</title></rect>
      ${r.value ? `<text class="val" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${esc(fmt(r.value))}</text>` : ''}
      <text x="${x + bw / 2}" y="${top + H + 16}" text-anchor="middle">${esc(r.label)}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${rows.length * W} ${top + H + 22}" role="img" aria-label="${esc(title)}">${bars}
    <line x1="0" x2="${rows.length * W}" y1="${top + H}" y2="${top + H}"></line></svg>`;
}

// Horizontal bars for named groups like categories
function hbars(rows, fmt) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return `<div class="hbars">${rows.map(r => `<div class="hbar"><span>${esc(r.label)}</span>
    <div class="track"><i style="width:${Math.max(2, r.value / max * 100).toFixed(1)}%"></i></div><b>${esc(r.text || fmt(r.value))}</b></div>`).join('')}</div>`;
}

// Duotone line icons: a soft filled shape (class "d") under a crisp outline.
const ICONS = {
  fee: '<circle class="d" cx="16" cy="16" r="12.5"/><text x="16" y="20.2" text-anchor="middle" font-size="11.5" font-weight="800" fill="currentColor" stroke="none">0%</text>',
  shield: '<path class="d" d="M16 3.5l10 3.8v7.4c0 6.6-4.3 11.4-10 13.8C10.3 26.1 6 21.3 6 14.7V7.3z"/><path d="M11.6 15.6l3.1 3.1 5.8-6"/>',
  code: '<rect class="d" x="8.5" y="3.5" width="15" height="25" rx="3.5"/><circle cx="12.6" cy="14.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="14.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="19.4" cy="14.5" r="1.3" fill="currentColor" stroke="none"/><path d="M13.5 23.5h5"/>',
  camera: '<rect class="d" x="3.5" y="9" width="25" height="17" rx="4"/><circle cx="16" cy="17.5" r="4.6"/><path d="M11 9l1.8-3h6.4L21 9"/><circle cx="23.6" cy="13.2" r="1" fill="currentColor" stroke="none"/>',
  chart: '<rect class="d" x="3.5" y="5" width="25" height="22" rx="4"/><path d="M8 21l5-5 4 3 7-8"/><circle cx="24" cy="11" r="1.6" fill="currentColor" stroke="none"/>',
};
const icon = (k, size = 30) => `<svg viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;

// ---------- colour drafts ----------

const LOOKS = {
  bg: [['auto', 'Match device', 'linear-gradient(135deg,#ffffff 50%,#15171a 50%)'], ['white', 'White', '#ffffff'], ['cream', 'Cream', '#fffbf5'], ['blue', 'Light blue', '#f6fafe'], ['peach', 'Light peach', '#fff8f1'], ['dark', 'Dark', '#15171a']],
  btn: [['orange', 'Creamy orange', '#ffcb98'], ['cream', 'Light cream', '#ffe6cc'], ['navy', 'Navy', '#2f5f8a'], ['ink', 'Charcoal', '#1f2328'], ['sage', 'Sage', '#cfe3d4']],
};
function applyLook() {
  const pr = S().prefs, el = document.documentElement;
  // A light colour choice forces the light theme so it shows even when the device is in dark mode
  const bg = pr.bg || 'auto';
  el.dataset.bg = bg; el.dataset.btn = pr.btn || 'orange';
  if (bg === 'auto') delete el.dataset.theme; else el.dataset.theme = bg === 'dark' ? 'dark' : 'light';
  const pop = document.getElementById('lookPop');
  if (!pop) return;
  const row = (k, title) => `<b>${title}</b><div class="sw">${LOOKS[k].map(([v, label, hex]) =>
    `<button type="button" data-look="${k}" data-v="${v}" aria-pressed="${(pr[k] || LOOKS[k][0][0]) === v}"><i style="background:${hex}"></i><span>${label}</span></button>`).join('')}</div>`;
  pop.innerHTML = row('bg', 'Background') + row('btn', 'Buttons') + `<span class="hint">${tr('Saved in this browser. Switch any time.')}</span>`;
}

// ---------- order side effects ----------

const LOG_TEXT = {
  paid: () => 'Paid. The money is held until the item reaches you.',
  reserved: () => 'Reserved. Payment happens in person.',
  ship: (o) => `${tr('Shipped. Tracking')} ${esc(o.tracking)}`,
  delivered_scan: () => 'Delivered.',
  confirm: () => 'Buyer confirmed it arrived as described.',
  report: (o, e) => `${tr('Problem reported:')} “${esc(e.note)}”`,
  handoff: (o) => o.payment === 'online' ? 'Handoff confirmed. Money released.' : 'Handoff confirmed. Paid in person.',
  cancel: (o, e) => e.state === 'refunded' ? 'Cancelled. Refunded in full.' : 'Cancelled.',
  resolve_release: () => 'Problem closed. Money released.',
  resolve_refund: () => 'Problem closed. Refunded.',
  auto_refund: () => 'Not shipped in time. Refunded automatically.',
  auto_release: () => 'Check window passed. Money released.',
  no_scan: () => 'No delivery scan after two weeks. Money stays held while it is checked.',
  no_show: () => 'Meetup passed without a handoff. Reservation cancelled.',
};

function notify(action, order) {
  notificationsFor(action, S().prefs).forEach(n => {
    S().inbox.unshift({ at: Store.now(), to: n.to, text: n.text, orderId: order.id, sellerId: order.sellerId, read: false });
  });
  S().inbox = S().inbox.slice(0, 200);
}

function restock(order) {
  order.items.forEach(line => {
    const it = itemById(line.id);
    if (!it) return;
    it.qty = (it.qty || 0) + line.qty;
    if (it.status === 'sold' || it.status === 'reserved') { it.status = 'active'; delete it.soldAt; delete it.soldPrice; }
  });
}

function afterChange(before, after) {
  if (['paid_held', 'reserved'].includes(before.state) && ['refunded', 'cancelled'].includes(after.state)) restock(after);
  if (before.state === 'reserved' && after.state === 'completed') {
    after.items.forEach(line => { const it = itemById(line.id); if (it && it.status === 'reserved') { it.status = 'sold'; it.soldAt = Store.now(); } });
  }
}

function act(orderId, action, who, data) {
  const st = S();
  const i = st.orders.findIndex(o => o.id === orderId);
  try {
    const next = transition(st.orders[i], action, who, Store.now(), data);
    afterChange(st.orders[i], next);
    st.orders[i] = next;
    notify(action, next);
    save();
    return true;
  } catch (e) { toast(e.message); return false; }
}

function sweepAll() {
  const st = S();
  let changed = false;
  st.orders = st.orders.map(o => {
    let cur = o;
    for (let n = 0; n < 4; n++) {
      const next = sweep(cur, Store.now());
      if (next === cur) break;
      afterChange(cur, next);
      notify(next.log[next.log.length - 1].action, next);
      cur = next; changed = true;
    }
    return cur;
  });
  if (changed) save();
}

// ---------- shared bits ----------

function moneyBar(o) {
  return `<ol class="money" aria-label="Where the money is">${moneySteps(o).map(s =>
    `<li class="st ${s.done ? 'done' : ''} ${s.current ? 'cur' : ''}" ${s.current ? 'aria-current="step"' : ''}>${esc(s.label)}</li>`).join('')}</ol>`;
}

function itemCard(it) {
  return `<a class="card" href="#/item/${it.id}">
    <div class="ph">${photo(it)}</div>
    <h3>${esc(it.title)}</h3>
    <div class="price">${money(it.price)}</div>
    <div class="meta"><span>${esc(conditionLabel(it.condition))}</span>${it.ships ? '' : ` · <span>${tr('Pickup only')}</span>`}</div>
  </a>`;
}

// ---------- buyer pages ----------

const PRICES = [['u10', 'Under $10', null, 999], ['10-50', '$10 to $50', 1000, 4999], ['50-100', '$50 to $100', 5000, 9999], ['100+', '$100 and up', 10000, null]];

function hero() {
  const f = (href, ic, title, sub) => `<a class="feat" href="${href}"><span class="ic">${icon(ic)}</span><b>${title}</b><span>${sub}</span></a>`;
  return `<section class="hero" id="hero" aria-label="What Trove does">
    <div class="hero-head">
      <div class="hero-title"><span class="fee-badge">${icon('fee', 44)}</span>
        <div><h1>No fees to buy or sell.</h1><p class="lede">Sellers keep the full price. Buyers pay only the price and any delivery.</p></div></div>
      <div class="row"><button type="button" data-act="tour">Take the tour</button>
        <button type="button" class="ghost small" data-act="hideHero">Hide</button></div>
    </div>
    <div class="features">
      ${f('#/help', 'shield', 'Money held until delivery', 'The seller is paid after you have the item')}
      ${f('#/help', 'code', 'Meet up with a code', 'Check the item, then give your 6-digit code')}
      ${f('#/sell/new', 'camera', 'Post from your phone', 'Add photos and a price, then share the link')}
      ${f('#/dashboard', 'chart', 'See what sells', 'Sales, interested buyers and meetups in one place')}
    </div>
  </section>`;
}

// Types, prices and pickup live in the header's Browse menu so the page itself stays clear.
function browseLink(p, changes) {
  const n = new URLSearchParams({ ...p, ...changes });
  [...n.keys()].forEach(k => { if (!n.get(k) || k === 'tour') n.delete(k); });
  const qs = n.toString();
  return qs ? '#/?' + qs : '#/';
}

function renderBrowseMenu() {
  const { parts, params } = parseHash();
  const p = parts.length ? {} : params;
  const compact = S().prefs.density === 'compact';
  document.getElementById('browseDrop').innerHTML = `
    <h4>Type</h4><div class="opts"><a href="${browseLink(p, { cat: '' })}" aria-current="${!p.cat}">All</a>
      ${CATEGORIES.map(c => `<a href="${browseLink(p, { cat: c })}" aria-current="${p.cat === c}">${esc(c)}</a>`).join('')}</div>
    <h4>Price</h4><div class="opts">${PRICES.map(([v, label]) => `<a href="${browseLink(p, { price: p.price === v ? '' : v })}" aria-current="${p.price === v}">${label}</a>`).join('')}</div>
    <h4>Show</h4><div class="opts"><a href="${browseLink(p, { local: p.local ? '' : '1' })}" aria-current="${!!p.local}">Pickup near me</a>
      <a href="#" data-density aria-current="${compact}">More per row</a></div>`;
}

function renderBrowse(params) {
  const st = S();
  const { tour, ...p } = params;
  if (tour && st.prefs.heroHidden) { st.prefs.heroHidden = false; save(); }
  const q = p.q || '';
  const extra = {};
  if (p.cat) extra.category = p.cat;
  if (p.local) extra.local = true;
  const price = PRICES.find(x => x[0] === p.price);
  if (price) { if (price[2] != null) extra.minPrice = price[2]; if (price[3] != null) extra.maxPrice = price[3]; }
  const home = !q && !p.cat && !p.local && !price && !p.sort;
  const compact = st.prefs.density === 'compact';
  const { results, filters } = search(st.items, q, extra, p.sort || (q ? 'best' : 'newest'));
  if (q && !results.length) {
    const miss = st.misses.find(m => m.q === q.toLowerCase());
    if (miss) { if (Store.now() - miss.at > 60000) { miss.count++; miss.at = Store.now(); } }
    else st.misses.unshift({ q: q.toLowerCase(), at: Store.now(), count: 1 });
    st.misses = st.misses.slice(0, 50); save();
  }
  document.getElementById('q').value = q;
  const link = changes => browseLink(p, changes);
  const understood = [];
  if (filters.maxPrice != null) understood.push(`< ${money(filters.maxPrice)}`);
  if (filters.minPrice != null) understood.push(`> ${money(filters.minPrice)}`);
  if (filters.decade) understood.push(`${filters.decade}s`);
  const opt = (v, label) => `<option value="${v}" ${v === (p.sort || '') ? 'selected' : ''}>${label}</option>`;
  const grid = list => `<div class="grid${compact ? ' compact' : ''}">${list.map(itemCard).join('')}</div>`;
  const recent = home ? (st.recent || []).map(itemById).filter(it => it && it.status === 'active').slice(0, 8) : [];
  // On the home page, everything is shown grouped by type so a whole shop can be scanned at once
  const sections = home ? groupByCategory(results, CATEGORIES) : null;

  app.innerHTML = `
    ${home && !st.prefs.heroHidden ? hero() : ''}
    <h1 class="sr">${q ? 'Search results' : 'Browse'}</h1>
    ${home ? '' : `<form class="filters" data-form="filters">
      <input type="hidden" name="q" value="${esc(q)}"><input type="hidden" name="cat" value="${esc(p.cat || '')}">
      <input type="hidden" name="price" value="${esc(p.price || '')}"><input type="hidden" name="local" value="${esc(p.local || '')}">
      ${q ? `<b>“${esc(q)}”</b>${understood.length ? `<span class="muted">${esc(understood.join(', '))}</span>` : ''}` : ''}
      ${p.cat ? `<a class="fchip" href="${link({ cat: '' })}" aria-label="${esc(tr('Remove filter'))}: ${esc(tr(p.cat))}"><span>${esc(p.cat)}</span> ×</a>` : ''}
      ${price ? `<a class="fchip" href="${link({ price: '' })}"><span>${price[1]}</span> ×</a>` : ''}
      ${p.local ? `<a class="fchip" href="${link({ local: '' })}"><span>Pickup near me</span> ×</a>` : ''}
      <span style="flex:1"></span>
      <label class="sr" for="sort">Sort</label>
      <select id="sort" name="sort">${opt('', q ? 'Best match' : 'Newest')}${opt('low', 'Lowest price')}${opt('high', 'Highest price')}</select>
    </form>`}
    ${recent.length ? `<h2 class="sub">Recently viewed</h2><div class="strip">${recent.map(it => `<a href="#/item/${it.id}"><span class="ph">${photo(it)}</span><b>${money(it.price)}</b></a>`).join('')}</div>` : ''}
    ${sections && results.length ? sections.map(g => `<section class="shelf"><div class="shelf-head"><h2 class="sub">${esc(g.category)}</h2>
        <a href="${link({ cat: g.category })}"><span>${tr('See all')}</span> ${g.items.length}</a></div>
        ${grid(g.items.slice(0, (matchMedia('(max-width:760px)').matches ? 3 : 4) * (compact ? 3 : 2)))}</section>`).join('')
    : results.length ? grid(results) : `
      <div class="panel" style="max-width:520px">
        <h2>Nothing yet</h2>
        <p>Add it to Wanted and you'll get an alert when someone lists it.</p>
        <a class="btn" href="#/wanted?what=${encodeURIComponent(q)}">Add to Wanted</a></div>`}`;
}

function renderItem(id) {
  const it = itemById(id);
  if (!it) { app.innerHTML = '<h1>Item not found</h1><p><a href="#/">Back</a></p>'; return; }
  const st = S();
  const seller = sellerById(it.sellerId);
  const stats = sellerStats(st.orders, seller.id);
  const inCart = st.cart.some(c => c.id === id);
  const fav = st.favs.includes(id);
  const qa = it.questions || [];
  app.innerHTML = `
    <div class="cols">
      <div class="gallery">
        <div class="main-ph" id="mainPh">${photo(it)}</div>
        ${it.photos && it.photos.length > 1 ? `<div class="thumbs">${it.photos.map((ph, i) => `<button type="button" data-act="thumb" data-i="${i}" aria-pressed="${i === 0}" aria-label="Photo ${i + 1}"><img src="${ph}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div>
        <h1>${esc(it.title)}</h1>
        <div class="bigprice">${money(it.price)}</div>
        <p><span class="chip">${esc(conditionLabel(it.condition))}</span>
          <span class="muted">${it.ships ? `<span>${tr('Shipping from')}</span> ${money(shippingFor([it]))}` : `<span>${tr('Pickup only')}</span>`}${it.meetup && it.ships ? ` · <span>${tr('Free pickup')}</span>` : ''}</span></p>
        ${it.status === 'active' ? `<div class="row">
          ${inCart ? '<a class="btn" href="#/cart">In your cart</a>' : `<button type="button" data-act="addCart" data-id="${it.id}">Add to cart</button>`}
          <button type="button" class="ghost" data-act="fav" data-id="${it.id}" aria-pressed="${fav}">${fav ? 'In favourites' : 'Add to favourites'}</button>
          <button type="button" class="ghost" data-act="share" data-path="/item/${it.id}" data-title="${esc(it.title)}">Share</button>
        </div>
        <p class="protect"><span>Your money is held until it's in your hands.</span> <a href="#/help">How it works</a></p>` : `<p class="notice"><span>${it.status === 'reserved' ? 'Reserved.' : 'Sold.'}</span> <a href="#/wanted?what=${encodeURIComponent(it.title)}">Get an alert for similar</a></p>`}
        <div class="flaws"><b>Flaws:</b> ${esc(it.flaws)}</div>
        ${it.description ? `<p>${esc(it.description)}</p>` : ''}
        <dl class="facts">
          ${it.measurements ? `<dt>Size</dt><dd>${esc(it.measurements)}</dd>` : ''}
          ${it.era && it.ageSure !== 'unknown' ? `<dt>Age</dt><dd>${esc(it.era)} <span class="chip ${it.ageSure === 'confirmed' ? '' : 'orange'}">${it.ageSure === 'confirmed' ? 'Confirmed' : 'Estimated'}</span></dd>` : ''}
          ${it.material ? `<dt>Material</dt><dd>${esc(it.material)}</dd>` : ''}
          ${it.maker ? `<dt>Details</dt><dd>${esc(it.maker)}</dd>` : ''}
        </dl>
        <a class="seller" href="#/seller/${seller.id}">${avatar(seller)}
          <span><b>${esc(seller.name)}</b><br><span class="muted">${esc(seller.city)} · ${stats.sales ? `${stats.sales} <span>${tr(stats.sales > 1 ? 'sales' : 'sale')}</span>` : `<span>${tr('New seller')}</span>`}</span></span></a>
        <h2>Questions</h2>
        ${qa.map(x => `<p><b>${esc(x.q)}</b><br>${x.a ? esc(x.a) : `<span class="muted">${tr('Waiting for an answer.')}</span>`}</p>`).join('')}
        <form data-form="ask" data-id="${it.id}" class="row">
          <label class="sr" for="askq">Your question</label>
          <input id="askq" name="q" required maxlength="300" placeholder="Ask the seller" style="flex:1;min-width:180px">
          <button type="submit" class="ghost">Ask</button>
        </form>
      </div>
    </div>`;
}

function renderSeller(id) {
  const st = S();
  const seller = sellerById(id);
  const stats = sellerStats(st.orders, id);
  const items = st.items.filter(i => i.sellerId === id);
  const live = items.filter(i => i.status === 'active');
  const sold = items.filter(i => i.status === 'sold');
  const groups = groupByCategory(live.sort((a, b) => b.listedAt - a.listedAt), CATEGORIES);
  const compact = st.prefs.density === 'compact';
  const bits = [`${stats.sales} ${tr(stats.sales === 1 ? 'sale' : 'sales')}`];
  if (stats.avgShipDays != null) bits.push(`${tr('ships in')} ${stats.avgShipDays} ${tr('days on average')}`);
  if (stats.sales) bits.push(`${stats.problems} ${tr(stats.problems === 1 ? 'problem' : 'problems')}`);
  app.innerHTML = `
    <div class="row" style="gap:16px;margin-bottom:8px">${avatar(seller).replace('class="avatar"', 'class="avatar" style="width:64px;height:64px;font-size:1.5rem"')}
      <div><h1 style="margin:0">${esc(seller.name)}</h1><span class="muted">${esc(seller.city)}</span></div></div>
    <p class="muted">${esc(bits.join(' · '))}</p>
    ${seller.about ? `<p style="max-width:60ch">${esc(seller.about)}</p>` : ''}
    <p><button type="button" class="ghost small" data-act="share" data-path="/seller/${seller.id}" data-title="${esc(seller.name)}">Share this shop</button></p>
    <h2 style="margin-top:24px">For sale</h2>
    ${live.length ? `<nav class="cats" aria-label="Sections">${groups.map(g => `<a href="#/seller/${id}" data-act="jump" data-to="sec-${g.category.replace(/\W+/g, '')}">${esc(g.category)} <span class="muted">${g.items.length}</span></a>`).join('')}</nav>
      ${groups.map(g => `<section class="shelf" id="sec-${g.category.replace(/\W+/g, '')}"><h3>${esc(g.category)}</h3><div class="grid${compact ? ' compact' : ''}">${g.items.map(itemCard).join('')}</div></section>`).join('')}`
    : '<p class="muted">Nothing listed right now.</p>'}
    ${sold.length ? `<h2 style="margin-top:32px">Sold</h2><div class="grid">${sold.map(it => `<div class="card"><div class="ph">${photo(it)}</div><h3>${esc(it.title)}</h3><div class="meta">${money(it.soldPrice || it.price)}</div></div>`).join('')}</div>` : ''}`;
}

function cartLines() {
  const st = S();
  st.cart = st.cart.filter(c => { const it = itemById(c.id); return it && it.status === 'active'; });
  return st.cart.map(c => ({ ...itemById(c.id), qty: Math.min(c.qty, itemById(c.id).qty || 1) }));
}

function checkoutChoice(lines) {
  const st = S();
  const canShip = lines.every(i => i.ships), canMeet = lines.every(i => i.meetup);
  const ch = st.checkout || (st.checkout = { fulfilment: canShip ? 'ship' : 'meetup', payment: 'online' });
  if (ch.fulfilment === 'ship' && !canShip) ch.fulfilment = 'meetup';
  if (ch.fulfilment !== 'ship' && !canMeet) ch.fulfilment = 'ship';
  if (ch.fulfilment === 'ship') ch.payment = 'online';
  return { ch, canShip, canMeet };
}

function renderCart() {
  const lines = cartLines();
  if (!lines.length) { app.innerHTML = '<h1>Cart</h1><p><span>Empty.</span> <a href="#/">Start browsing</a></p>'; return; }
  const { ch, canShip, canMeet } = checkoutChoice(lines);
  const t = cartTotalsAll(lines, ch.fulfilment, ch.payment);
  const radio = (name, val, title, desc, disabled) => `<label class="radio"><input type="radio" name="${name}" value="${val}" ${ch[name] === val ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span><b>${title}</b><span class="muted">${desc}</span></span></label>`;
  const na = 'Not available for everything here';
  app.innerHTML = `
    <h1>Cart</h1>
    <div class="cols">
      <div>
        ${t.groups.map(g => `<h3 style="margin-top:8px">${esc(sellerById(g.sellerId).name)}</h3>
          <div class="tablewrap"><table><tbody>${g.items.map(it => `<tr><td><a href="#/item/${it.id}">${esc(it.title)}</a></td>
            <td class="num">${money(it.price)}</td><td class="num"><button type="button" class="ghost small" data-act="removeCart" data-id="${it.id}">Remove</button></td></tr>`).join('')}</tbody></table></div>`).join('')}
        <form data-form="choice" style="margin-top:22px">
          <h2>Delivery</h2>
          ${radio('fulfilment', 'ship', 'Ship it', canShip ? 'Tracked' : na, !canShip)}
          ${radio('fulfilment', 'meetup', 'Pick it up', canMeet ? 'Free, inspect before you hand over your code' : na, !canMeet)}
          ${radio('fulfilment', 'delivery', 'Local drop-off', canMeet ? `${money(CONFIG.localDeliveryFee)} / ${tr('seller')}` : na, !canMeet)}
          ${ch.fulfilment !== 'ship' ? `<h2 style="margin-top:18px">Payment</h2>
            ${radio('payment', 'online', 'Pay now, protected', 'Held until the handoff')}
            ${radio('payment', 'at_handoff', 'Pay in person', 'Cash or e-Transfer, not protected')}` : ''}
        </form>
      </div>
      <div class="panel" style="align-self:start">
        <table>
          <tr><td>Items</td><td class="num">${money(t.subtotal)}</td></tr>
          <tr><td>${ch.fulfilment === 'ship' ? 'Shipping' : ch.fulfilment === 'delivery' ? 'Drop-off' : 'Pickup'}</td><td class="num">${t.shipping ? money(t.shipping) : tr('Free')}</td></tr>
          ${t.tax ? `<tr><td>Tax</td><td class="num">${money(t.tax)}</td></tr>` : ''}
          <tr><th>Total</th><th class="num">${money(t.total)}</th></tr>
        </table>
        ${t.spare > 0 ? `<p class="notice ok">+${t.spare} <span>${tr('more small items fit at no extra shipping.')}</span></p>` : ''}
        ${t.problems.map(pr => `<p class="notice err">${esc(tr(pr))}</p>`).join('')}
        <p style="margin:14px 0 0"><a class="btn" href="#/checkout" ${t.ok ? '' : 'aria-disabled="true" style="pointer-events:none;opacity:.5"'}>Checkout</a></p>
      </div>
    </div>`;
}

function renderCheckout() {
  const lines = cartLines();
  if (!lines.length) { location.hash = '#/cart'; return; }
  const { ch } = checkoutChoice(lines);
  const t = cartTotalsAll(lines, ch.fulfilment, ch.payment);
  if (!t.ok) { location.hash = '#/cart'; return; }
  const who = S().me;
  const soon = new Date(Store.now() + 86400000); soon.setHours(12, 0, 0, 0);
  const local = new Date(soon.getTime() - soon.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  app.innerHTML = `
    <h1>Checkout</h1>
    <div class="cols">
      <form data-form="checkout">
        <label class="f"><span>Name</span><input name="name" required autocomplete="name" value="${esc(who.name)}"></label>
        <label class="f"><span>Email</span><input name="email" type="email" required autocomplete="email" value="${esc(who.email)}"></label>
        ${ch.fulfilment !== 'meetup' ? `<label class="f"><span>Address</span><textarea name="address" required autocomplete="street-address" rows="3"></textarea></label>` : `
          <label class="f"><span>Meet at</span><select name="place">${MEET_SPOTS.map(s => `<option value="${esc(s)}">${esc(tr(s))}</option>`).join('')}</select></label>`}
        ${ch.fulfilment !== 'ship' ? `<label class="f"><span>When</span><input type="datetime-local" name="at" required value="${local}"></label>` : ''}
        <label class="row" style="margin:4px 0 18px"><input type="checkbox" name="marketing" ${S().prefs.marketing ? 'checked' : ''}> <span>Send me new arrivals now and then</span></label>
        <button type="submit">${ch.payment === 'online' ? `${tr('Pay')} ${money(t.total)}` : 'Reserve'}</button>
        <p class="hint">${ch.payment === 'online' ? `<span>${tr('Demo: nothing is charged.')}</span> ` : ''}<span>${tr('By ordering you agree to the')}</span> <a href="#/legal">terms</a>.</p>
      </form>
      <div class="panel" style="align-self:start">
        ${lines.map(i => `<p style="margin:0 0 8px">${esc(i.title)}<br><b>${money(i.price)}</b></p>`).join('')}
        <p style="margin:0">${t.shipping ? `${tr('Delivery')} ${money(t.shipping)}` : tr('Free pickup')}</p>
        <p><b>${tr('Total')} ${money(t.total)}</b></p>
        ${t.groups.length > 1 ? `<p class="hint">${t.groups.length} ${tr('orders, one per seller.')}</p>` : ''}
      </div>
    </div>`;
}

function placeOrder(form) {
  const st = S();
  const lines = cartLines();
  const { ch } = checkoutChoice(lines);
  const all = cartTotalsAll(lines, ch.fulfilment, ch.payment);
  if (!all.ok) { toast(all.problems[0]); return; }
  const fd = new FormData(form);
  st.me = { name: fd.get('name').trim(), email: fd.get('email').trim() };
  st.prefs.marketing = !!fd.get('marketing');
  const at = fd.get('at') ? new Date(fd.get('at')).getTime() : null;
  const made = [];
  for (const g of all.groups) {
    let order;
    try {
      order = createOrder({
        id: Store.nextOrderId(), sellerId: g.sellerId, items: g.items, buyer: { ...st.me }, fulfilment: ch.fulfilment, payment: ch.payment,
        now: Store.now(), checkMinimum: false, address: fd.get('address') || null,
        meetup: ch.fulfilment === 'ship' ? null : { place: fd.get('place') || 'Your address', at },
      });
    } catch (e) { toast(e.message); return; }
    g.items.forEach(line => {
      const it = itemById(line.id);
      it.qty = Math.max(0, (it.qty || 1) - line.qty);
      if (it.qty === 0) { it.status = order.state === 'reserved' ? 'reserved' : 'sold'; it.soldAt = Store.now(); it.soldPrice = it.price; }
    });
    st.orders.unshift(order);
    notify(order.log[0].action, order);
    made.push(order);
  }
  st.cart = [];
  save();
  location.hash = made.length > 1 ? '#/orders' : '#/order/' + made[0].id;
  toast(made[0].state === 'reserved' ? 'Reserved. Your handoff code is ready.' : 'Paid. Your money is held until it arrives.');
}

function logList(o) {
  return `<ul class="timeline">${o.log.slice().reverse().map(e => `<li><time>${fmtDate(e.at)}</time><span>${(LOG_TEXT[e.action] || (() => esc(e.action)))(o, e)}</span></li>`).join('')}</ul>`;
}

function renderOrder(id) {
  const o = orderById(id);
  if (!o) { app.innerHTML = '<h1>Order not found</h1>'; return; }
  const can = a => canDo(o, a, 'buyer');
  const seller = sellerById(o.sellerId);
  const when = o.meetup && o.meetup.at ? ', ' + fmtDate(o.meetup.at) : '';
  app.innerHTML = `
    <h1><span>${tr('Order')}</span> ${esc(o.id)}</h1>
    <p><span class="chip ${o.state === 'problem' ? 'red' : ''}">${esc(STATES[o.state].label)}</span>
      ${o.shipBy && o.state === 'paid_held' ? `<span class="muted"><span>${tr('Ships by')}</span> ${fmtDate(o.shipBy)}<span>${tr(", or you're refunded.")}</span></span>` : ''}
      ${o.state === 'delivered' ? `<span class="muted"><span>${tr('Money releases')}</span> ${fmtDate(o.deliveredAt + CONFIG.checkWindowDays * DAY)}<span>${tr(' unless you report a problem.')}</span></span>` : ''}</p>
    ${moneyBar(o)}
    <div class="cols">
      <div>
        ${o.handoffCode && ['paid_held', 'reserved'].includes(o.state) ? `<div class="panel" style="margin-bottom:20px">
          <h2>Handoff code</h2>
          <div class="code" aria-label="${o.handoffCode.split('').join(' ')}">${o.handoffCode}</div>
          <p style="margin:0">${dot(esc(o.fulfilment === 'meetup' ? tr(o.meetup.place) : tr('Drop-off at your address')) + when)}
          <span>${tr('Check the item, then read this code to the seller.')}</span></p></div>` : ''}
        ${o.state === 'delivered' ? `<p><button type="button" data-act="confirm" data-id="${o.id}">Got it, all good</button></p>` : ''}
        ${can('report') ? `<details style="margin-bottom:20px"><summary><b>Report a problem</b></summary>
          <form data-form="report" data-id="${o.id}" style="margin-top:12px">
            <label class="f"><span>What went wrong?</span><textarea name="reason" required></textarea></label>
            <label class="f"><span>Photos (optional)</span><input type="file" name="photos" accept="image/*" multiple></label>
            <button type="submit" class="warn">Report</button>
            <p class="hint">Your money stays held until it's sorted.</p></form></details>` : ''}
        <h2>Timeline</h2>${logList(o)}
        ${o.problem && o.problem.photos ? `<div class="previews">${o.problem.photos.map(p => `<img src="${p}" alt="Photo the buyer added to the problem report">`).join('')}</div>` : ''}
        ${can('cancel') ? `<p style="margin-top:18px"><button type="button" class="ghost small" data-act="cancelBuyer" data-id="${o.id}">Cancel order</button></p>` : ''}
      </div>
      <div class="panel" style="align-self:start">
        <a class="seller" href="#/seller/${seller.id}" style="margin-top:0;border-top:0">${avatar(seller)}<b>${esc(seller.name)}</b></a>
        ${o.items.map(i => `<p style="margin:0 0 8px"><a href="#/item/${i.id}">${esc(i.title)}</a><br>${money(i.price)}</p>`).join('')}
        <p>${o.shipping ? `${tr('Delivery')} ${money(o.shipping)}` : tr('Free pickup')}<br><b>${tr('Total')} ${money(o.total)}</b><br>
        <span class="muted">${o.payment === 'online' ? 'Paid online, protected' : 'Paying in person'}</span></p>
        ${o.tracking ? `<p><span>${tr('Tracking')}</span> <b>${esc(o.tracking)}</b></p>` : ''}
        ${o.packPhoto ? `<p><img class="packimg" src="${o.packPhoto}" alt="Seller's photo of the item being packed"><br><span class="hint">Packed by the seller</span></p>` : ''}
      </div>
    </div>`;
}

function renderOrders() {
  const orders = S().orders;
  app.innerHTML = `<h1>My orders</h1>${orders.length ? `<div class="tablewrap"><table>
    <thead><tr><th>Order</th><th>Items</th><th>Status</th><th class="num">Total</th></tr></thead>
    <tbody>${orders.map(o => `<tr><td><a href="#/order/${o.id}">${esc(o.id)}</a><br><span class="muted">${fmtDate(o.createdAt, false)}</span></td>
      <td>${o.items.map(i => esc(i.title)).join('<br>')}</td><td>${esc(STATES[o.state].label)}</td><td class="num">${money(o.total)}</td></tr>`).join('')}</tbody></table></div>`
    : '<p>No orders yet.</p>'}`;
}

function renderInbox() {
  const st = S();
  app.innerHTML = `<h1>Alerts</h1>
    ${st.inbox.length ? `<ul class="timeline">${st.inbox.map(n => `<li><time>${fmtDate(n.at)} · ${tr(n.to === 'seller' ? 'as seller' : 'as buyer')}${n.read ? '' : ` · <b>${tr('new')}</b>`}</time><span>${esc(tr(n.text))}</span> <a href="#/${n.itemId ? 'item/' + n.itemId : n.to === 'seller' ? (n.orderId ? 'dashboard/todo' : 'dashboard/interest') : 'order/' + n.orderId}">View</a></li>`).join('')}</ul>` : '<p class="muted">No alerts yet.</p>'}`;
  st.inbox.forEach(n => { n.read = true; }); save(); updateCounts();
}

function renderWanted(p) {
  const st = S();
  app.innerHTML = `<h1>Wanted</h1>
    <p class="lede">Can't find it? Post it. Sellers see it, and you get an alert when it's listed.</p>
    <form data-form="want" style="max-width:560px">
      <label class="f"><span>What are you looking for?</span><input name="what" required maxlength="120" value="${esc(p.what || '')}"></label>
      <div class="row">
        <label class="f"><span>Max price (optional)</span><input name="max" type="number" min="1" step="1" inputmode="numeric"></label>
        <label class="f" style="flex:1"><span>Email for the alert (optional)</span><input name="email" type="email" value="${esc(st.me.email)}"></label>
      </div>
      <button type="submit">Post</button>
    </form>
    ${st.wants.length ? `<h2 style="margin-top:28px">People are looking for</h2><ul>${st.wants.map(w => `<li>${esc(w.what)}${w.max ? ` · ≤ ${money(w.max)}` : ''}</li>`).join('')}</ul>` : ''}`;
}

function renderSettings() {
  const st = S();
  const r = (who, val, title) => `<label class="radio"><input type="radio" name="${who}" value="${val}" ${st.prefs[who] === val ? 'checked' : ''}><span><b>${title}</b></span></label>`;
  const lr = (val, title) => `<label class="radio"><input type="radio" name="lang" value="${val}" ${lang() === val ? 'checked' : ''}><span><b>${title}</b></span></label>`;
  app.innerHTML = `<h1>Settings</h1>
    <form data-form="prefs" style="max-width:520px">
      <h2>Language</h2>${lr('en', 'English')}${lr('zh', '中文（简体）')}
      <h2 style="margin-top:18px">Alerts when buying</h2>${r('buyer', 'essentials', 'Only what matters')}${r('buyer', 'all', 'Every step')}
      <h2 style="margin-top:18px">Alerts when selling</h2>${r('seller', 'essentials', 'Only what matters')}${r('seller', 'all', 'Every step')}
      <label class="row" style="margin:16px 0"><input type="checkbox" name="marketing" ${st.prefs.marketing ? 'checked' : ''}> <span>New-arrival emails</span></label>
      <button type="submit">Save</button>
    </form>
    <h2 style="margin-top:32px">Your data</h2>
    <div class="row"><button type="button" class="ghost" data-act="exportData">Download my data</button>
    <button type="button" class="ghost" data-act="deleteData">Delete my data</button></div>`;
}

function renderHelp() {
  app.innerHTML = lang() === 'zh' ? HELP_ZH() : `<div class="legal"><h1>Help and returns</h1>
    <h2>Buying with shipping</h2>
    <ol><li>You pay. The money is held, not sent to the seller yet.</li>
      <li>The seller ships within ${CONFIG.shipByDays} days, or you're refunded automatically.</li>
      <li>It arrives. You have ${CONFIG.checkWindowDays} days to report a problem.</li>
      <li>Then the seller is paid.</li></ol>
    <h2>Picking up in person</h2>
    <ol><li>Reserve, and pick a public place and time.</li>
      <li>You get a 6-digit handoff code.</li>
      <li>Check the item. If it's right, read the code to the seller. If not, walk away and cancel.</li></ol>
    <p>Paid online? The code releases the money. Paying in person? Pay then. In-person payments aren't protected.</p>
    <h2>Returns and refunds</h2>
    <p class="notice">Draft policy for Alexander to finish. Not legal advice.</p>
    <ul><li><b>Not shipped in time:</b> automatic full refund.</li>
      <li><b>Not as described or damaged:</b> report it with photos within ${CONFIG.checkWindowDays} days of delivery. Refund in full, or partly if you keep it. [Who pays return shipping?]</li>
      <li><b>Changed your mind:</b> [up to each seller, shown on the listing?]</li>
      <li>Refunds go back to the original payment method.</li></ul>
    <h2>Fees</h2><p>Buyers pay the price plus delivery, shown before checkout. Nothing else.</p></div>`;
}

function renderLegal() {
  app.innerHTML = `<div class="legal"><h1>Terms and privacy</h1>
    ${lang() === 'zh' ? '<p class="notice">条款和隐私政策目前只有英文草稿。正式上线前会提供经过审核的中文版本。</p>' : ''}
    <p class="notice">Drafts for Alexander to finish and have checked. Not legal advice.</p>
    <h2>Terms</h2>
    <ul><li>Trove is run by [name or business], [city, province], Canada. Contact: [email].</li>
      <li>Trove is a place for people to buy from independent sellers. Each listing is the seller's own description.</li>
      <li>You must be at least [age of majority in your province] to buy or sell.</li>
      <li>Prices are in Canadian dollars. Delivery is shown before you pay. [Tax wording once registered.]</li>
      <li>Online payments are held until delivery or handoff (see <a href="#/help">Help</a>). In-person payments aren't covered.</li>
      <li>Not allowed: [prohibited items list, e.g. weapons, recalled products, anything illegal].</li>
      <li>Governing law: [province] and Canada.</li></ul>
    <h2>Privacy</h2>
    <ul><li>We collect your name, email and address or meeting place, only to complete orders. Card details go to the payment provider, never to us.</li>
      <li>No advertising trackers.</li>
      <li>Shared with: [payment provider, shipping label provider, email provider, database host], each linked to its own policy.</li>
      <li>Kept for: [order records N years for tax; the rest deleted on request].</li>
      <li>Download or delete your data from Settings, or email [contact].</li>
      <li>PIPEDA applies in Canada, and Quebec has its own law; [verify what's required].</li></ul>
    <h2>Cookies</h2>
    <p>No tracking cookies. Your cart and settings are kept in your browser so the site works. When card payments go live, the payment provider may set its own cookies; [list them and add a consent banner if required].</p></div>`;
}

// ---------- dashboard ----------

function dashHead(cur) {
  const st = S(), sid = st.actingSeller;
  const mine = st.orders.filter(o => o.sellerId === sid);
  const n = mine.filter(o => ['paid_held', 'reserved', 'problem'].includes(o.state)).length;
  const unanswered = unansweredCount();
  const meets = scheduleByDay(st.orders, sid, Store.now()).reduce((s, d) => s + d.orders.length, 0);
  const drafts = st.items.filter(i => i.sellerId === sid && i.status === 'draft').length;
  const t = [['todo', 'To do', n], ['schedule', 'Schedule', meets], ['listings', 'Listings', drafts], ['interest', 'Interest', unanswered],
    ['money', 'Money'], ['insights', 'Insights'], ['profile', 'Profile']];
  return `<div class="row" style="justify-content:space-between">
      <h1 style="margin:0">Dashboard</h1>
      <label class="hint"><span>Demo, viewing as</span> <select data-act-change="seller" aria-label="Seller">${st.sellers.map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
    </div>
    <nav class="tabs" aria-label="Dashboard" style="margin-top:12px">${t.map(([id, label, c]) => `<a href="#/dashboard/${id}" ${cur === id ? 'aria-current="page"' : ''}><span>${label}</span>${c ? ` <span class="count">${c}</span>` : ''}</a>`).join('')}</nav>`;
}

const myOrders = () => S().orders.filter(o => o.sellerId === S().actingSeller);
const myItems = () => S().items.filter(i => i.sellerId === S().actingSeller);
const unansweredCount = () => myItems().reduce((s, i) => s + (i.questions || []).filter(q => !q.a).length, 0);
const dayKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const timeOnly = ms => new Date(ms).toLocaleTimeString(lang() === 'zh' ? 'zh-CN' : 'en-CA', { hour: 'numeric', minute: '2-digit' });

function deadline(o) {
  if (o.shipBy && o.state === 'paid_held') return o.shipBy;
  if (o.meetup && o.meetup.at) return o.meetup.at;
  return o.createdAt + 99 * DAY;
}

function todoCard(o) {
  const items = o.items.map(i => esc(i.title)).join(', ');
  const who = esc(o.buyer.name || o.buyer.email);
  let body = '';
  if (o.state === 'paid_held' && o.fulfilment === 'ship') {
    body = `<p><b><span>${tr('Ship by')}</span> ${fmtDate(o.shipBy)}</b> · ${who}<br><span class="muted" style="white-space:pre-line">${esc(o.address)}</span></p>
      <form data-form="ship" data-id="${o.id}">
        <div class="row">
          <label class="f"><span>Tracking number</span><input name="tracking" required></label>
          <label class="f"><span>Label cost</span><input name="label" type="number" min="0" step="0.01" placeholder="$"></label>
        </div>
        <label class="f"><span>Packing photo (protects you in a dispute)</span><input name="pack" type="file" accept="image/*"></label>
        <button type="submit">Mark shipped</button>
      </form>`;
  } else if (['paid_held', 'reserved'].includes(o.state)) {
    body = `<p>${who} · ${esc(o.meetup ? tr(o.meetup.place) : '')}${o.meetup && o.meetup.at ? ', ' + fmtDate(o.meetup.at) : ''}<br>
      ${o.payment === 'online' ? `<span>${tr('Paid online.')}</span>` : `<span>${tr('Collect')}</span> <b>${money(o.total)}</b>`}</p>
      <form data-form="handoff" data-id="${o.id}" class="row" style="align-items:flex-end">
        <label class="f" style="margin:0"><span>Buyer's code</span><input name="code" inputmode="numeric" maxlength="8" required></label>
        <button type="submit">Confirm handoff</button>
      </form>
      <p class="hint"><span>${tr('Demo: the code is')}</span> ${o.handoffCode}</p>`;
  } else if (o.state === 'shipped') {
    body = `<p><span>${tr('Tracking')}</span> ${esc(o.tracking)}</p>
      <button type="button" class="ghost small" data-act="scan" data-id="${o.id}">Demo: mark delivered</button>`;
  } else if (o.state === 'problem') {
    body = `<p class="notice err">${esc(o.problem ? o.problem.reason : '')}</p>
      ${o.problem && o.problem.photos ? `<div class="previews">${o.problem.photos.map(p => `<img src="${p}" alt="Buyer's photo of the problem">`).join('')}</div>` : ''}
      <div class="row"><button type="button" data-act="resolveRelease" data-id="${o.id}">Sorted, release money</button>
      <button type="button" class="warn" data-act="resolveRefund" data-id="${o.id}">Refund buyer</button></div>`;
  } else if (o.state === 'delivered') {
    body = `<p class="muted"><span>${tr('Money releases')}</span> ${fmtDate(o.deliveredAt + CONFIG.checkWindowDays * DAY)}</p>`;
  }
  return `<article class="todo"><header><b>${items}</b><span class="chip ${o.state === 'problem' ? 'red' : ''}">${esc(STATES[o.state].label)}</span></header>${body}
    ${['paid_held', 'reserved'].includes(o.state) ? `<p style="margin-bottom:0"><button type="button" class="ghost small" data-act="cancelSeller" data-id="${o.id}">Can't fulfil, cancel</button></p>` : ''}</article>`;
}

function renderDashTodo() {
  const open = myOrders().filter(o => ['paid_held', 'reserved', 'problem', 'shipped', 'delivered'].includes(o.state))
    .sort((a, b) => (b.state === 'problem') - (a.state === 'problem') || deadline(a) - deadline(b));
  const st = S(), now = Store.now();
  const week = weeklySales(st.orders, st.actingSeller, now, 1)[0];
  const next = scheduleByDay(st.orders, st.actingSeller, now).flatMap(d => d.orders).find(o => o.meetup.at >= now);
  const watching = interestByItem(st.events || [], myItems().filter(i => i.status === 'active')).reduce((s, r) => s + r.save + r.cart, 0);
  const tile = (href, big, label) => `<a class="tile" href="#/dashboard/${href}"><b>${big}</b><span>${label}</span></a>`;
  app.innerHTML = dashHead('todo') + `<div class="tiles">
      ${tile('money', money(week.total), 'Sold in the last 7 days')}
      ${tile('schedule', next ? esc(shortDate(next.meetup.at)) + ' ' + esc(timeOnly(next.meetup.at)) : '–', 'Next meetup')}
      ${tile('interest', watching, 'Saves and carts')}
      ${tile('interest', unansweredCount(), 'Questions to answer')}
    </div>` + (open.length ? open.map(todoCard).join('') : `<p>Nothing to do.</p>
    <p class="hint">Try it: buy something as a buyer, then come back.</p>`);
}

// Meetups and ship-by deadlines on a two-week strip, then day by day.
function renderDashSchedule() {
  const st = S(), now = Store.now(), loc = lang() === 'zh' ? 'zh-CN' : 'en-CA';
  const byDay = {};
  scheduleByDay(st.orders, st.actingSeller, now).forEach(d => d.orders.forEach(o => (byDay[d.day] = byDay[d.day] || []).push({ at: o.meetup.at, o, kind: 'meet' })));
  myOrders().filter(o => o.state === 'paid_held' && o.fulfilment === 'ship' && o.shipBy)
    .forEach(o => { const k = dayKey(new Date(o.shipBy)); (byDay[k] = byDay[k] || []).push({ at: o.shipBy, o, kind: 'ship' }); });
  const today = new Date(now);
  const cells = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const n = (byDay[dayKey(d)] || []).length;
    cells.push(`<div class="day${n ? ' busy' : ''}${i === 0 ? ' today' : ''}"><span>${esc(d.toLocaleDateString(loc, { weekday: 'short' }))}</span><b>${d.getDate()}</b>${n ? `<i>${n}</i>` : ''}</div>`);
  }
  const keys = Object.keys(byDay).sort();
  app.innerHTML = dashHead('schedule') + `<div class="cal" aria-label="Next two weeks">${cells.join('')}</div>
    ${keys.length ? keys.map(k => {
      const [y, m, d] = k.split('-').map(Number);
      return `<h3 class="dayhead">${esc(new Date(y, m - 1, d).toLocaleDateString(loc, { weekday: 'long', month: 'long', day: 'numeric' }))}</h3>
      ${byDay[k].sort((a, b) => a.at - b.at).map(({ at, o, kind }) => `<a class="todo slot" href="#/dashboard/todo">
        <time>${esc(timeOnly(at))}</time>
        <span><b>${o.items.map(i => esc(i.title)).join(', ')}</b><br>
        <span class="muted">${kind === 'ship' ? `<span>${tr('Ship by')}</span>` : `${esc(o.buyer.name || o.buyer.email || '')} · ${esc(tr(o.meetup.place))}`}</span></span>
        <span class="chip ${kind === 'ship' ? 'orange' : ''}">${kind === 'ship' ? tr('Ship') : o.payment === 'online' ? tr('Paid online.') : `${tr('Collect')} ${money(o.total)}`}</span></a>`).join('')}`;
    }).join('') : '<p class="muted">No meetups booked.</p>'}`;
}

function renderDashListings() {
  const all = myItems().sort((a, b) => b.listedAt - a.listedAt);
  const drafts = all.filter(i => i.status === 'draft');
  const status = { active: 'For sale', sold: 'Sold', reserved: 'Reserved', hidden: 'Hidden' };
  const row = it => `<tr><td><a href="#/item/${it.id}">${esc(it.title)}</a></td><td class="num">${money(it.price)}</td>
      <td>${esc(status[it.status] || it.status)}</td>
      <td class="num"><a href="#/sell/edit/${it.id}">Edit</a>${it.status === 'active' ? ` <button type="button" class="ghost small" data-act="hide" data-id="${it.id}">Hide</button>` : it.status === 'hidden' ? ` <button type="button" class="ghost small" data-act="unhide" data-id="${it.id}">Show</button>` : ''}</td></tr>`;
  app.innerHTML = dashHead('listings') + `
    <div class="row" style="margin-bottom:18px;align-items:stretch">
      <a class="btn" href="#/sell/new" style="align-self:center">List an item</a>
      <label class="drop bulk" id="bulkZone" for="bulkInput"><input type="file" id="bulkInput" accept="image/*" multiple>
        <b>Add many at once</b><span class="muted">One photo per item. Finish them later.</span></label>
    </div>
    ${drafts.length ? `<h2>Drafts to finish</h2><div class="previews">${drafts.map((it, k) => `<figure><a href="#/sell/edit/${it.id}"><img src="${it.photos[0]}" alt="${tr('Draft')} ${k + 1}"></a>
      <figcaption><a href="#/sell/edit/${it.id}">Finish</a> <button type="button" class="ghost small" data-act="dropDraft" data-id="${it.id}">Delete</button></figcaption></figure>`).join('')}</div>` : ''}
    ${groupByCategory(all.filter(i => i.status !== 'draft'), CATEGORIES).map(g => `<h3 class="dayhead">${esc(g.category)} <span class="muted">${g.items.length}</span></h3>
      <div class="tablewrap"><table><tbody>${g.items.map(row).join('')}</tbody></table></div>`).join('')}`;
}

async function addDrafts(files) {
  const list = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 12);
  if (!list.length) return;
  let pics;
  try { pics = await Promise.all(list.map(f => readImage(f))); } catch (e) { toast("One of those photos couldn't be read."); return; }
  const st = S(), now = Store.now();
  pics.forEach((src, k) => st.items.unshift({ id: 'd' + now + k, sellerId: st.actingSeller, status: 'draft', listedAt: now, title: '', price: 0,
    photos: [src], alt: '', qty: 1, size: 'small', ships: true, meetup: true, condition: '', category: '', flaws: '', questions: [] }));
  save(); route();
  toast(`${pics.length} ${tr(pics.length === 1 ? 'draft added.' : 'drafts added.')}`);
}

let pendingPhotos = [];   // photos chosen in the listing form, already shrunk, in order (first = cover)

function renderListingForm(id) {
  const it = id ? itemById(id) : { condition: '', size: 'small', ageSure: '', meetup: true, ships: true, qty: 1, photos: [] };
  if (!it) { app.innerHTML = '<h1>Item not found</h1>'; return; }
  pendingPhotos = (it.photos || []).slice();
  const r = (name, val, title, desc) => `<label class="radio"><input type="radio" name="${name}" value="${val}" ${it[name] === val ? 'checked' : ''}><span><b>${title}</b><span class="muted">${desc}</span></span></label>`;
  const showAge = ['Antiques', 'Collectibles'].includes(it.category) || it.era;
  app.innerHTML = `
    <h1>${id ? (it.status === 'draft' ? 'Finish listing' : 'Edit listing') : 'Sell something'}</h1>
    <form data-form="listing" data-id="${id || ''}" style="max-width:680px" novalidate>
      <label class="drop" id="dropZone" for="photoInput">
        <input type="file" id="photoInput" name="photos" accept="image/*" multiple>
        <b>Add photos</b><span class="muted">Tap to choose, or drag them here. Show any flaws.</span>
      </label>
      <div class="previews" id="photoPreview"></div>
      <label class="f"><span>Describe the photos in a few words</span><small>For people using screen readers.</small><input name="alt" value="${esc(it.photos && it.photos.length ? it.alt : '')}"></label>
      <label class="f"><span>Title</span><input name="title" required maxlength="80" value="${esc(it.title || '')}"></label>
      <div class="row">
        <label class="f"><span>Price ($)</span><input name="price" type="number" min="1" step="0.01" required value="${it.price ? (it.price / 100).toFixed(2) : ''}"></label>
        <label class="f"><span>Category</span><select name="category" id="catSelect"><option value="" ${it.category ? '' : 'selected'} disabled>${tr('Choose')}</option>${CATEGORIES.map(c => `<option value="${c}" ${it.category === c ? 'selected' : ''}>${tr(c)}</option>`).join('')}</select></label>
      </div>
      <fieldset style="border:0;padding:0;margin:0 0 16px"><legend><b>Condition</b></legend>${CONDITIONS.map(c => r('condition', c[0], c[1], c[2])).join('')}</fieldset>
      <label class="f"><span>Flaws</span><small>Chips, scratches, missing parts. Or write "None".</small><textarea name="flaws" rows="2">${esc(it.flaws || '')}</textarea></label>
      <label class="f"><span>Size</span><input name="measurements" placeholder="e.g. 21 cm tall, or size M" value="${esc(it.measurements || '')}"></label>
      <label class="f"><span>Description (optional)</span><textarea name="description" rows="3">${esc(it.description || '')}</textarea></label>
      <div id="ageFields" ${showAge ? '' : 'hidden'}>
        <div class="row">
          <label class="f"><span>Age or era</span><input name="era" placeholder="e.g. 1950s" value="${esc(it.era || '')}"></label>
          <label class="f"><span>How sure?</span><select name="ageSure">${[['estimated', 'Estimated'], ['confirmed', 'Confirmed']].map(([v, l]) => `<option value="${v}" ${it.ageSure === v ? 'selected' : ''}>${tr(l)}</option>`).join('')}</select></label>
        </div>
        <label class="f"><span>Maker's marks</span><input name="maker" value="${esc(it.maker || '')}"></label>
      </div>
      <details style="margin-bottom:16px"><summary>More details</summary>
        <div class="row" style="margin-top:12px">
          <label class="f"><span>Material</span><input name="material" value="${esc(it.material || '')}"></label>
          <label class="f"><span>What you paid ($)</span><small>Private, for your profit figures</small><input name="cost" type="number" min="0" step="0.01" value="${it.cost ? (it.cost / 100).toFixed(2) : ''}"></label>
          <label class="f"><span>How many</span><input name="qty" type="number" min="1" step="1" value="${it.qty || 1}"></label>
        </div>
      </details>
      <fieldset style="border:0;padding:0;margin:0 0 12px"><legend><b>Box size</b></legend>${SIZES.map(s => r('size', s[0], s[1], s[2])).join('')}</fieldset>
      <label class="row"><input type="checkbox" name="ships" ${it.ships ? 'checked' : ''}> <span>Can ship</span></label>
      <label class="row" style="margin:6px 0 18px"><input type="checkbox" name="meetup" ${it.meetup ? 'checked' : ''}> <span>Pickup or local drop-off</span></label>
      <div id="formErrors"></div>
      <button type="submit">${id && it.status !== 'draft' ? 'Save' : 'Publish'}</button>
      <p class="hint"><span>${tr('Listing as')}</span> ${esc(me().name)} · <span>${tr('Free to list.')}</span></p>
    </form>`;
  drawPreviews();
}

function drawPreviews() {
  const box = document.getElementById('photoPreview');
  if (!box) return;
  box.innerHTML = pendingPhotos.map((p, i) => `<figure><img src="${p}" alt="${tr('Photo')} ${i + 1}">
    <figcaption>${i === 0 ? tr('Cover') : `<button type="button" class="ghost small" data-act="coverPhoto" data-i="${i}">${tr('Make cover')}</button>`}
    <button type="button" class="ghost small" data-act="dropPhoto" data-i="${i}" aria-label="${tr('Remove')} ${i + 1}">${tr('Remove')}</button></figcaption></figure>`).join('');
}

async function addPhotos(files) {
  const list = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, MAX_PHOTOS - pendingPhotos.length);
  if (!list.length) { if (pendingPhotos.length >= MAX_PHOTOS) toast(`Up to ${MAX_PHOTOS} photos.`); return; }
  try { pendingPhotos.push(...await Promise.all(list.map(f => readImage(f)))); }
  catch (e) { toast("One of those photos couldn't be read."); }
  drawPreviews();
}

function saveListing(form) {
  const st = S();
  const id = form.dataset.id;
  const fd = new FormData(form);
  const existing = id ? itemById(id) : null;
  const era = (fd.get('era') || '').trim();
  const year = Number((era.match(/1[6-9]\d\d|20\d\d/) || [])[0]);
  const it = {
    ...(existing || { id: 'i' + Date.now(), sellerId: st.actingSeller, listedAt: Store.now(), status: 'active', questions: [], art: 'game', tone: '#efe7da' }),
    title: fd.get('title').trim(), price: cents(fd.get('price') || 0), cost: cents(fd.get('cost') || 0),
    qty: Math.max(1, Number(fd.get('qty')) || 1), category: fd.get('category'), condition: fd.get('condition'),
    flaws: fd.get('flaws'), measurements: (fd.get('measurements') || '').trim(), era, ageSure: era ? fd.get('ageSure') : '',
    decade: year ? Math.floor(year / 10) * 10 : null, material: (fd.get('material') || '').trim(), maker: (fd.get('maker') || '').trim(),
    description: fd.get('description').trim(), size: fd.get('size'), ships: !!fd.get('ships'), meetup: !!fd.get('meetup'),
    photos: pendingPhotos.slice(), alt: (fd.get('alt') || '').trim(),
  };
  if (existing && existing.status === 'draft') { it.status = 'active'; it.listedAt = Store.now(); }
  // Size is helpful but optional for things like clothing, so the listing check gets a stand-in
  const errs = validateListing({ ...it, measurements: it.measurements || 'n/a' });
  if (!it.photos.length) errs.unshift('Add at least one photo.');
  if (!it.category) errs.push('Pick a category.');
  if (it.photos.length && !it.alt) errs.push('Describe the photos in a few words.');
  if (!it.ships && !it.meetup) errs.push('Allow shipping, pickup, or both.');
  if (errs.length) {
    document.getElementById('formErrors').innerHTML = `<div class="notice err" role="alert"><ul style="margin:0;padding-left:18px">${errs.map(e => `<li>${esc(tr(e))}</li>`).join('')}</ul></div>`;
    return;
  }
  const wasDraft = existing && existing.status === 'draft';
  if (existing) Object.assign(existing, it); else st.items.unshift(it);
  matchWants(it);
  save();
  location.hash = '#/item/' + it.id;
  toast(existing && !wasDraft ? 'Saved.' : 'Listed.');
}

// A new listing that matches a Wanted post sends that buyer an alert.
function matchWants(it) {
  S().wants.forEach(w => {
    if (w.matched && w.matched.includes(it.id)) return;
    if (search([it], w.what, w.max ? { maxPrice: w.max } : {}).results.length) {
      (w.matched = w.matched || []).push(it.id);
      S().inbox.unshift({ at: Store.now(), to: 'buyer', text: `Something you wanted was just listed: “${it.title}”.`, read: false, itemId: it.id });
    }
  });
}

function renderDashMoney() {
  const orders = myOrders();
  const m = moneySummary(orders);
  const closed = orders.filter(o => o.closedAt && o.state !== 'cancelled');
  app.innerHTML = dashHead('money') + `
    <div class="tiles">
      <div class="tile"><b>${money(m.held)}</b><span>On the way to you</span></div>
      <div class="tile"><b>${money(m.released + m.inPerson)}</b><span>Earned</span></div>
      <div class="tile"><b>${money(CONFIG.trovePaysCardFee ? 0 : m.fees)}</b><span>${CONFIG.trovePaysCardFee ? tr('Fees you paid') : tr('Card fees')}</span></div>
      <div class="tile"><b>${money(m.profit)}</b><span>Profit after costs</span></div>
    </div>
    <h2>Sales by week</h2>
    ${barChart(weeklySales(S().orders, S().actingSeller, Store.now(), 8).map(w => ({ label: shortDate(w.start + DAY), value: w.total })), shortMoney, tr('Sales by week'))}
    <div class="row" style="justify-content:space-between;margin-bottom:6px">
      <h2 style="margin:0">Completed orders</h2>
      <button type="button" class="ghost small" data-act="csv" ${closed.length ? '' : 'disabled'}>Export for accounting</button>
    </div>
    ${closed.length ? `<div class="tablewrap"><table><thead><tr><th>Date</th><th>Items</th><th class="num">Total</th><th class="num">Fee</th><th class="num">You got</th><th class="num">Profit</th></tr></thead><tbody>
      ${closed.map(o => { const p = payoutFor(o); const rf = o.state === 'refunded'; return `<tr><td>${fmtDate(o.closedAt, false)}</td><td>${o.items.map(i => esc(i.title)).join(', ')}${rf ? ` <span class="chip red">${tr('Refunded')}</span>` : ''}</td>
        <td class="num">${money(rf ? 0 : o.total)}</td><td class="num">${money(rf ? 0 : p.fee)}</td><td class="num">${money(rf ? 0 : p.net)}</td><td class="num">${money(rf ? -p.label : p.profit)}</td></tr>`; }).join('')}
    </tbody></table></div>` : '<p class="muted">None yet.</p>'}
    <p class="hint">${CONFIG.trovePaysCardFee ? tr('No fees for you or your buyers. Trove pays the card processing.') : tr('Trove charges no fee. Card fees are an estimate until payments are live.')}</p>`;
}

function renderDashInsights() {
  const st = S();
  const sold = myOrders().filter(o => ['released', 'completed'].includes(o.state));
  const byCat = {};
  sold.forEach(o => o.items.forEach(line => {
    const it = itemById(line.id); const c = it ? it.category : 'Other';
    byCat[c] = byCat[c] || { revenue: 0, n: 0 };
    byCat[c].revenue += line.price * line.qty; byCat[c].n += line.qty;
  }));
  const cats = Object.entries(byCat).sort((a, b) => b[1].revenue - a[1].revenue);
  const misses = st.misses.slice().sort((a, b) => b.count - a.count).slice(0, 10);
  const watched = interestByItem(st.events || [], myItems().filter(i => i.status === 'active')).slice(0, 5);
  app.innerHTML = dashHead('insights') + `
    <div class="cols">
      <section><h2>Your best categories</h2>
        ${cats.length ? hbars(cats.map(([c, v]) => ({ label: c, value: v.revenue, text: `${shortMoney(v.revenue)} · ${v.n}` })), shortMoney)
          + `<p class="hint">${tr('Sales and items sold, after the buyer has it.')}</p>`
          : '<p class="muted">Shows up after your first sale.</p>'}
        <h2 style="margin-top:24px">Most watched</h2>
        ${watched.length ? hbars(watched.map(r => ({ label: r.item.title, value: r.view + r.save + r.question + r.cart })), String)
          + `<p class="hint">${tr('Views, saves, questions and carts.')}</p>` : '<p class="muted">Nothing yet.</p>'}
      </section>
      <section><h2>What buyers on Trove want</h2>
        <p class="hint">From every buyer's Wanted posts and searches that found nothing.</p>
        ${st.wants.length || misses.length ? `<ul>${st.wants.map(w => `<li>${esc(w.what)}${w.max ? ` · ≤ ${money(w.max)}` : ''}</li>`).join('')}
          ${misses.map(m => `<li>“${esc(m.q)}”${m.count > 1 ? ` · ×${m.count}` : ''}</li>`).join('')}</ul>` : '<p class="muted">Nothing yet.</p>'}
      </section>
    </div>`;
}

// Who is interested in what: open questions first, then every listing people are looking at, with names.
function renderDashInterest() {
  const st = S();
  const qs = [];
  myItems().forEach(it => (it.questions || []).forEach((q, i) => qs.push({ it, q, i })));
  qs.sort((a, b) => b.q.at - a.q.at);
  const open = qs.filter(x => !x.q.a), done = qs.filter(x => x.q.a);
  const qCard = ({ it, q, i }) => `<div class="todo">
    <header><a href="#/item/${it.id}">${esc(it.title)}</a>${q.a ? '' : `<span class="chip orange">${tr('Needs an answer')}</span>`}</header>
    <p><b>${esc(q.q)}</b></p>
    ${q.a ? `<p>${esc(q.a)}</p>` : `<form data-form="answer" data-id="${it.id}" data-i="${i}" class="row"><input name="a" required style="flex:1;min-width:180px" aria-label="Your answer"><button type="submit">Answer</button></form>`}
  </div>`;
  const verb = { save: 'saved', question: 'asked', cart: 'added to cart' };
  const rows = interestByItem(st.events || [], myItems().filter(i => ['active', 'reserved'].includes(i.status)));
  const count = (n, one, many) => n ? `<span class="stat"><b>${n}</b> <span>${tr(n === 1 ? one : many)}</span></span>` : '';
  app.innerHTML = dashHead('interest') + `
    ${open.length ? `<h2>Questions to answer</h2>${open.map(qCard).join('')}` : ''}
    <h2 style="margin-top:${open.length ? 24 : 0}px">Who's interested</h2>
    ${rows.length ? rows.map(r => `<div class="todo interest">
      <a class="thumb" href="#/item/${r.item.id}">${photo(r.item)}</a>
      <div><a href="#/item/${r.item.id}"><b>${esc(r.item.title)}</b></a> <span class="muted">${money(r.item.price)}</span>
        <div class="stats">${count(r.view, 'view', 'views')}${count(r.save, 'save', 'saves')}${count(r.question, 'question', 'questions')}${count(r.cart, 'in a cart', 'in carts')}</div>
        ${r.people.length ? `<div class="people">${r.people.map(x => `<span class="chip"><b>${esc(x.who === 'guest' ? tr('A guest') : x.who)}</b> <span>${tr(verb[x.kind] || x.kind)}</span></span>`).join('')}</div>` : ''}
      </div></div>`).join('') : '<p class="muted">Nothing yet.</p>'}
    ${done.length ? `<details style="margin-top:20px"><summary><b>${tr('Answered questions')}</b> ${done.length}</summary>${done.map(qCard).join('')}</details>` : ''}`;
}

function renderDashProfile() {
  const s = me();
  app.innerHTML = dashHead('profile') + `
    <form data-form="profile" style="max-width:560px">
      <label class="f"><span>Shop name</span><input name="name" required maxlength="40" value="${esc(s.name)}"></label>
      <label class="f"><span>City</span><input name="city" maxlength="40" value="${esc(s.city)}"></label>
      <label class="f"><span>About</span><small>Shown on your profile.</small><textarea name="about" maxlength="400">${esc(s.about)}</textarea></label>
      <div class="row"><button type="submit">Save</button><a href="#/seller/${s.id}">View profile</a></div>
    </form>`;
}

// ---------- routing ----------

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean), params: Object.fromEntries(new URLSearchParams(qs || '')) };
}

function updateCounts() {
  const st = S();
  const c = st.cart.length, n = st.inbox.filter(x => !x.read).length;
  document.getElementById('cartCount').innerHTML = c ? `<span class="count">${c}</span>` : '';
  document.getElementById('inboxCount').innerHTML = n ? `<span class="count">${n}</span>` : '';
  const off = st.clockDays;
  document.getElementById('clock').textContent = off ? `${fmtDate(Store.now())} (+${off})` : '';
}

function route() {
  sweepAll();
  const { parts, params } = parseHash();
  const [a, b, c] = parts;
  const navKey = a === 'sell' && b === 'new' ? 'sellnew' : a || '';
  document.querySelectorAll('nav.main>a').forEach(el => {
    if (el.dataset.nav === navKey) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
  });
  document.getElementById('menu').open = false;
  document.getElementById('browseMenu').open = false;
  applyLook();
  renderBrowseMenu();
  if (!a) renderBrowse(params);
  else if (a === 'item') renderItem(b);
  else if (a === 'seller') renderSeller(b);
  else if (a === 'cart') renderCart();
  else if (a === 'checkout') renderCheckout();
  else if (a === 'order') renderOrder(b);
  else if (a === 'orders') renderOrders();
  else if (a === 'inbox') renderInbox();
  else if (a === 'wanted') renderWanted(params);
  else if (a === 'settings') renderSettings();
  else if (a === 'help') renderHelp();
  else if (a === 'legal') renderLegal();
  else if (a === 'sell') renderListingForm(b === 'edit' ? c : null);
  else if (a === 'dashboard') ({ schedule: renderDashSchedule, listings: renderDashListings, interest: renderDashInterest, questions: renderDashInterest,
    money: renderDashMoney, insights: renderDashInsights, profile: renderDashProfile }[b] || renderDashTodo)();
  else app.innerHTML = '<h1>Page not found</h1><p><a href="#/">Back</a></p>';
  // One view per visit to a listing, not per re-render
  if (a === 'item' && itemById(b) && lastViewed !== b) { track(b, 'view'); remember(b); save(); }
  lastViewed = a === 'item' ? b : null;
  updateCounts();
  translatePage(document.body);
  if (!a && tourAt < 0 && !S().prefs.tourDone) setTimeout(startTour, 350);
}
let lastViewed = null;

// ---------- first-visit tour ----------

const TOUR = [
  ['#hero', 'Welcome to Trove. No fees for buyers or sellers, and your payment is held until you have the item.'],
  ['#searchForm', 'Search anything. Try “lamp under $30”.'],
  ['#browseMenu summary', 'Browse by type or price here, or show more per row.'],
  ['#app .card', 'Tap an item for photos, flaws and questions.'],
  ['nav.main a.sell', 'Post something for sale: add photos and a price, then share the link.'],
  ['nav.main a[data-nav=dashboard]', 'Your dashboard: sales, interested buyers and meetups.'],
  ['#menu summary', 'Your orders, alerts, Wanted posts, settings and 中文 are here.'],
  [null, "That's it. Happy hunting!"],
];
let tourAt = -1;
const tourNext = (i, dir) => { while (i >= 0 && i < TOUR.length && TOUR[i][0] && !document.querySelector(TOUR[i][0])) i += dir; return i; };

function startTour() {
  if (tourAt >= 0 || parseHash().parts.length) return;
  document.getElementById('menu').open = false;
  tourAt = tourNext(0, 1);
  showTourStep();
}

function endTour() {
  tourAt = -1;
  document.querySelectorAll('.tour-focus').forEach(el => el.classList.remove('tour-focus'));
  const box = document.getElementById('tour');
  if (box) box.remove();
  if (!S().prefs.tourDone) { S().prefs.tourDone = true; save(); }
}

function showTourStep() {
  document.querySelectorAll('.tour-focus').forEach(el => el.classList.remove('tour-focus'));
  if (tourAt < 0 || tourAt >= TOUR.length) { endTour(); return; }
  const [sel, text] = TOUR[tourAt];
  const el = sel && document.querySelector(sel);
  if (el) { el.classList.add('tour-focus'); el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }); }
  else window.scrollTo(0, 0);
  let box = document.getElementById('tour');
  if (!box) {
    box = document.createElement('div');
    box.id = 'tour'; box.className = 'tour'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Tour');
    document.body.appendChild(box);
  }
  const last = tourAt === TOUR.length - 1, first = tourNext(tourAt - 1, -1) < 0;
  box.innerHTML = `<div class="tour-dots" aria-hidden="true">${TOUR.map((x, i) => `<i class="${i === tourAt ? 'on' : ''}"></i>`).join('')}</div>
    <p class="tour-text">${esc(text)}</p>
    <div class="row">${last ? '' : '<button type="button" class="ghost small" data-tour="skip">Skip</button>'}
      <span style="flex:1"></span>
      ${first ? '' : '<button type="button" class="ghost small" data-tour="back">Back</button>'}
      <button type="button" class="small" data-tour="next">${last ? 'Done' : 'Next'}</button></div>`;
  translatePage(box);
  box.querySelector('[data-tour=next]').focus({ preventScroll: true });
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-tour]');
  if (!b) return;
  const k = b.dataset.tour;
  if (k === 'skip') endTour();
  else if (k === 'back') { const j = tourNext(tourAt - 1, -1); if (j >= 0) { tourAt = j; showTourStep(); } }
  else { tourAt = tourNext(tourAt + 1, 1); showTourStep(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && tourAt >= 0) endTour(); });
document.getElementById('tourLink').addEventListener('click', e => {
  e.preventDefault();
  S().prefs.heroHidden = false; save();
  if (parseHash().parts.length || location.hash.includes('?')) location.hash = '#/'; else route();
  setTimeout(startTour, 350);
});

let lastPath = null;
window.addEventListener('hashchange', () => {
  const p = parseHash().parts.join('/');
  if (tourAt >= 0) endTour();
  route();
  if (p !== lastPath) { window.scrollTo(0, 0); app.focus({ preventScroll: true }); }
  lastPath = p;
});

// ---------- events ----------

document.getElementById('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('q').value.trim();
  location.hash = q ? '#/?q=' + encodeURIComponent(q) : '#/';
});
document.getElementById('skipDay').addEventListener('click', () => {
  S().clockDays++; save(); route();
  toast('Clock moved a day. Deadlines applied.');
});
document.getElementById('resetDemo').addEventListener('click', e => {
  if (!confirmTap(e.currentTarget)) return;
  Store.reset(); location.hash = '#/'; route(); toast('Demo reset.');
});
document.getElementById('langBtn').addEventListener('click', () => {
  S().prefs.lang = lang() === 'zh' ? 'en' : 'zh'; save(); route();
});
document.addEventListener('click', e => {
  document.querySelectorAll('details.menu, details.look').forEach(m => { if (m.open && !m.contains(e.target)) m.open = false; });
  const lk = e.target.closest('[data-look]');
  if (lk) {
    const pr = S().prefs;
    pr[lk.dataset.look] = lk.dataset.v;
    // Button colours are drawn for light pages, so picking one on a dark or device-matched page switches to white
    if (lk.dataset.look === 'btn' && ['auto', 'dark', undefined].includes(pr.bg)) pr.bg = 'white';
    save(); applyLook();
  }
  const dn = e.target.closest('[data-density]');
  if (dn) { e.preventDefault(); S().prefs.density = S().prefs.density === 'compact' ? 'large' : 'compact'; save(); route(); }
});

app.addEventListener('change', e => {
  const t = e.target, f = t.form;
  if (t.dataset.actChange === 'seller') { S().actingSeller = t.value; save(); route(); return; }
  if (t.id === 'bulkInput') { addDrafts(t.files); t.value = ''; return; }
  if (!f) return;
  if (f.dataset.form === 'filters') {
    const q = new URLSearchParams();
    for (const [k, v] of new FormData(f)) if (v) q.set(k, v);
    location.hash = '#/?' + q.toString();
  }
  if (f.dataset.form === 'choice') {
    const fd = new FormData(f);
    S().checkout = { fulfilment: fd.get('fulfilment'), payment: fd.get('payment') || 'online' };
    save(); route();
  }
  if (t.id === 'photoInput') { addPhotos(t.files); t.value = ''; }
  if (t.id === 'catSelect') document.getElementById('ageFields').hidden = !['Antiques', 'Collectibles'].includes(t.value) && !f.era.value;
});

app.addEventListener('dragover', e => { const d = e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
app.addEventListener('dragleave', e => { const d = e.target.closest('.drop'); if (d) d.classList.remove('over'); });
app.addEventListener('drop', e => {
  const d = e.target.closest('.drop');
  if (!d) return;
  e.preventDefault(); d.classList.remove('over');
  if (d.id === 'bulkZone') addDrafts(e.dataTransfer.files); else addPhotos(e.dataTransfer.files);
});

app.addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.dataset.id, st = S();
  switch (btn.dataset.act) {
    case 'addCart':
      if (!st.cart.some(c => c.id === id)) { st.cart.push({ id, qty: 1 }); track(id, 'cart'); }
      save(); toast('Added to cart.'); route(); break;
    case 'removeCart': st.cart = st.cart.filter(c => c.id !== id); save(); route(); break;
    case 'fav':
      if (st.favs.includes(id)) st.favs = st.favs.filter(x => x !== id); else { st.favs = st.favs.concat(id); track(id, 'save'); }
      save(); route(); break;
    case 'share': shareLink(btn.dataset.path, btn.dataset.title); break;
    case 'tour': startTour(); break;
    case 'hideHero': st.prefs.heroHidden = true; save(); route(); toast('Hidden. Bring it back from Menu, Take the tour.'); break;
    case 'density': st.prefs.density = st.prefs.density === 'compact' ? 'large' : 'compact'; save(); route(); break;
    case 'jump': { e.preventDefault(); const el = document.getElementById(btn.dataset.to); if (el) el.scrollIntoView({ block: 'start' }); break; }
    case 'dropDraft':
      if (!confirmTap(btn)) return;
      st.items = st.items.filter(i => i.id !== id); save(); route(); break;
    case 'thumb':
      document.getElementById('mainPh').innerHTML = photo(itemById(parseHash().parts[1]), Number(btn.dataset.i));
      document.querySelectorAll('.thumbs button').forEach(b => b.setAttribute('aria-pressed', b === btn)); break;
    case 'dropPhoto': e.preventDefault(); pendingPhotos.splice(Number(btn.dataset.i), 1); drawPreviews(); break;
    case 'coverPhoto': e.preventDefault(); pendingPhotos.unshift(...pendingPhotos.splice(Number(btn.dataset.i), 1)); drawPreviews(); break;
    case 'confirm': if (act(id, 'confirm', 'buyer')) { toast('Thanks! The seller has been paid.'); route(); } break;
    case 'cancelBuyer': if (confirmTap(btn) && act(id, 'cancel', 'buyer')) route(); break;
    case 'cancelSeller': if (confirmTap(btn) && act(id, 'cancel', 'seller')) route(); break;
    case 'scan': if (act(id, 'delivered_scan', 'carrier')) route(); break;
    case 'resolveRelease': if (act(id, 'resolve_release', 'seller')) route(); break;
    case 'resolveRefund': if (confirmTap(btn) && act(id, 'resolve_refund', 'seller')) route(); break;
    case 'hide': itemById(id).status = 'hidden'; save(); route(); break;
    case 'unhide': itemById(id).status = 'active'; save(); route(); break;
    case 'csv': download(`trove-${me().name.replace(/\W+/g, '-').toLowerCase()}-${new Date(Store.now()).toISOString().slice(0, 10)}.csv`, ordersCsv(myOrders()), 'text/csv'); break;
    case 'exportData':
      download('trove-my-data.json', JSON.stringify({ details: st.me, orders: st.orders, wanted: st.wants, alerts: st.inbox, settings: st.prefs }, null, 2), 'application/json'); break;
    case 'deleteData':
      if (!confirmTap(btn)) return;
      Object.assign(st, { me: { name: '', email: '' }, orders: [], inbox: [], wants: [], favs: [], cart: [], recent: [], prefs: { ...st.prefs, buyer: 'essentials', seller: 'essentials', marketing: false } });
      save(); toast('Deleted.'); route(); break;
  }
});

app.addEventListener('submit', async e => {
  const f = e.target;
  if (!f.dataset.form) return;
  e.preventDefault();
  const st = S(), id = f.dataset.id, fd = new FormData(f);
  switch (f.dataset.form) {
    case 'checkout': placeOrder(f); break;
    case 'report': {
      let photos = [];
      try { photos = await Promise.all(Array.from(f.photos.files).slice(0, 4).map(x => readImage(x, 700))); } catch (err) { toast("A photo couldn't be read."); return; }
      if (act(id, 'report', 'buyer', { reason: fd.get('reason').trim() })) {
        if (photos.length) { const o = orderById(id); o.problem = { ...o.problem, photos }; save(); }
        route();
      }
      break;
    }
    case 'handoff': if (act(id, 'handoff', 'seller', { code: fd.get('code').replace(/\s/g, '') })) { toast('Handoff confirmed.'); route(); } break;
    case 'ship': {
      const file = f.pack.files[0];
      let packPhoto = null;
      if (file) { try { packPhoto = await readImage(file, 500); } catch (err) { toast("That photo couldn't be read."); return; } }
      if (act(id, 'ship', 'seller', { tracking: fd.get('tracking').trim(), labelCost: cents(fd.get('label') || 0), packPhoto })) { toast('Shipped. The buyer has been told.'); route(); }
      break;
    }
    case 'listing': saveListing(f); break;
    case 'ask': {
      const it = itemById(id);
      (it.questions = it.questions || []).push({ q: fd.get('q').trim(), a: '', at: Store.now() });
      track(id, 'question');
      st.inbox.unshift({ at: Store.now(), to: 'seller', text: `New question on “${it.title}”.`, sellerId: it.sellerId, read: false });
      save(); toast('Sent.'); route(); break;
    }
    case 'answer': itemById(id).questions[Number(f.dataset.i)].a = fd.get('a').trim(); save(); route(); break;
    case 'want': {
      const what = fd.get('what').trim(), max = fd.get('max') ? cents(fd.get('max')) : null;
      st.wants.unshift({ what, max, email: fd.get('email') || null, at: Store.now() });
      if (fd.get('email') && !st.me.email) st.me.email = fd.get('email');
      save();
      const already = search(st.items, what, max ? { maxPrice: max } : {}).results.length;
      if (already) { toast('Posted. Some are already listed, showing them now.'); location.hash = '#/?q=' + encodeURIComponent(what); }
      else { toast("Posted. You'll get an alert when it's listed."); route(); }
      break;
    }
    case 'prefs':
      st.prefs = { ...st.prefs, buyer: fd.get('buyer'), seller: fd.get('seller'), marketing: !!fd.get('marketing'), lang: fd.get('lang') || 'en' };
      save(); route(); toast('Saved.'); break;
    case 'profile':
      Object.assign(me(), { name: fd.get('name').trim(), city: fd.get('city').trim(), about: fd.get('about').trim() });
      save(); toast('Saved.'); route(); break;
  }
});

Store.get();
route();
