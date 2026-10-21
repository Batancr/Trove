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
  const W = 80, H = 140, top = 20, bw = 36;
  const bars = rows.map((r, i) => {
    const h = Math.round(r.value / max * H), x = i * W + (W - bw) / 2, y = top + H - h;
    return `<rect class="bar${r.value ? '' : ' zero'}" x="${x}" y="${r.value ? y : top + H - 2}" width="${bw}" height="${r.value ? h : 2}" rx="4"><title>${esc(r.label)}: ${esc(fmt(r.value))}</title></rect>
      ${r.value ? `<text class="val" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${esc(fmt(r.value))}</text>` : ''}
      <text x="${x + bw / 2}" y="${top + H + 16}" text-anchor="middle">${esc(r.label)}</text>`;
  }).join('');
  return `<svg class="chart bars" viewBox="0 0 ${rows.length * W} ${top + H + 22}" role="img" aria-label="${esc(title)}">${bars}
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
  bg: [['peach', 'Light peach', '#fff0e2'], ['white', 'White', '#ffffff'], ['cream', 'Cream', '#fdf5e8'], ['blue', 'Light blue', '#eaf3fc'], ['dark', 'Dark', '#15171a'], ['auto', 'Match device', 'linear-gradient(135deg,#fff0e2 50%,#15171a 50%)']],
  btn: [['orange', 'Creamy orange', '#ffcb98'], ['cream', 'Light cream', '#ffe6cc'], ['navy', 'Navy', '#2f5f8a'], ['ink', 'Charcoal', '#1f2328'], ['sage', 'Sage', '#cfe3d4']],
};
function applyLook() {
  const pr = S().prefs, el = document.documentElement;
  // A light colour choice forces the light theme so it shows even when the device is in dark mode
  // Default for every first visit: light peach with creamy orange buttons, even on devices set to dark mode
  const bg = pr.bg || 'peach';
  el.dataset.bg = bg === 'auto' ? 'peach' : bg; el.dataset.btn = pr.btn || 'orange';
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
  deliver: (o, e) => o.digital && o.digital.kind === 'session' ? 'Session held. The buyer has 2 days to report a problem.' : `Delivered${e.note ? ': ' + esc(e.note) : ''}. The buyer has 2 days to check it.`,
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
        <div><h1>No Trove fees.</h1><p class="lede">Buyers pay only the price and any delivery. Cash and e-Transfer are free; card and PayPal have a small processing fee that comes out of the sale.</p></div></div>
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
  const extra = { digital: false };
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
  const recent = home ? (st.recent || []).map(itemById).filter(it => it && it.status === 'active' && !isDigital(it)).slice(0, 8) : [];
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
  if (isDigital(it)) { renderDigitalItem(it); return; }
  const st = S();
  const seller = sellerById(it.sellerId);
  const stats = sellerStats(mainOrders(), seller.id);
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
        <p class="muted" style="margin-top:4px"><span>${tr('Accepts')}</span> ${(seller.payMethods || ALL_METHODS).map(m => `<span>${tr(PAY_METHODS[m].label)}</span>`).join(' · ')}</p>
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
        <a class="seller" href="#/digital?seller=${seller.id}">${avatar(seller)}
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

// ---------- Trove Digital: services, downloads and game items ----------
// Same accounts, cart-free checkout, same dashboard. Money is held until the session happens or the buyer has the file or item.

const kindLabel = it => it.digital === 'session' ? `${tr('Session')} · ${it.durationMin} min` : tr(DIGITAL_KINDS[it.digital].label);

function digitalCard(it) {
  const seller = sellerById(it.sellerId);
  return `<a class="card dcard" href="#/item/${it.id}">
    <div class="ph">${photo(it)}<span class="kind k-${it.digital}">${esc(kindLabel(it))}</span></div>
    <h3>${esc(it.title)}</h3>
    <div class="price">${money(it.price)}</div>
    <div class="meta">${esc(seller ? seller.name : '')}</div>
  </a>`;
}

function renderDigital(params) {
  const st = S();
  const q = params.q || '', cat = params.cat || '', sellerF = params.seller || '';
  const extra = { digital: true };
  if (cat) extra.category = cat;
  let { results } = search(st.items, q, extra, q ? 'best' : 'newest');
  if (sellerF) results = results.filter(i => i.sellerId === sellerF);
  const home = !q && !cat && !sellerF;
  const sellerName = sellerF ? (sellerById(sellerF) || {}).name : '';
  const compact = st.prefs.density === 'compact';
  const grid = list => `<div class="grid${compact ? ' compact' : ''}">${list.map(digitalCard).join('')}</div>`;
  app.innerHTML = digitalNav('browse') + `
    <section class="dhero">
      <div><p class="eyebrow">Trove Digital</p>
        <h1>Lessons, advice, downloads and game items.</h1>
        <p class="lede">Still no fees. Your money is held until the session happens or you have what you paid for.</p></div>
      <form class="dsearch" data-form="dsearch" role="search"><label class="sr" for="dq">Search Trove Digital</label>
        <input id="dq" name="q" type="search" placeholder="Search lessons, guides, game items" value="${esc(q)}"><button type="submit">Search</button></form>
      <nav class="cats" aria-label="Types"><a href="#/digital" ${home ? 'aria-current="true"' : ''}>All</a>${DIGITAL_CATEGORIES.map(c => `<a href="#/digital?cat=${encodeURIComponent(c)}" ${cat === c ? 'aria-current="true"' : ''}>${esc(c)}</a>`).join('')}</nav>
    </section>
    ${home ? `<div class="dhow">
      <div><b>${tr('Sessions')}</b><span>${tr('Book a time. The seller is paid after the session.')}</span></div>
      <div><b>${tr('Downloads')}</b><span>${tr('Delivered after you pay, with 2 days to check it.')}</span></div>
      <div><b>${tr('Game items')}</b><span>${tr('Traded in the game. Only for games whose rules allow it.')}</span></div></div>` : ''}
    ${q ? `<p class="muted"><span>${results.length}</span> <span>${tr('results for')}</span> “${esc(q)}”</p>` : ''}
    ${sellerName ? `<h2 class="sub">${esc(sellerName)}</h2>` : ''}
    ${results.length ? (home ? `<section class="shelf"><div class="shelf-head"><h2 class="sub">${tr('Newest')}</h2></div>${grid(results)}</section>` : grid(results))
      : `<div class="panel" style="max-width:520px"><h2>Nothing yet</h2><p>Try another word, or browse all of Trove Digital.</p><a class="btn" href="#/digital">See everything</a></div>`}
    <section class="panel dsell"><div><h2>Sell what you know</h2><p class="muted">Lessons, appraisals, guides and game items go on the same shop and dashboard as everything else you sell.</p></div>
      <a class="btn" href="#/digital/selling">Start selling</a></section>`;
}

// Trove Digital's own sub-tabs: browse, what you bought, what you sell.
function digitalNav(cur) {
  const t = (id, href, label) => `<a href="${href}" ${cur === id ? 'aria-current="true"' : ''}>${label}</a>`;
  return `<nav class="dnav" aria-label="Trove Digital">${t('browse', '#/digital', 'Browse')}${t('orders', '#/digital/orders', 'My purchases')}${t('selling', '#/digital/selling', 'Selling')}</nav>`;
}
const digitalOrders = () => S().orders.filter(o => o.digital);
const digitalAlerts = to => S().inbox.filter(n => n.to === to && isDigitalAlert(n));

function renderDigitalOrders() {
  const st = S();
  const mine = digitalOrders().filter(o => o.id.startsWith('T-'));   // orders placed in this browser; the rest are example sales
  const alerts = digitalAlerts('buyer').slice(0, 8);
  app.innerHTML = digitalNav('orders') + `<h1>My purchases</h1>
    ${mine.length ? `<div class="tablewrap"><table><thead><tr><th>Order</th><th>What</th><th>Status</th><th class="num">Total</th></tr></thead>
      <tbody>${mine.map(o => `<tr><td><a href="#/order/${o.id}">${esc(o.id)}</a><br><span class="muted">${fmtDate(o.createdAt, false)}</span></td>
        <td>${o.items.map(i => esc(i.title)).join('<br>')}<br><span class="chip">${esc(tr(DIGITAL_KINDS[o.digital.kind].label))}</span>${o.digital.kind === 'session' ? ` <span class="muted">${esc(fmtDate(o.digital.at))}</span>` : ''}</td>
        <td>${esc(STATES[o.state].label)}</td><td class="num">${money(o.total)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="panel" style="max-width:520px"><p>Nothing bought on Trove Digital yet.</p><a class="btn" href="#/digital">Browse</a></div>`}
    ${alerts.length ? `<h2 style="margin-top:28px">Alerts</h2><ul class="timeline">${alerts.map(n => `<li><time>${fmtDate(n.at)}</time><span>${esc(tr(n.text))}</span> <a href="#/order/${n.orderId}">View</a></li>`).join('')}</ul>` : ''}`;
  alerts.forEach(n => { n.read = true; }); save();
}

function renderDigitalSelling() {
  const st = S();
  const sellers = st.sellers.filter(s => st.items.some(i => i.sellerId === s.id && isDigital(i)));
  if (!sellers.some(s => s.id === st.digitalSeller)) st.digitalSeller = (sellers[0] || st.sellers[0]).id;
  const sid = st.digitalSeller, me = sellerById(sid);
  const orders = digitalOrders().filter(o => o.sellerId === sid);
  const items = st.items.filter(i => i.sellerId === sid && isDigital(i)).sort((a, b) => b.listedAt - a.listedAt);
  const open = orders.filter(o => ['paid_held', 'problem', 'delivered'].includes(o.state))
    .sort((a, b) => (b.state === 'problem') - (a.state === 'problem') || (a.digital.at || a.shipBy) - (b.digital.at || b.shipBy));
  const done = orders.filter(o => o.closedAt);
  const sum = list => list.reduce((s, o) => s + o.subtotal, 0);
  const qs = [];
  items.forEach(it => (it.questions || []).forEach((q, i) => { if (!q.a) qs.push({ it, q, i }); }));
  const status = { active: 'For sale', hidden: 'Hidden', sold: 'Sold' };
  app.innerHTML = digitalNav('selling') + `
    <div class="row" style="justify-content:space-between;align-items:flex-end;margin-bottom:6px">
      <div><h1 style="margin:0">Selling on Trove Digital</h1>
        <label class="muted" style="font-size:.9rem">Demo, viewing as <select data-act-change="dseller" aria-label="Seller">${sellers.map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label></div>
      <a class="btn" href="#/sell/new?kind=session">+ <span>New listing</span></a></div>
    <div class="tiles" style="margin-top:16px">
      <div class="tile"><span>${tr('Earned')}</span><b>${money(sum(done))}</b></div>
      <div class="tile"><span>${tr('Held for you')}</span><b>${money(sum(open))}</b></div>
      <div class="tile"><span>${tr('Sales')}</span><b>${done.length}</b></div>
      <div class="tile"><span>${tr('Listings')}</span><b>${items.filter(i => i.status === 'active').length}</b></div>
    </div>
    <div class="sechead"><h2>To do</h2><span class="muted">${open.length} ${tr(open.length === 1 ? 'order' : 'orders')}</span></div>
    ${open.length ? open.map(todoCard).join('') : '<p class="muted">Nothing to do.</p>'}
    ${qs.length ? `<h2>Questions</h2>${qs.map(({ it, q, i }) => `<div class="todo"><header><a href="#/item/${it.id}">${esc(it.title)}</a><span class="chip orange">${tr('Needs an answer')}</span></header>
      <p><b>${esc(q.q)}</b></p><form data-form="answer" data-id="${it.id}" data-i="${i}" class="row"><input name="a" required style="flex:1;min-width:180px" aria-label="Your answer"><button type="submit">Answer</button></form></div>`).join('')}` : ''}
    <h2>Listings</h2>
    ${items.length ? `<div class="tablewrap"><table><tbody>${items.map(it => `<tr><td><a href="#/item/${it.id}">${esc(it.title)}</a><br><span class="muted">${esc(kindLabel(it))}</span></td>
      <td class="num">${money(it.price)}</td><td>${esc(tr(status[it.status] || it.status))}</td>
      <td class="num"><a href="#/sell/edit/${it.id}">Edit</a>${it.status === 'active' ? ` <button type="button" class="ghost small" data-act="hide" data-id="${it.id}">Hide</button>` : it.status === 'hidden' ? ` <button type="button" class="ghost small" data-act="unhide" data-id="${it.id}">Show</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="muted">No listings yet.</p>'}`;
  digitalAlerts('seller').forEach(n => { if (n.sellerId === sid) n.read = true; }); save();
}

// Session times grouped by day, as radio buttons.
function slotPicker(it) {
  const slots = openSlots(it, S().orders, Store.now()).slice(0, 18);
  if (!slots.length) return `<p class="notice">${tr('No times free right now. Ask the seller below.')}</p>`;
  const byDay = {};
  slots.forEach(t => { const k = dayKey(new Date(t)); (byDay[k] = byDay[k] || []).push(t); });
  return `<fieldset class="slots"><legend><b>${tr('Pick a time')}</b></legend>${Object.entries(byDay).map(([k, list]) => {
    const [y, m, d] = k.split('-').map(Number);
    return `<div class="sday"><span>${esc(new Date(y, m - 1, d).toLocaleDateString(lang() === 'zh' ? 'zh-CN' : 'en-CA', { weekday: 'short', month: 'short', day: 'numeric' }))}</span>
      ${list.map((t, i) => `<label class="slotbtn"><input type="radio" name="slot" value="${t}" ${t === slots[0] ? 'checked' : ''} required><span>${esc(timeOnly(t))}</span></label>`).join('')}</div>`;
  }).join('')}</fieldset>`;
}

function renderDigitalItem(it) {
  const st = S();
  const seller = sellerById(it.sellerId);
  const stats = sellerStats(digitalOrders(), seller.id);
  const qa = it.questions || [];
  const who = st.me;
  const others = st.items.filter(x => x.sellerId === seller.id && x.id !== it.id && x.status === 'active' && isDigital(x)).slice(0, 4);
  const promise = { session: "Paid now, held until the session is over. If it doesn't happen, you get it back.",
    download: 'Paid now, held for 2 days after delivery so you can check it.',
    ingame: 'Paid now, held until you confirm the item arrived in your game.' }[it.digital];
  app.innerHTML = `
    <p class="crumb"><a href="#/digital">Trove Digital</a> / <a href="#/digital?cat=${encodeURIComponent(it.category)}">${esc(it.category)}</a></p>
    <div class="cols">
      <div class="gallery"><div class="main-ph" id="mainPh">${photo(it)}</div></div>
      <div>
        <h1>${esc(it.title)}</h1>
        <div class="bigprice">${money(it.price)}</div>
        <p><span class="chip">${esc(kindLabel(it))}</span>${it.game ? ` <span class="muted">${esc(it.game)}</span>` : ''}${it.delivers ? ` <span class="muted">${esc(it.delivers)}</span>` : ''}</p>
        <p>${esc(it.description)}</p>
        ${it.status === 'active' ? `<form data-form="buyDigital" data-id="${it.id}" class="buybox">
          ${it.digital === 'session' ? slotPicker(it) : ''}
          ${it.digital === 'ingame' ? `<label class="f"><span>Your character name</span><small>So the seller knows who to trade with.</small><input name="character" required maxlength="40"></label>` : ''}
          <div class="row">
            <label class="f"><span>Name</span><input name="name" required autocomplete="name" value="${esc(who.name)}"></label>
            <label class="f"><span>Email</span><input name="email" type="email" required autocomplete="email" value="${esc(who.email)}"></label>
          </div>
          <button type="submit">${tr(it.digital === 'session' ? 'Book and pay' : 'Buy now')} ${money(it.price)}</button>
          <p class="protect"><span>${tr(promise)}</span> <span class="muted">${tr('Demo: nothing is charged.')}</span></p>
        </form>` : `<p class="notice">${tr('Not available right now.')}</p>`}
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
    </div>
    ${others.length ? `<h2 class="sub" style="margin-top:28px"><span>${tr('More from')}</span> ${esc(seller.name)}</h2>
      <div class="grid">${others.map(digitalCard).join('')}</div>` : ''}`;
}

function buyDigital(form) {
  const st = S();
  const it = itemById(form.dataset.id);
  const fd = new FormData(form);
  st.me = { name: fd.get('name').trim(), email: fd.get('email').trim() };
  const slot = fd.get('slot') ? Number(fd.get('slot')) : null;
  if (it.digital === 'session' && !openSlots(it, st.orders, Store.now()).includes(slot)) { toast('That time was just taken. Pick another.'); route(); return; }
  let order;
  try {
    order = createOrder({ id: Store.nextOrderId(), sellerId: it.sellerId, items: [{ ...it, qty: 1 }],
      buyer: { ...st.me, character: (fd.get('character') || '').trim() || undefined }, fulfilment: 'digital', payment: 'online',
      slot, now: Store.now(), checkMinimum: false });
  } catch (e) { toast(e.message); return; }
  st.orders.unshift(order);
  notify('paid', order);
  // Downloads with a file attached are delivered straight away
  if (it.digital === 'download' && it.instant) {
    const i = st.orders.indexOf(order);
    st.orders[i] = transition(order, 'deliver', 'system', Store.now(), { note: it.instant });
    notify('deliver', st.orders[i]);
  }
  save();
  location.hash = '#/order/' + order.id;
  toast(it.digital === 'session' ? 'Booked. Your money is held until the session is over.' : 'Paid. Your money is held until you have it.');
}

// What the buyer sees on a digital order: the session time, the file, or the in-game handover.
function digitalPanel(o) {
  const d = o.digital, it = itemById(o.items[0].id) || {};
  if (d.kind === 'session') {
    return `<div class="panel dpanel" style="margin-bottom:20px"><h2>${tr('Your session')}</h2>
      <p class="code" style="font-size:1.4rem;letter-spacing:0">${esc(fmtDate(d.at))}</p>
      <p style="margin:0">${it.durationMin ? `${it.durationMin} min · ` : ''}<span>${tr('The seller sends a video call link before it starts.')}</span></p></div>`;
  }
  if (d.kind === 'download') {
    return `<div class="panel dpanel" style="margin-bottom:20px"><h2>${tr('Your download')}</h2>
      ${d.delivery ? `<p class="dfile">${icon('code', 22)} <b>${esc(d.delivery.note)}</b></p><p class="hint">${tr('Demo: a real file link goes here.')}</p>`
        : `<p>${tr('The seller sends it within 2 days, or you are refunded.')}</p>`}</div>`;
  }
  return `<div class="panel dpanel" style="margin-bottom:20px"><h2>${tr('Your game item')}</h2>
    <p>${esc(d.game || '')}${o.buyer.character ? ` · <span>${tr('Character')}</span> <b>${esc(o.buyer.character)}</b>` : ''}</p>
    ${d.delivery ? `<p class="muted">${esc(d.delivery.note)}</p>` : `<p>${tr('The seller trades it to your character in the game, within 2 days.')}</p>`}</div>`;
}

// Seller side: what to do next on a digital order.
function digitalTodo(o) {
  const d = o.digital, who = esc(o.buyer.name || o.buyer.email || '');
  if (d.kind === 'session') {
    const started = Store.now() >= d.at;
    return `<p>${who} · ${esc(fmtDate(d.at))}</p>
      <p><button type="button" data-act="sessionDone" data-id="${o.id}" ${started ? '' : 'disabled'}>Mark session done</button>
      ${started ? '' : `<span class="hint">${tr('You can mark it done once it has started.')}</span>`}</p>`;
  }
  const label = d.kind === 'download' ? 'Download link or file name' : 'How you handed it over';
  return `<p>${who}${o.buyer.character ? ` · <span>${tr('Character')}</span> <b>${esc(o.buyer.character)}</b>` : ''} · <span>${tr('Deliver by')}</span> ${fmtDate(o.shipBy)}</p>
    <form data-form="deliver" data-id="${o.id}" class="row" style="align-items:flex-end">
      <label class="f" style="margin:0;flex:1;min-width:200px"><span>${label}</span><input name="note" required maxlength="200"></label>
      <button type="submit">Mark delivered</button></form>`;
}

function renderSeller(id) {
  const st = S();
  const seller = sellerById(id);
  const stats = sellerStats(mainOrders(), id);
  const items = mainItems().filter(i => i.sellerId === id);
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
  const ch = st.checkout || (st.checkout = { fulfilment: canShip ? 'ship' : 'meetup', method: 'card' });
  if (ch.fulfilment === 'ship' && !canShip) ch.fulfilment = 'meetup';
  if (ch.fulfilment !== 'ship' && !canMeet) ch.fulfilment = 'ship';
  // Only methods every seller here accepts; shipping needs one that holds the money
  const sellers = [...new Set(lines.map(i => i.sellerId))].map(sellerById).filter(Boolean);
  const methods = methodsFor(sellers, ch.fulfilment);
  if (!methods.includes(ch.method)) ch.method = methods[0] || 'card';
  ch.payment = PAY_METHODS[ch.method].payment;
  return { ch, canShip, canMeet, methods };
}

function renderCart() {
  const lines = cartLines();
  if (!lines.length) { app.innerHTML = '<h1>Cart</h1><p><span>Empty.</span> <a href="#/">Start browsing</a></p>'; return; }
  const { ch, canShip, canMeet, methods } = checkoutChoice(lines);
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
          <h2 style="margin-top:18px">Payment</h2>
          ${methods.map(m => radio('method', m, PAY_METHODS[m].label, PAY_METHODS[m].held ? 'Protected: held until you have it' : 'Paid at the meetup, not protected')).join('')}
          ${ch.fulfilment === 'ship' ? `<p class="hint">${tr('Shipped orders are paid by card or PayPal so the money is held until it arrives.')}</p>` : ''}
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
        <button type="submit">${ch.payment === 'online' ? `${tr('Pay')} ${money(t.total)} · ${tr(PAY_METHODS[ch.method].label)}` : `${tr('Reserve')} · ${tr(PAY_METHODS[ch.method].label)}`}</button>
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
        id: Store.nextOrderId(), sellerId: g.sellerId, items: g.items, buyer: { ...st.me }, fulfilment: ch.fulfilment, payment: ch.payment, method: ch.method,
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
  app.innerHTML = `${o.digital ? digitalNav('orders') : ''}
    <h1><span>${tr('Order')}</span> ${esc(o.id)}</h1>
    <p><span class="chip ${o.state === 'problem' ? 'red' : ''}">${esc(STATES[o.state].label)}</span>
      ${o.shipBy && o.state === 'paid_held' && !o.digital ? `<span class="muted"><span>${tr('Ships by')}</span> ${fmtDate(o.shipBy)}<span>${tr(", or you're refunded.")}</span></span>` : ''}
      ${o.state === 'delivered' ? `<span class="muted"><span>${tr('Money releases')}</span> ${fmtDate(o.deliveredAt + (o.digital ? CONFIG.digitalCheckDays : CONFIG.checkWindowDays) * DAY)}<span>${tr(' unless you report a problem.')}</span></span>` : ''}</p>
    ${moneyBar(o)}
    <div class="cols">
      <div>
        ${o.digital ? digitalPanel(o) : ''}
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
        <p>${o.digital ? esc(tr(DIGITAL_KINDS[o.digital.kind].label)) : o.shipping ? `${tr('Delivery')} ${money(o.shipping)}` : tr('Free pickup')}<br><b>${tr('Total')} ${money(o.total)}</b><br>
        <span class="muted"><span>${tr(PAY_METHODS[o.method || (o.payment === 'online' ? 'card' : 'cash')].label)}</span> · <span>${tr(o.payment === 'online' ? 'Paid online, protected' : 'Paying in person')}</span></span></p>
        ${o.tracking ? `<p><span>${tr('Tracking')}</span> <b>${esc(o.tracking)}</b></p>` : ''}
        ${o.packPhoto ? `<p><img class="packimg" src="${o.packPhoto}" alt="Seller's photo of the item being packed"><br><span class="hint">Packed by the seller</span></p>` : ''}
      </div>
    </div>`;
}

function renderOrders() {
  const orders = mainOrders();
  app.innerHTML = `<h1>My orders</h1>${orders.length ? `<div class="tablewrap"><table>
    <thead><tr><th>Order</th><th>Items</th><th>Status</th><th class="num">Total</th></tr></thead>
    <tbody>${orders.map(o => `<tr><td><a href="#/order/${o.id}">${esc(o.id)}</a><br><span class="muted">${fmtDate(o.createdAt, false)}</span></td>
      <td>${o.items.map(i => esc(i.title)).join('<br>')}</td><td>${esc(STATES[o.state].label)}</td><td class="num">${money(o.total)}</td></tr>`).join('')}</tbody></table></div>`
    : '<p>No orders yet.</p>'}`;
}

const isDigitalAlert = n => { const o = n.orderId && orderById(n.orderId); return !!(o && o.digital) || !!(n.itemId && isDigital(itemById(n.itemId) || {})); };
const mainInbox = () => S().inbox.filter(n => !isDigitalAlert(n));

function renderInbox() {
  const st = S(), list = mainInbox();
  app.innerHTML = `<h1>Alerts</h1>
    ${list.length ? `<ul class="timeline">${list.map(n => `<li><time>${fmtDate(n.at)} · ${tr(n.to === 'seller' ? 'as seller' : 'as buyer')}${n.read ? '' : ` · <b>${tr('new')}</b>`}</time><span>${esc(tr(n.text))}</span> <a href="#/${n.itemId ? 'item/' + n.itemId : n.to === 'seller' ? (n.orderId ? 'dashboard/todo' : 'dashboard/interest') : 'order/' + n.orderId}">View</a></li>`).join('')}</ul>` : '<p class="muted">No alerts yet.</p>'}`;
  list.forEach(n => { n.read = true; }); save(); updateCounts();
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
    <h2>Fees</h2><p>Trove charges no fee. Buyers pay the price plus delivery, shown before checkout. When a buyer pays by card or PayPal, the payment company keeps about 2.9% + 30¢, taken from the seller's payout. Cash and e-Transfer at a meetup are free.</p></div>`;
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

// Console-style layout: a sidebar of sections (grouped like a cloud dashboard), then a page header with breadcrumb and actions.
const SIDE_ICONS = {
  todo: '<path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z"/>',
  schedule: '<path d="M2.5 4h11v9.5h-11zM2.5 7h11M5.5 2v3M10.5 2v3"/>',
  listings: '<path d="M2.5 8.2V2.5h5.7l5.3 5.3-5.7 5.7z"/><circle cx="5.5" cy="5.5" r="1"/>',
  interest: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
  money: '<path d="M8 1.5v13M11 4.2H6.6a2 2 0 000 4h2.8a2 2 0 010 4H4.8"/>',
  insights: '<path d="M2 13.5h12M4.5 11V8M8 11V4M11.5 11V6.5"/>',
  pulse: '<path d="M1.5 8.5h3l1.8-4.5 3.2 9 1.8-4.5h3.2"/>',
  profile: '<path d="M2.5 6.5L3.6 2.5h8.8l1.1 4M3.2 6.5v7h9.6v-7M2.5 6.5h11M6.5 13.5v-4h3v4"/>',
  shop: '<path d="M6.5 3H3v10h10V9.5M9.5 2.5h4v4M13.5 2.5L7.5 8.5"/>',
};
const sideIcon = k => `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SIDE_ICONS[k]}</svg>`;
const DASH_PAGES = {
  todo: ['Overview', 'What needs doing, and how the shop is doing.'],
  schedule: ['Schedule', 'Meetups and ship-by dates for the next two weeks.'],
  listings: ['Listings', 'Everything you have for sale, plus drafts.'],
  interest: ['Interest', 'Questions to answer, and who is watching what.'],
  money: ['Money', 'What you earned, what is on the way, and what each sale cost.'],
  insights: ['Insights', 'What sells, when, and where buyers drop off.'],
  pulse: ['Pulse', 'The heartbeat of your shop, live. Tune what counts and move the panels around.'],
  profile: ['Profile', 'How your shop looks to buyers.'],
};

function dashHead(cur, actions = '') {
  const st = S(), sid = st.actingSeller;
  const me = st.sellers.find(s => s.id === sid) || st.sellers[0];
  const mine = myOrders();
  const n = mine.filter(o => ['paid_held', 'reserved', 'problem'].includes(o.state)).length;
  const unanswered = unansweredCount();
  const meets = scheduleByDay(mainOrders(), sid, Store.now()).reduce((s, d) => s + d.orders.length, 0);
  const drafts = myItems().filter(i => i.status === 'draft').length;
  const link = (id, c) => `<a href="#/dashboard/${id}" ${cur === id ? 'aria-current="page"' : ''}>${sideIcon(id)}<span>${DASH_PAGES[id][0]}</span>${c ? `<span class="count">${c}</span>` : ''}</a>`;
  const [title, desc] = DASH_PAGES[cur];
  return `<aside class="side" aria-label="Dashboard">
      <label class="proj"><span class="av" aria-hidden="true">${esc((me.name || '?')[0])}</span>
        <span class="pname"><small>Demo, viewing as</small><select data-act-change="seller" aria-label="Seller">${mainSellers().map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></span></label>
      <a class="btn newbtn" href="#/sell">+ <span>New listing</span></a>
      <nav aria-label="Dashboard sections">
        <h6>Selling</h6>${link('todo', n)}${link('schedule', meets)}${link('listings', drafts)}${link('interest', unanswered)}
        <h6>Analytics</h6>${link('money')}${link('insights')}${link('pulse')}
        <h6>Shop</h6>${link('profile')}<a href="#/seller/${sid}">${sideIcon('shop')}<span>View your shop</span></a>
      </nav>
    </aside>
    <div class="phead"><div><nav class="crumbs" aria-label="Breadcrumb"><span>${esc(me.name)}</span><span aria-hidden="true">/</span><span>${title}</span></nav>
      <h1>${title}</h1><p class="pdesc">${desc}</p></div>${actions ? `<div class="pact">${actions}</div>` : ''}</div>`;
}

// Latest finished orders, newest first, like an activity log.
function recentActivity() {
  const done = myOrders().filter(o => o.closedAt).sort((a, b) => b.closedAt - a.closedAt).slice(0, 6);
  if (!done.length) return '';
  return `<div class="sechead"><h2>${tr('Recent sales')}</h2><a href="#/dashboard/money">${tr('See all')}</a></div>
    <div class="tablewrap activity"><table><tbody>${done.map(o => { const p = payoutFor(o); return `<tr><td class="muted">${esc(shortDate(o.closedAt))}</td>
      <td>${o.items.map(i => esc(i.title)).join(', ')}</td><td><span class="chip">${esc(tr(o.fulfilment === 'ship' ? 'Shipped' : 'Meetup'))}</span></td>
      <td class="num">${money(o.subtotal)}</td><td class="num muted">+${money(p.profit)} ${tr('profit')}</td></tr>`; }).join('')}</tbody></table></div>`;
}

// Small area sparkline for metric cards. values: numbers, oldest first.
function spark(values, label, bars = false) {
  const W = 120, H = 32, max = Math.max(1, ...values), step = W / Math.max(1, values.length - 1);
  if (bars) {
    const bw = W / values.length;
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">${values.map((v, i) => v ? `<rect x="${(i * bw + bw * .15).toFixed(1)}" y="${(H - v / max * (H - 2)).toFixed(1)}" width="${(bw * .7).toFixed(1)}" height="${(v / max * (H - 2)).toFixed(1)}" rx="1"/>` : '').join('')}</svg>`;
  }
  const pts = values.map((v, i) => [i * step, H - 2 - v / max * (H - 4)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">
    <path class="area" d="${line}L${W} ${H}L0 ${H}Z"/><path class="ln" d="${line}"/><circle cx="${last[0]}" cy="${last[1]}" r="2.5"/></svg>`;
}

// Trove Digital is its own tab: the main site and dashboard only ever see physical items and their orders.
const mainOrders = () => S().orders.filter(o => !o.digital);
const mainItems = () => S().items.filter(i => !isDigital(i));
const myOrders = () => mainOrders().filter(o => o.sellerId === S().actingSeller);
const myItems = () => mainItems().filter(i => i.sellerId === S().actingSeller);
const mainSellers = () => S().sellers.filter(s => S().items.some(i => i.sellerId === s.id && !isDigital(i)));
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
  if (o.digital && o.state === 'paid_held') {
    body = digitalTodo(o);
  } else if (o.state === 'paid_held' && o.fulfilment === 'ship') {
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
    body = `<p class="muted"><span>${tr('Money releases')}</span> ${fmtDate(o.deliveredAt + (o.digital ? CONFIG.digitalCheckDays : CONFIG.checkWindowDays) * DAY)}</p>`;
  }
  return `<article class="todo"><header><b>${items}</b><span class="chip ${o.state === 'problem' ? 'red' : ''}">${esc(STATES[o.state].label)}</span></header>${body}
    ${['paid_held', 'reserved'].includes(o.state) ? `<p style="margin-bottom:0"><button type="button" class="ghost small" data-act="cancelSeller" data-id="${o.id}">Can't fulfil, cancel</button></p>` : ''}</article>`;
}

function renderDashTodo() {
  const open = myOrders().filter(o => ['paid_held', 'reserved', 'problem', 'shipped', 'delivered'].includes(o.state))
    .sort((a, b) => (b.state === 'problem') - (a.state === 'problem') || deadline(a) - deadline(b));
  const st = S(), now = Store.now();
  const week = weeklySales(mainOrders(), st.actingSeller, now, 1)[0];
  const next = scheduleByDay(mainOrders(), st.actingSeller, now).flatMap(d => d.orders).find(o => o.meetup.at >= now);
  const watching = interestByItem(st.events || [], myItems().filter(i => i.status === 'active')).reduce((s, r) => s + r.save + r.cart, 0);
  const N = overviewDays;
  const both = salesByDay(mainOrders(), st.actingSeller, now, N * 2);
  const days = both.slice(N), before = both.slice(0, N);
  const mineIds = new Set(myItems().map(i => i.id));
  const viewsIn = list => list.map(d => (st.events || []).filter(e => e.kind === 'view' && mineIds.has(e.itemId) && e.at >= d.start && e.at < d.end).length);
  const views = viewsIn(days), viewsBefore = viewsIn(before);
  const sum = a => a.reduce((x, y) => x + y, 0);
  const delta = (cur, prev) => { if (!prev) return ''; const p = Math.round((cur - prev) / prev * 100);
    return `<small class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}% <span>${tr('vs the period before')}</span></small>`; };
  const tile = (href, big, label, sp, d, why) => `<a class="tile" href="#/dashboard/${href}"><span>${label}</span><b>${big}</b>${d || ''}${sp || ''}${why ? `<small class="why">${tr(why)}</small>` : ''}</a>`;
  const rangeLabel = { 7: 'last 7 days', 30: 'last 30 days', 90: 'last 90 days' }[N];
  const seg = `<div class="seg" role="group" aria-label="${esc(tr('Date range'))}">${[[7, '7 days'], [30, '30 days'], [90, '90 days']].map(([d, l]) => `<button type="button" data-act="ovrange" data-days="${d}" aria-pressed="${N === d}">${tr(l)}</button>`).join('')}</div>`;
  const s = sum(days.map(d => d.total)), sb = sum(before.map(d => d.total)), c = sum(days.map(d => d.count)), cb = sum(before.map(d => d.count));
  app.innerHTML = dashHead('todo', seg) + `<div class="tiles">
      ${tile('money', money(s), `${tr('Sales')}, ${tr(rangeLabel)}`, spark(days.map(d => d.total), tr('Sales per day')), delta(s, sb), 'What buyers paid for your items.')}
      ${tile('money', c, `${tr('Orders')}, ${tr(rangeLabel)}`, spark(days.map(d => d.count), tr('Orders per day'), true), delta(c, cb), 'Finished sales, any size.')}
      ${tile('interest', sum(views), `${tr('Listing views')}, ${tr(rangeLabel)}`, spark(views, tr('Views per day')), delta(sum(views), sum(viewsBefore)), 'People opening your listings.')}
      ${tile('schedule', next ? esc(shortDate(next.meetup.at)) + ' ' + esc(timeOnly(next.meetup.at)) : '–', tr('Next meetup'), `<small class="sub">${watching} ${tr('saves and carts')} · ${unansweredCount()} ${tr('questions')}</small>`, '', 'Bring the item and check the buyer\'s code.')}
    </div>
    <div class="sechead"><h2>To do</h2><span class="muted">${open.length} ${tr(open.length === 1 ? 'order' : 'orders')}</span></div>
    ` + (open.length ? open.map(todoCard).join('') : `<p>Nothing to do.</p>
    <p class="hint">Try it: buy something as a buyer, then come back.</p>`) + recentActivity();
}

// Meetups and ship-by deadlines on a two-week strip, then day by day.
function renderDashSchedule() {
  const st = S(), now = Store.now(), loc = lang() === 'zh' ? 'zh-CN' : 'en-CA';
  const byDay = {};
  scheduleByDay(mainOrders(), st.actingSeller, now).forEach(d => d.orders.forEach(o => (byDay[d.day] = byDay[d.day] || []).push({ at: o.meetup.at, o, kind: 'meet' })));
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
        <span class="muted">${kind === 'ship' ? `<span>${tr('Ship by')}</span>` : kind === 'session' ? `${esc(o.buyer.name || '')} · <span>${tr('Online session')}</span>` : `${esc(o.buyer.name || o.buyer.email || '')} · ${esc(tr(o.meetup.place))}`}</span></span>
        <span class="chip ${kind === 'ship' ? 'orange' : ''}">${kind === 'ship' ? tr('Ship') : kind === 'session' ? tr('Session') : o.payment === 'online' ? tr('Paid online.') : `${tr('Collect')} ${money(o.total)}`}</span></a>`).join('')}`;
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
  const kind = it.digital || (!id && DIGITAL_KINDS[parseHash().params.kind] ? parseHash().params.kind : 'physical');
  const kindRadio = (v, title, desc) => `<label class="radio"><input type="radio" name="kind" value="${v}" ${kind === v ? 'checked' : ''}><span><b>${title}</b><span class="muted">${desc}</span></span></label>`;
  const days = it.availDays || [1, 2, 3, 4, 5];
  app.innerHTML = `
    ${kind !== 'physical' ? `<p class="crumb"><a href="#/digital">Trove Digital</a> / <a href="#/digital/selling">Selling</a></p>` : ''}
    <h1>${id ? (it.status === 'draft' ? 'Finish listing' : 'Edit listing') : kind !== 'physical' ? 'List on Trove Digital' : 'Sell something'}</h1>
    <form data-form="listing" data-id="${id || ''}" data-kind="${kind}" style="max-width:680px" novalidate>
      ${kind === 'physical' ? `<input type="hidden" name="kind" value="physical">` : `<fieldset class="kinds" style="border:0;padding:0;margin:0 0 16px"><legend><b>What are you selling?</b></legend>
        ${kindRadio('session', 'A session', 'Lessons, coaching or advice by video call')}
        ${kindRadio('download', 'A download', 'Guides, templates, files or custom work')}
        ${kindRadio('ingame', 'A game item', 'Handed over inside a game')}
      </fieldset>`}
      <label class="drop" id="dropZone" for="photoInput">
        <input type="file" id="photoInput" name="photos" accept="image/*" multiple>
        <b>Add photos</b><span class="muted">Tap to choose, or drag them here. Show any flaws.</span>
      </label>
      <div class="previews" id="photoPreview"></div>
      <label class="f"><span>Describe the photos in a few words</span><small>For people using screen readers.</small><input name="alt" value="${esc(it.photos && it.photos.length ? it.alt : '')}"></label>
      <label class="f"><span>Title</span><input name="title" required maxlength="80" value="${esc(it.title || '')}"></label>
      <div class="row">
        <label class="f"><span>Price ($)</span><input name="price" type="number" min="1" step="0.01" required value="${it.price ? (it.price / 100).toFixed(2) : ''}"></label>
        <label class="f" data-only="digital"><span>Type</span><select name="dcategory">${DIGITAL_CATEGORIES.map(c => `<option value="${c}" ${it.category === c ? 'selected' : ''}>${tr(c)}</option>`).join('')}</select></label>
        <label class="f" data-only="physical"><span>Category</span><select name="category" id="catSelect"><option value="" ${it.category ? '' : 'selected'} disabled>${tr('Choose')}</option>${CATEGORIES.map(c => `<option value="${c}" ${it.category === c ? 'selected' : ''}>${tr(c)}</option>`).join('')}</select></label>
      </div>
      <div data-only="digital">
        <label class="f"><span>What the buyer gets</span><small>What happens, how long it takes, what they need.</small><textarea name="ddescription" rows="3">${esc(it.digital ? it.description || '' : '')}</textarea></label>
        <div data-only="session">
          <div class="row">
            <label class="f"><span>Length (minutes)</span><input name="durationMin" type="number" min="10" step="5" value="${it.durationMin || 30}"></label>
            <label class="f"><span>Start times</span><small>Hours, e.g. 10, 14, 19</small><input name="hours" value="${esc((it.availHours || [10, 14, 19]).join(', '))}"></label>
          </div>
          <fieldset style="border:0;padding:0;margin:0 0 16px"><legend><b>Days you're free</b></legend><div class="row">
            ${WEEK_ORDER.map(d => `<label class="row" style="gap:4px"><input type="checkbox" name="days" value="${d}" ${days.includes(d) ? 'checked' : ''}> <span>${esc(dayName(d))}</span></label>`).join('')}</div>
            <small class="hint">Buyers can book these times for the next two weeks.</small></fieldset>
        </div>
        <div data-only="download">
          <label class="f"><span>What's included</span><input name="delivers" placeholder="e.g. PDF, 14 pages" value="${esc(it.delivers || '')}"></label>
          <label class="f"><span>Send a file automatically (optional)</span><small>Leave empty for custom work you deliver yourself. Demo: type a file name.</small><input name="instant" value="${esc(it.instant || '')}"></label>
        </div>
        <div data-only="ingame">
          <label class="f"><span>Game</span><input name="game" value="${esc(it.game || '')}"></label>
          <label class="row" style="margin:0 0 6px"><input type="checkbox" name="gameAllowsTrade" ${it.gameAllowsTrade ? 'checked' : ''}> <span>This game's rules allow selling this item for real money</span></label>
          <p class="hint">Many games don't allow it. Check the game's terms first. Accounts can't be sold on Trove.</p>
        </div>
      </div>
      <div data-only="physical">
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
      </div>
      <div id="formErrors"></div>
      <button type="submit">${id && it.status !== 'draft' ? 'Save' : 'Publish'}</button>
      <p class="hint"><span>${tr('Listing as')}</span> ${esc(me().name)} · <span>${tr('Free to list.')}</span></p>
    </form>`;
  drawPreviews();
  applyKind(app.querySelector('[data-form=listing]'));
}

// Shows only the fields that fit what is being sold.
function applyKind(form) {
  if (!form) return;
  const k = (form.querySelector('[name=kind]:checked') || {}).value || 'physical';
  form.dataset.kind = k;
  form.querySelectorAll('[data-only]').forEach(el => {
    const on = el.dataset.only === k || (el.dataset.only === 'digital' && k !== 'physical');
    el.hidden = !on;
  });
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
  const kind = fd.get('kind') || (existing && existing.digital) || 'physical';
  if (kind !== 'physical') { saveDigital(form, fd, existing, kind); return; }
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

function saveDigital(form, fd, existing, kind) {
  const st = S();
  const days = fd.getAll('days').map(Number);
  const hours = String(fd.get('hours') || '').split(/[^0-9.]+/).map(Number).filter(h => h >= 0 && h < 24);
  const now = new Date(Store.now()), slots = [];
  if (kind === 'session') for (let i = 1; i <= 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (days.includes(d.getDay())) hours.forEach(h => slots.push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(h), Math.round(h % 1 * 60)).getTime()));
  }
  const base = existing || { id: 'g' + Date.now(), sellerId: st.actingSeller, listedAt: Store.now(), status: 'active', questions: [], art: kind === 'session' ? 'headphones' : kind === 'download' ? 'book' : 'game', tone: '#efe7da' };
  const it = { ...base, digital: kind, title: fd.get('title').trim(), price: cents(fd.get('price') || 0), cost: cents(fd.get('cost') || 0), qty: 1,
    category: fd.get('dcategory'), description: (fd.get('ddescription') || '').trim(), photos: pendingPhotos.slice(), alt: (fd.get('alt') || '').trim(),
    durationMin: kind === 'session' ? Number(fd.get('durationMin')) || 0 : undefined, availDays: days, availHours: hours, slots: kind === 'session' ? slots : undefined,
    delivers: (fd.get('delivers') || '').trim(), instant: kind === 'download' ? (fd.get('instant') || '').trim() : '',
    game: kind === 'ingame' ? (fd.get('game') || '').trim() : '', gameAllowsTrade: kind === 'ingame' && !!fd.get('gameAllowsTrade') };
  if (base.status === 'draft') { it.status = 'active'; it.listedAt = Store.now(); }
  const errs = validateDigital(it);
  if (it.photos.length && !it.alt) errs.push('Describe the photos in a few words.');
  if (errs.length) {
    document.getElementById('formErrors').innerHTML = `<div class="notice err" role="alert"><ul style="margin:0;padding-left:18px">${errs.map(e => `<li>${esc(tr(e))}</li>`).join('')}</ul></div>`;
    return;
  }
  if (existing) Object.assign(existing, it); else st.items.unshift(it);
  save();
  location.hash = '#/item/' + it.id;
  toast(existing ? 'Saved.' : 'Listed on Trove Digital.');
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

let moneyAll = false;
function renderDashMoney() {
  const orders = myOrders();
  const m = moneySummary(orders);
  const closed = orders.filter(o => o.closedAt && o.state !== 'cancelled');
  app.innerHTML = dashHead('money', `<button type="button" class="ghost small" data-act="csv" ${closed.length ? '' : 'disabled'}>Export for accounting</button>`) + `
    <div class="tiles">
      <div class="tile"><b>${money(m.held)}</b><span>On the way to you</span></div>
      <div class="tile"><b>${money(m.released + m.inPerson)}</b><span>Earned</span></div>
      <div class="tile"><b>${money(CONFIG.trovePaysCardFee ? 0 : m.fees)}</b><span>${CONFIG.trovePaysCardFee ? tr('Fees you paid') : tr('Card and PayPal fees')}</span></div>
      <div class="tile"><b>${money(m.profit)}</b><span>Profit after costs</span></div>
    </div>
    <section class="viz"><h2>Sales by week</h2><p class="take">${tr('Last 8 weeks, counted when the buyer has the item.')}</p>
    ${barChart(weeklySales(mainOrders(), S().actingSeller, Store.now(), 8).map(w => ({ label: shortDate(w.start + DAY), value: w.total })), shortMoney, tr('Sales by week'))}</section>
    <div class="sechead"><h2>Completed orders</h2><span class="muted">${closed.length}</span></div>
    ${closed.length ? `<div class="tablewrap"><table><thead><tr><th>Date</th><th>Items</th><th class="num">Total</th><th class="num">Fee</th><th class="num">You got</th><th class="num">Profit</th></tr></thead><tbody>
      ${closed.slice(0, moneyAll ? closed.length : 10).map(o => { const p = payoutFor(o); const rf = o.state === 'refunded'; return `<tr><td>${fmtDate(o.closedAt, false)}</td><td>${o.items.map(i => esc(i.title)).join(', ')}${rf ? ` <span class="chip red">${tr('Refunded')}</span>` : ''}</td>
        <td class="num">${money(rf ? 0 : o.total)}</td><td class="num">${money(rf ? 0 : p.fee)}</td><td class="num">${money(rf ? 0 : p.net)}</td><td class="num">${money(rf ? -p.label : p.profit)}</td></tr>`; }).join('')}
    </tbody></table></div>${closed.length > 10 ? `<p><button type="button" class="ghost small" data-act="moneyAll">${moneyAll ? tr('Show fewer') : tr('Show all') + ' ' + closed.length}</button></p>` : ''}` : '<p class="muted">None yet.</p>'}
    <p class="hint">${CONFIG.trovePaysCardFee ? tr('No fees for you or your buyers. Trove pays the card processing.') : tr('Trove charges no fee. Card and PayPal processors keep about 2.9% + 30¢ of each online payment (an estimate until payments are live). Cash and e-Transfer are free.')}</p>`;
}

// ---------- insights charts ----------
// One date range scopes every chart. Each chart has a hover and keyboard tooltip (data-tip), a table view and a one-line takeaway.

let insightDays = 84, ageOpen = -1, overviewDays = 30;
const RANGES = [[28, 'Last 4 weeks'], [84, 'Last 12 weeks'], [0, 'All time']];
const zh = () => lang() === 'zh';
const say = (en, cn) => zh() ? cn : en;
const loc = () => zh() ? 'zh-CN' : 'en-CA';
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
// Narrower drawings on phones so the text stays readable instead of shrinking.
const vw = () => innerWidth < 600 ? 370 : 560;
let lastVw = vw();
addEventListener('resize', () => { if (vw() !== lastVw) { lastVw = vw(); if (location.hash.startsWith('#/dashboard/insights')) route(); } });
const dayName = (d, style = 'short') => new Date(2026, 0, 4 + d).toLocaleDateString(loc(), { weekday: style });
const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const tip = (...lines) => esc(lines.filter(Boolean).join('\n'));
const tipAttrs = t => `tabindex="0" data-tip="${t}" aria-label="${t.replace(/\n/g, ', ')}"`;

function vizCard(title, take, body, table, extra = '') {
  return `<section class="viz${extra}"><h2>${title}</h2>${take ? `<p class="take">${take}</p>` : ''}${body}
    ${table ? `<details class="tbl"><summary>Show table</summary><div class="tablewrap">${table}</div></details>` : ''}</section>`;
}
function tbl(head, rows) {
  return `<table><thead><tr>${head.map((h, i) => `<th${i ? ' class="num"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(r => `<tr>${r.map((c, i) => `<td${i ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
const legend = items => `<div class="legend">${items.map(([cls, label]) => `<span><i class="${cls}"></i>${label}</span>`).join('')}</div>`;
function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); return [1, 2, 2.5, 5, 10].map(m => m * p).find(m => m >= v); }

function deltaTag(cur, prev, money = false) {
  if (!insightDays) return '';
  if (!prev) return '';
  const p = Math.round((cur - prev) / prev * 100);
  return `<small class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}% <span>${say('vs the 4 weeks before', '对比前期').replace('4 weeks', insightDays === 28 ? '4 weeks' : '12 weeks')}</span></small>`;
}

// From sales to profit: each cost as a step down, so the biggest cost is easy to see.
function waterfall(p) {
  const steps = [['Item sales', p.sales, 'add'], ['Shipping charged', p.shipping, 'add'], ['What items cost you', -p.itemCost, 'sub'],
    ['Shipping labels', -p.labels, 'sub']];
  if (p.fees) steps.push(['Card and PayPal fees', -p.fees, 'sub']);
  steps.push(['Profit', p.profit, 'total']);
  const W = vw(), H = 190, top = 24, base = top + H, bw = 32, band = W / steps.length;
  const max = niceMax(p.sales + p.shipping);
  const y = v => base - v / max * H;
  let run = 0, prevEnd = null;
  const marks = steps.map(([label, v, kind], i) => {
    const from = kind === 'total' ? 0 : run, to = kind === 'total' ? v : run + v;
    if (kind !== 'total') run = to;
    const x = i * band + (band - bw) / 2, y1 = y(Math.max(from, to)), h = Math.max(2, Math.abs(y(from) - y(to)));
    const conn = prevEnd != null ? `<line class="conn" x1="${x - band + bw}" x2="${x}" y1="${y(prevEnd)}" y2="${y(prevEnd)}"/>` : '';
    prevEnd = kind === 'total' ? null : to;
    const t = tip(tr(label) + ': ' + (v < 0 ? '−' : '') + money(Math.abs(v)), kind === 'sub' && p.sales ? Math.round(-v / p.sales * 100) + say('% of item sales', '% 的商品销售额') : '',
      kind === 'total' && p.sales ? say(`${Math.round(p.profit / p.sales * 100)}% of item sales`, `占商品销售额 ${Math.round(p.profit / p.sales * 100)}%`) : '');
    const lines = tr(label).split(' ');
    const half = Math.ceil(lines.length / 2);
    return `${conn}<rect class="m ${kind}" x="${x}" y="${y1}" width="${bw}" height="${h}" rx="4"/>
      <rect class="hit" x="${i * band + 4}" y="${top - 18}" width="${band - 8}" height="${H + 18}" ${tipAttrs(t)}/>
      <text class="val" x="${x + bw / 2}" y="${y1 - 6}" text-anchor="middle">${(v < 0 ? '−' : '') + shortMoney(Math.abs(v))}</text>
      <text x="${x + bw / 2}" y="${base + 15}" text-anchor="middle">${esc(zh() ? tr(label) : lines.slice(0, half).join(' '))}</text>
      ${zh() ? '' : `<text x="${x + bw / 2}" y="${base + 31}" text-anchor="middle">${esc(lines.slice(half).join(' '))}</text>`}`;
  }).join('');
  const biggest = steps.filter(s => s[2] === 'sub').sort((a, b) => a[1] - b[1])[0];
  const keep = p.sales ? Math.round(p.profit / (p.sales + p.shipping) * 100) : 0;
  const take = p.sales ? say(`You keep ${keep}¢ of every dollar buyers pay you. Your biggest cost is ${biggest[0].toLowerCase()}.`,
    `买家付的每 1 元里你留下 ${keep} 分。最大的成本是${tr(biggest[0])}。`) : '';
  const svg = `<svg class="chart wf" viewBox="0 0 ${W} ${base + 38}" role="group" aria-label="${esc(tr('From sales to profit'))}" style="overflow:visible">
    <line class="axis" x1="0" x2="${W}" y1="${base}" y2="${base}"/>${marks}</svg>`;
  return vizCard(tr('From sales to profit'), take, legend([['add', tr('Money in')], ['sub', tr('Costs')], ['total', tr('Profit')]]) + svg,
    tbl([tr('Step'), tr('Amount')], steps.map(([l, v]) => [esc(tr(l)), (v < 0 ? '−' : '') + money(Math.abs(v))])));
}

// Calendar of sales: one square per day, darker for more sales.
function salesCalendar(days) {
  const st = S(), now = Store.now();
  const cells = salesByDay(mainOrders(), st.actingSeller, now, days);
  const max = Math.max(1, ...cells.map(c => c.total));
  const lvl = v => v ? Math.min(5, Math.ceil(v / max * 5)) : 0;
  const c = 15, g = 3, left = 34, top = 18;
  const first = cells[0].start, firstRow = WEEK_ORDER.indexOf(cells[0].weekday);
  const pos = (cell, i) => { const k = i + firstRow; return [Math.floor(k / 7), k % 7]; };
  const cols = pos(null, cells.length - 1)[0] + 1;
  const W = left + cols * (c + g), H = top + 7 * (c + g);
  const months = [];
  const sq = cells.map((cell, i) => {
    const [col, row] = pos(cell, i), d = new Date(cell.start);
    if (d.getDate() <= 7 && row === 0 || (i === 0 && d.getDate() <= 21)) months.push(`<text x="${left + col * (c + g)}" y="11">${esc(d.toLocaleDateString(loc(), { month: 'short' }))}</text>`);
    const t = tip(d.toLocaleDateString(loc(), { weekday: 'short', month: 'short', day: 'numeric' }),
      cell.count ? `${money(cell.total)} · ${cell.count} ${say(cell.count === 1 ? 'sale' : 'sales', '笔')}` : say('No sales', '没有销售'));
    return `<rect class="s${lvl(cell.total)}" x="${left + col * (c + g)}" y="${top + row * (c + g)}" width="${c}" height="${c}" rx="3" ${tipAttrs(t)}/>`;
  }).join('');
  const rowsLbl = [0, 2, 4].map(r => `<text x="0" y="${top + r * (c + g) + 11}">${esc(dayName(WEEK_ORDER[r]))}</text>`).join('');
  const byWd = WEEK_ORDER.map(wd => ({ wd, total: cells.filter(x => x.weekday === wd).reduce((s, x) => s + x.total, 0) }));
  const all = byWd.reduce((s, x) => s + x.total, 0);
  const best = byWd.slice().sort((a, b) => b.total - a.total)[0];
  const wkend = byWd.filter(x => x.wd === 0 || x.wd === 6).reduce((s, x) => s + x.total, 0);
  const take = all ? say(`${dayName(best.wd, 'long')}s bring in the most. Weekends are ${Math.round(wkend / all * 100)}% of your sales.`,
    `${dayName(best.wd, 'long')}卖得最多。周末占你销售额的 ${Math.round(wkend / all * 100)}%。`) : '';
  const svg = `<svg class="chart cal-heat" viewBox="0 0 ${W} ${H}" style="max-width:${W * 1.5}px" role="group" aria-label="${esc(tr('Sales by day'))}">${months.join('')}${rowsLbl}${sq}</svg>`;
  const key = `<div class="ramp"><span>${tr('Less')}</span>${[0, 1, 2, 3, 4, 5].map(l => `<i class="s${l}"></i>`).join('')}<span>${tr('More')}</span></div>`;
  return vizCard(tr('Sales by day'), take, svg + key,
    tbl([tr('Day'), tr('Sales'), tr('Items')], byWd.map(x => [esc(dayName(x.wd, 'long')), money(x.total), cells.filter(c2 => c2.weekday === x.wd).reduce((s, c2) => s + c2.count, 0)])));
}

// Price against days to sell: do pricier things wait longer?
function priceScatter(rows) {
  const counts = {};
  rows.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
  const top3 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  const cls = cat => { const i = top3.indexOf(cat); return i < 0 ? 'other' : 'c' + (i + 1); };
  const W = vw(), H = 220, l = 40, b = 34, t = 26, r = 12;
  const xm = niceMax(Math.max(1, ...rows.map(x => x.price))), ym = niceMax(Math.max(1, ...rows.map(x => x.days)));
  const X = v => l + v / xm * (W - l - r), Y = v => t + H - v / ym * H;
  const ticks = m => { const n = m % 4 === 0 ? 4 : 5; return Array.from({ length: n + 1 }, (_, i) => m / n * i); };
  const grid = ticks(ym).map(v => `<line class="grid" x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${l - 6}" y="${Y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`).join('')
    + ticks(xm).map(v => `<text x="${X(v)}" y="${t + H + 16}" text-anchor="middle">${shortMoney(v)}</text>`).join('');
  const order = rows.slice().sort((a, b2) => (cls(a.category) === 'other') ? -1 : (cls(b2.category) === 'other') ? 1 : 0);
  const dots = order.map(x => {
    const tp = tip(x.title, `${money(x.price)} · ${x.days} ${say('days to sell', '天卖出')}`, tr(x.category));
    return `<circle class="dot ${cls(x.category)}" cx="${X(x.price)}" cy="${Y(x.days)}" r="5"/><circle class="hit" cx="${X(x.price)}" cy="${Y(x.days)}" r="12" ${tipAttrs(tp)}/>`;
  }).join('');
  const cheap = rows.filter(x => x.price < 3000).map(x => x.days), dear = rows.filter(x => x.price >= 6000).map(x => x.days);
  const take = cheap.length && dear.length ? say(`Things under $30 sold in about ${Math.round(median(cheap))} days. Things over $60 took about ${Math.round(median(dear))}.`,
    `30 元以下的东西大约 ${Math.round(median(cheap))} 天卖出，60 元以上的大约 ${Math.round(median(dear))} 天。`) : '';
  const hasOther = rows.some(x => cls(x.category) === 'other');
  const svg = `<svg class="chart sc" viewBox="0 0 ${W} ${t + H + b}" role="group" aria-label="${esc(tr('Price and time to sell'))}">${grid}
    <line class="axis" x1="${l}" x2="${W - r}" y1="${t + H}" y2="${t + H}"/>${dots}
    <text x="${W - r}" y="${t + H + 30}" text-anchor="end">${esc(tr('Price'))}</text><text x="${l - 34}" y="${t - 14}" text-anchor="start" class="ylab">${esc(tr('Days to sell'))}</text></svg>`;
  return vizCard(tr('Price and time to sell'), take,
    legend(top3.map((c2, i) => ['c' + (i + 1), esc(tr(c2))]).concat(hasOther ? [['other', tr('Other')]] : [])) + svg,
    tbl([tr('Item'), tr('Price'), tr('Days to sell')], rows.slice().sort((a, b2) => b2.days - a.days).map(x => [esc(x.title), money(x.price), x.days])));
}

// Views to sold: where buyers drop off.
function funnel(steps) {
  const max = Math.max(1, steps[0].value);
  const rows = steps.map((s, i) => {
    const prev = i ? steps[i - 1].value : 0;
    const conv = i && prev ? Math.round(s.value / prev * 100) : null;
    const t = tip(tr(s.step) + ': ' + s.value, conv != null ? say(`${conv}% of the step before`, `上一步的 ${conv}%`) : '');
    return `<div class="fstep" ${tipAttrs(t)}><span>${esc(tr(s.step))}</span>
      <div class="ftrack"><i style="width:${Math.max(1.5, s.value / max * 100).toFixed(1)}%"></i></div>
      <b>${s.value}</b><em>${conv != null ? conv + '%' : ''}</em></div>`;
  }).join('');
  const [v, sv, , sold] = steps.map(s => s.value);
  const drops = steps.slice(1).map((s, i) => ({ from: steps[i].step, to: s.step, rate: steps[i].value ? s.value / steps[i].value : 1 }));
  const worst = drops.slice().sort((a, b) => a.rate - b.rate)[0];
  const take = v && sold ? say(`About 1 in ${Math.round(v / sold)} views ends in a sale. The biggest drop is from ${worst.from.toLowerCase()} to ${worst.to.toLowerCase()}.`,
    `大约每 ${Math.round(v / sold)} 次浏览成交 1 件。流失最多的一步是从“${tr(worst.from)}”到“${tr(worst.to)}”。`) : '';
  return vizCard(tr('From views to sold'), take, `<div class="funnel"><div class="fstep head"><span></span><span></span><b>${tr('Count')}</b><em>${tr('Kept')}</em></div>${rows}</div>`,
    tbl([tr('Step'), tr('Count'), tr('Kept')], steps.map((s, i) => [esc(tr(s.step)), s.value, i && steps[i - 1].value ? Math.round(s.value / steps[i - 1].value * 100) + '%' : ''])));
}

// How long current listings have waited. Click a bar to see the items.
function stockAgeChart(bands) {
  const W = 360, H = 130, top = 20, base = top + H, bw = 24, band = W / bands.length;
  const max = niceMax(Math.max(1, ...bands.map(b => b.count)));
  const bars = bands.map((b, i) => {
    const h = b.count ? Math.max(4, b.count / max * H) : 2, x = i * band + (band - bw) / 2;
    const t = tip(tr(b.label), `${b.count} ${say(b.count === 1 ? 'listing' : 'listings', '件')} · ${money(b.value)}`, say('Click to see them', '点击查看'));
    return `<rect class="m a${i}${b.count ? '' : ' zero'}" x="${x}" y="${base - h}" width="${bw}" height="${h}" rx="4"/>
      <rect class="hit${ageOpen === i ? ' on' : ''}" x="${i * band + 4}" y="${top - 16}" width="${band - 8}" height="${H + 36}" data-act="ageBand" data-i="${i}" role="button" aria-pressed="${ageOpen === i}" ${tipAttrs(t)}/>
      <text class="val" x="${x + bw / 2}" y="${base - h - 6}" text-anchor="middle">${b.count}</text>
      <text x="${x + bw / 2}" y="${base + 15}" text-anchor="middle">${esc(tr(b.label))}</text>`;
  }).join('');
  const old = bands[bands.length - 1];
  const take = old.count ? say(`${old.count} ${old.count === 1 ? 'listing has' : 'listings have'} waited over 2 months, worth ${money(old.value)}. A lower price or a bundle can move them.`,
    `有 ${old.count} 件等了两个多月，共 ${money(old.value)}。降价或打包卖能更快卖出。`) : say('Nothing has waited over 2 months.', '没有等超过两个月的商品。');
  const open = bands[ageOpen];
  const list = open ? `<div class="agelist"><h3>${esc(tr(open.label))}</h3>${open.items.length ? `<ul>${open.items.map(it => `<li><a href="#/item/${it.id}">${esc(it.title)}</a> · ${money(it.price)} · ${Math.floor((Store.now() - it.listedAt) / DAY)} ${say('days', '天')}
      <a class="small" href="#/sell/edit/${it.id}">${tr('Edit price')}</a></li>`).join('')}</ul>` : `<p class="muted">${tr('None.')}</p>`}</div>` : `<p class="hint">${tr('Click a bar to see those listings.')}</p>`;
  const svg = `<svg class="chart age" viewBox="0 0 ${W} ${base + 22}" role="group" aria-label="${esc(tr('How long listings have waited'))}"><line class="axis" x1="0" x2="${W}" y1="${base}" y2="${base}"/>${bars}</svg>`;
  return vizCard(tr('How long listings have waited'), take, svg + list,
    tbl([tr('Waiting'), tr('Listings'), tr('Value')], bands.map(b => [esc(tr(b.label)), b.count, money(b.value)])));
}

// Average cost and price per item, by category: a dumbbell from what you paid to what it sold for.
function markupChart(rows) {
  const W = vw(), l = W < 500 ? 96 : 104, r = W < 500 ? 76 : 92, rowH = 30, top = 8;
  const H = top + rows.length * rowH;
  const xm = niceMax(Math.max(1, ...rows.map(x => x.price)));
  const X = v => l + v / xm * (W - l - r);
  const marks = rows.map((x, i) => {
    const y = top + i * rowH + rowH / 2, mult = x.cost ? (x.price / x.cost).toFixed(1) : null;
    const t = tip(tr(x.category), `${say('Paid', '成本')} ${money(x.cost)} → ${say('sold for', '售价')} ${money(x.price)}`,
      `${say('Profit per item', '每件赚')} ${money(x.price - x.cost)}${mult ? ' · ×' + mult : ''}`, `${x.n} ${say('sold', '件已售')}`);
    return `<g ${tipAttrs(t)} class="row-hit"><rect class="hit" x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}"/>
      <text x="${l - 10}" y="${y + 4}" text-anchor="end" class="cat">${esc(tr(x.category))}</text>
      <line class="bar-l" x1="${X(x.cost)}" x2="${X(x.price)}" y1="${y}" y2="${y}"/>
      <circle class="cost" cx="${X(x.cost)}" cy="${y}" r="5"/><circle class="price" cx="${X(x.price)}" cy="${y}" r="5"/>
      <text x="${W - r + 10}" y="${y + 4}" class="val">+${shortMoney(x.price - x.cost)}${mult ? ` ×${mult}` : ''}</text></g>`;
  }).join('');
  const best = rows[0];
  const take = best ? say(`${best.category} earn the most per item: ${money(best.price - best.cost)} over what you paid.`,
    `${tr(best.category)}每件赚得最多：比成本高 ${money(best.price - best.cost)}。`) : '';
  const svg = `<svg class="chart db" viewBox="0 0 ${W} ${H + 18}" role="group" aria-label="${esc(tr('What you paid and what it sold for'))}">${marks}
    <text x="${X(0)}" y="${H + 14}" text-anchor="middle">$0</text><text x="${X(xm)}" y="${H + 14}" text-anchor="middle">${shortMoney(xm)}</text></svg>`;
  return vizCard(tr('What you paid and what it sold for'), take, legend([['cost', tr('Average cost')], ['c1', tr('Average price')]]) + svg,
    tbl([tr('Type'), tr('Sold'), tr('Average cost'), tr('Average price'), tr('Profit per item')], rows.map(x => [esc(tr(x.category)), x.n, money(x.cost), money(x.price), money(x.price - x.cost)])), ' wide');
}

// When handoffs happen: weekday by time of day.
function meetupGrid(grid) {
  const max = Math.max(1, ...grid.flat());
  const lvl = v => v ? Math.min(5, Math.ceil(v / max * 5)) : 0;
  let best = [0, 0, 0];
  grid.forEach((row, d) => row.forEach((v, b) => { if (v > best[2]) best = [d, b, v]; }));
  const head = `<div></div>${TIME_BANDS.map(b => `<b>${esc(tr(b[2]))}</b>`).join('')}`;
  const body = WEEK_ORDER.map(d => `<span>${esc(dayName(d))}</span>${grid[d].map((v, b) =>
    `<i class="s${lvl(v)}${lvl(v) >= 4 ? ' hi' : ''}" ${tipAttrs(tip(`${dayName(d, 'long')}, ${tr(TIME_BANDS[b][2]).toLowerCase()}`, `${v} ${say(v === 1 ? 'handoff' : 'handoffs', '次交接')}`))}>${v || ''}</i>`).join('')}`).join('');
  const take = best[2] ? say(`${dayName(best[0], 'long')} ${TIME_BANDS[best[1]][2].toLowerCase()} is your busiest time. Offer it first when buyers pick a meetup.`,
    `${dayName(best[0], 'long')}${tr(TIME_BANDS[best[1]][2])}最忙。买家选见面时间时先给这个时段。`) : '';
  return vizCard(tr('When handoffs happen'), take, `<div class="heat">${head}${body}</div>`,
    tbl([tr('Day'), ...TIME_BANDS.map(b => esc(tr(b[2])))], WEEK_ORDER.map(d => [esc(dayName(d, 'long')), ...grid[d]])));
}

function renderDashInsights() {
  const st = S(), sid = st.actingSeller, now = Store.now();
  const from = insightDays ? now - insightDays * DAY : 0;
  const items = mainItems(), orders = mainOrders();
  const cmp = periodCompare(orders, sid, now, insightDays || 3650);
  const tts = timeToSell(orders, items, sid, from, now);
  const prevTts = insightDays ? timeToSell(orders, items, sid, from - insightDays * DAY, from) : [];
  const ttsMed = median(tts.map(x => x.days)), prevMed = median(prevTts.map(x => x.days));
  const misses = st.misses.slice().sort((a, b) => b.count - a.count).slice(0, 10);
  const watched = interestByItem(st.events || [], myItems().filter(i => i.status === 'active')).slice(0, 5);
  const firstSale = Math.min(now, ...orders.filter(o => o.sellerId === sid && o.closedAt).map(o => o.closedAt));
  const calDays = insightDays || Math.min(182, Math.max(28, Math.ceil((now - firstSale) / DAY) + 1));
  const kpi = (big, label, d) => `<div class="tile"><b>${big}</b><span>${label}</span>${d}</div>`;
  const daysDelta = insightDays && prevMed ? (() => { const p = Math.round((ttsMed - prevMed) / prevMed * 100);
    return `<small class="delta ${p <= 0 ? 'up' : 'down'}">${p <= 0 ? '▼' : '▲'} ${Math.abs(p)}% <span>${p <= 0 ? say('faster', '更快') : say('slower', '更慢')}</span></small>`; })() : '';
  const hasSales = cmp.current.count > 0;
  app.innerHTML = dashHead('insights', `<div class="seg" role="group" aria-label="${esc(tr('Date range'))}">${RANGES.map(([d, l]) => `<button type="button" data-act="range" data-days="${d}" aria-pressed="${insightDays === d}">${l}</button>`).join('')}</div>`) + `
    <div class="tiles">
      ${kpi(money(cmp.current.sales), tr('Item sales'), deltaTag(cmp.current.sales, cmp.previous.sales))}
      ${kpi(money(cmp.current.profit), tr('Profit after costs'), deltaTag(cmp.current.profit, cmp.previous.profit))}
      ${kpi(cmp.current.count, tr('Orders'), deltaTag(cmp.current.count, cmp.previous.count))}
      ${kpi(tts.length ? Math.round(ttsMed * 10) / 10 + ' ' + say('days', '天') : '–', tr('Typical time to sell'), daysDelta)}
    </div>
    ${hasSales ? `<div class="viz-grid">
      ${waterfall(profitSteps(orders, sid, from, now))}
      ${funnel(salesFunnel(st.events || [], orders, items, sid, from, now))}
      ${salesCalendar(calDays)}
      ${meetupGrid(meetupTimes(orders, sid, from, now))}
      ${priceScatter(tts)}
      ${stockAgeChart(stockAge(items, sid, now))}
      ${markupChart(markupByCategory(orders, items, sid, from, now))}
    </div>` : `<p class="muted">${tr('No sales in this range yet. Try All time.')}</p>${stockAgeChart(stockAge(items, sid, now))}`}
    <div class="cols" style="margin-top:28px">
      <section><h2>Most watched</h2>
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

// One tooltip for every chart, on hover and on keyboard focus. Text only (textContent), never HTML.
const tipEl = document.createElement('div');
tipEl.id = 'tip'; tipEl.setAttribute('role', 'tooltip'); tipEl.hidden = true;
document.body.appendChild(tipEl);
function showTip(el, x, y) {
  tipEl.textContent = el.dataset.tip; tipEl.hidden = false;
  const r = el.getBoundingClientRect();
  const px = x != null ? x : r.left + r.width / 2, py = y != null ? y : r.top;
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, px - w / 2)) + 'px';
  tipEl.style.top = (py - h - 12 < 8 ? py + 18 : py - h - 12) + 'px';
}
document.addEventListener('pointermove', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) showTip(el, e.clientX, e.clientY); else tipEl.hidden = true; });
document.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); if (el) showTip(el); });
document.addEventListener('focusout', () => { tipEl.hidden = true; });
addEventListener('scroll', () => { tipEl.hidden = true; }, { passive: true });

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
      <fieldset style="border:0;padding:0;margin:0 0 16px"><legend><b>Payments you accept</b></legend>
        ${ALL_METHODS.map(m => `<label class="radio"><input type="checkbox" name="pay" value="${m}" ${(s.payMethods || ALL_METHODS).includes(m) ? 'checked' : ''}><span><b>${tr(PAY_METHODS[m].label)}</b><span class="muted">${tr(PAY_METHODS[m].held ? 'Held until the buyer has it. The processor keeps about 2.9% + 30¢ (estimate).' : 'Free. Paid at the meetup, not protected.')}</span></span></label>`).join('')}
        <small class="hint">Shipped orders always use card or PayPal, so keep at least one of them on if you ship.</small></fieldset>
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
  const c = st.cart.length, n = mainInbox().filter(x => !x.read).length;
  document.getElementById('cartCount').innerHTML = c ? `<span class="count">${c}</span>` : '';
  document.getElementById('inboxCount').innerHTML = n ? `<span class="count">${n}</span>` : '';
  const off = st.clockDays;
  document.getElementById('clock').textContent = off ? `${fmtDate(Store.now())} (+${off})` : '';
}

function route() {
  sweepAll();
  const { parts, params } = parseHash();
  const [a, b, c] = parts;
  const inDigital = a === 'digital' || (a === 'item' && isDigital(itemById(b) || {})) || (a === 'order' && !!(orderById(b) || {}).digital)
    || (a === 'sell' && (DIGITAL_KINDS[params.kind] || (b === 'edit' && isDigital(itemById(c) || {}))));
  const navKey = inDigital ? 'digital' : a === 'sell' && b === 'new' ? 'sellnew' : a || '';
  document.querySelectorAll('nav.main>a').forEach(el => {
    if (el.dataset.nav === navKey) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
  });
  document.getElementById('menu').open = false;
  document.getElementById('browseMenu').open = false;
  applyLook();
  renderBrowseMenu();
  if (!a) renderBrowse(params);
  else if (a === 'item') renderItem(b);
  else if (a === 'digital') ({ orders: renderDigitalOrders, selling: renderDigitalSelling }[b] || renderDigital)(params);
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
    money: renderDashMoney, insights: renderDashInsights, pulse: renderDashPulse, profile: renderDashProfile }[b] || renderDashTodo)();
  else app.innerHTML = '<h1>Page not found</h1><p><a href="#/">Back</a></p>';
  app.classList.toggle('console', a === 'dashboard');
  if (a === 'dashboard') {
    const side = app.querySelector('.side'), pane = document.createElement('div');
    pane.className = 'pane';
    [...app.childNodes].forEach(n => { if (n !== side) pane.appendChild(n); });
    app.appendChild(pane);
  }
  // One view per visit to a listing, not per re-render
  if (a === 'item' && itemById(b) && lastViewed !== b) { track(b, 'view'); remember(b); save(); }
  lastViewed = a === 'item' ? b : null;
  updateCounts();
  translatePage(document.body);
  if (!a && !S().prefs.tourDone && !Store.inTour()) setTimeout(() => { if (!Store.inTour() && !S().prefs.tourDone) startTour(); }, 350);
}
let lastViewed = null;

// ---------- first-visit tour ----------

let lastPath = null;
window.addEventListener('hashchange', () => {
  const p = parseHash().parts.join('/');
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
    if (lk.dataset.look === 'btn' && ['auto', 'dark'].includes(pr.bg)) pr.bg = 'peach';
    save(); applyLook();
    toast(`${tr(lk.dataset.look === 'bg' ? 'Background' : 'Buttons')}: ${tr((LOOKS[lk.dataset.look].find(x => x[0] === lk.dataset.v) || [])[1] || '')}`);
  }
  const dn = e.target.closest('[data-density]');
  if (dn) { e.preventDefault(); S().prefs.density = S().prefs.density === 'compact' ? 'large' : 'compact'; save(); route(); }
});

app.addEventListener('change', e => {
  const t = e.target, f = t.form;
  if (t.dataset.actChange === 'seller') { S().actingSeller = t.value; save(); route(); return; }
  if (t.dataset.actChange === 'dseller') { S().digitalSeller = t.value; save(); route(); return; }
  if (t.id === 'bulkInput') { addDrafts(t.files); t.value = ''; return; }
  if (t.name === 'kind' && f) { applyKind(f); return; }
  if (!f) return;
  if (f.dataset.form === 'filters') {
    const q = new URLSearchParams();
    for (const [k, v] of new FormData(f)) if (v) q.set(k, v);
    location.hash = '#/?' + q.toString();
  }
  if (f.dataset.form === 'choice') {
    const fd = new FormData(f);
    S().checkout = { fulfilment: fd.get('fulfilment'), method: fd.get('method') || 'card' };
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
    case 'sessionDone': if (act(id, 'deliver', 'seller', {})) { toast('Session marked done.'); route(); } break;
    case 'moneyAll': moneyAll = !moneyAll; route(); break;
    case 'range': insightDays = +btn.dataset.days; ageOpen = -1; route(); break;
    case 'prange': pulseDays = +btn.dataset.days; route(); break;
    case 'ovrange': overviewDays = +btn.dataset.days; route(); break;
    case 'pmetric': pulseMetric = btn.dataset.m; route(); break;
    case 'ageBand': { const i = +btn.dataset.i; ageOpen = ageOpen === i ? -1 : i; route(); const t = app.querySelector(`[data-act="ageBand"][data-i="${i}"]`); if (t) t.focus(); break; }
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
    case 'buyDigital': buyDigital(f); break;
    case 'deliver': if (act(id, 'deliver', 'seller', { note: fd.get('note') })) { toast('Marked as delivered.'); route(); } break;
    case 'dsearch': location.hash = '#/digital' + (fd.get('q').trim() ? '?q=' + encodeURIComponent(fd.get('q').trim()) : ''); break;
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
      const already = search(st.items, what, max ? { maxPrice: max, digital: false } : { digital: false }).results.length;
      if (already) { toast('Posted. Some are already listed, showing them now.'); location.hash = '#/?q=' + encodeURIComponent(what); }
      else { toast("Posted. You'll get an alert when it's listed."); route(); }
      break;
    }
    case 'prefs':
      st.prefs = { ...st.prefs, buyer: fd.get('buyer'), seller: fd.get('seller'), marketing: !!fd.get('marketing'), lang: fd.get('lang') || 'en' };
      save(); route(); toast('Saved.'); break;
    case 'profile':
      { const pay = fd.getAll('pay');
        if (!pay.length) { toast('Pick at least one way to get paid.'); break; }
        Object.assign(me(), { name: fd.get('name').trim(), city: fd.get('city').trim(), about: fd.get('about').trim(), payMethods: pay }); }
      save(); toast('Saved.'); route(); break;
  }
});

Store.get();
route();
