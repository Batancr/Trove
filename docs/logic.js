// Trove: pure functions (order engine, cart and shipping, search, money, notifications). No DOM here.
// Tested by tests/logic.test.js. Money is always handled in whole cents to avoid rounding drift.

// ---------- settings (placeholders: check real numbers before going live) ----------

const CONFIG = {
  currency: 'CAD',
  // Card processing estimate. Placeholder only: check Stripe's current Canadian pricing.
  cardFeePct: 2.9,
  cardFeeFixed: 30,               // cents
  marketplaceFeePct: 0,           // Trove takes nothing from sellers for now
  trovePaysCardFee: false,        // decided 16 Oct: the seller covers the card or PayPal processor's cut; Trove pays nothing
  // PayPal estimate. Placeholder only: check PayPal's current Canadian merchant rates.
  paypalFeePct: 2.9,
  paypalFeeFixed: 30,             // cents
  minOnlineOrder: 500,            // cents. Card orders below this would lose most of the value to fees
  shipByDays: 3,                  // seller must ship within this many days of payment, or the buyer is refunded
  checkWindowDays: 3,             // after delivery, the buyer has this long to report a problem
  noScanDays: 14,                 // shipped but no delivered scan after this long: flagged as a problem
  meetupGraceDays: 2,             // pay-at-handoff reservations cancel this long after the meetup time
  // Combined shipping by box. Placeholder rates, not real Canada Post prices.
  boxes: [
    { id: 'small',  label: 'Small box',  fits: 4, rate: 1200 },
    { id: 'medium', label: 'Medium box', fits: 3, rate: 1800 },
    { id: 'large',  label: 'Large box',  fits: 1, rate: 3200 },
  ],
  localDeliveryFee: 800,
  taxPct: 0,                      // GST/HST off while under the small supplier threshold (verify with the CRA)
  // Trove Digital: services, downloads and game items
  digitalDeliverDays: 2,          // downloads and game items must be delivered within this long, or the buyer is refunded
  sessionDoneDays: 2,             // a session must be marked done within this long after its time, or the buyer is refunded
  digitalCheckDays: 2,            // after delivery or the session, the buyer has this long to report a problem
};

const DAY = 24 * 60 * 60 * 1000;

// ---------- money ----------

function cents(dollars) { return Math.round(Number(dollars) * 100); }

function fmtMoney(c) {
  const neg = c < 0;
  const s = (Math.abs(c) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '−$' : '$') + s;
}

function cardFee(totalCents, cfg = CONFIG) {
  if (totalCents <= 0) return 0;
  return Math.round(totalCents * cfg.cardFeePct / 100) + cfg.cardFeeFixed;
}

// ---------- shipping and cart ----------

const SIZE_ORDER = { small: 0, medium: 1, large: 2 };

// Packs items into boxes: large items go one per box, then medium, then small items fill
// spare room in medium boxes before new small boxes are opened. Returns the boxes used.
function packBoxes(items, cfg = CONFIG) {
  const box = id => cfg.boxes.find(b => b.id === id);
  const count = { small: 0, medium: 0, large: 0 };
  items.forEach(it => { count[it.size || 'small'] += (it.qty || 1); });
  const out = [];
  for (let i = 0; i < count.large; i++) out.push({ ...box('large'), items: 1 });
  let small = count.small;
  const mediumBoxes = Math.ceil(count.medium / box('medium').fits);
  for (let i = 0; i < mediumBoxes; i++) {
    const used = Math.min(box('medium').fits, count.medium - i * box('medium').fits);
    // a small item takes one medium slot
    const spare = box('medium').fits - used;
    const add = Math.min(spare, small);
    small -= add;
    out.push({ ...box('medium'), items: used + add });
  }
  const smallBoxes = Math.ceil(small / box('small').fits);
  for (let i = 0; i < smallBoxes; i++) {
    out.push({ ...box('small'), items: Math.min(box('small').fits, small - i * box('small').fits) });
  }
  return out;
}

function shippingFor(items, cfg = CONFIG) {
  return packBoxes(items, cfg).reduce((s, b) => s + b.rate, 0);
}

// How many more small items fit in the boxes already being paid for ("fill the box").
function spareSmallSlots(items, cfg = CONFIG) {
  return packBoxes(items, cfg).reduce((s, b) => s + (b.id === 'large' ? 0 : b.fits - b.items), 0);
}

// Trove Digital: what kinds of things can be sold online, and the types they're grouped under.
const DIGITAL_KINDS = {
  session: { label: 'Session', how: 'Booked for a time, held online by video call or chat' },
  download: { label: 'Download', how: 'A file or link, delivered after payment' },
  ingame: { label: 'Game item', how: 'Handed over inside the game' },
};
const DIGITAL_CATEGORIES = ['Coaching and lessons', 'Expert advice', 'Creative services', 'Downloads', 'Game items'];
const isDigital = it => !!(it && it.digital);

// How a buyer can pay. Card and PayPal go through a payment company that holds the money until the buyer has the item;
// e-Transfer and cash go straight to the seller at the meetup, so they aren't protected and can't be used for shipping.
const PAY_METHODS = {
  card:      { label: 'Card', payment: 'online', held: true, how: 'Held until you have it' },
  paypal:    { label: 'PayPal', payment: 'online', held: true, how: 'Held until you have it' },
  etransfer: { label: 'Interac e-Transfer', payment: 'at_handoff', held: false, how: 'Sent to the seller at the meetup, not protected' },
  cash:      { label: 'Cash', payment: 'at_handoff', held: false, how: 'Paid at the meetup, not protected' },
};
const ALL_METHODS = Object.keys(PAY_METHODS);

// Methods every seller in the cart accepts, that also work for this way of getting it.
function methodsFor(sellers, fulfilment) {
  return ALL_METHODS.filter(m => sellers.every(s => (s.payMethods || ALL_METHODS).includes(m)))
    .filter(m => fulfilment === 'ship' || fulfilment === 'digital' ? PAY_METHODS[m].held : true);
}

// The payment company's cut on an online payment. Cash and e-Transfer cost nothing.
function processingFee(totalCents, method, cfg = CONFIG) {
  if (method === 'paypal') return Math.round(totalCents * cfg.paypalFeePct / 100) + cfg.paypalFeeFixed;
  if (method === 'etransfer' || method === 'cash') return 0;
  return cardFee(totalCents, cfg);
}

// fulfilment: 'ship' | 'meetup' | 'delivery' | 'digital'; payment: 'online' | 'at_handoff'
function cartTotals(items, fulfilment, payment, cfg = CONFIG) {
  const subtotal = items.reduce((s, it) => s + it.price * (it.qty || 1), 0);
  const shipping = fulfilment === 'ship' ? shippingFor(items, cfg)
    : fulfilment === 'delivery' ? cfg.localDeliveryFee : 0;
  const tax = Math.round((subtotal + shipping) * cfg.taxPct / 100);
  const total = subtotal + shipping + tax;
  const problems = [];
  if (!items.length) problems.push('Your cart is empty.');
  if (payment === 'at_handoff' && fulfilment === 'ship') problems.push('Shipped orders are paid online.');
  if (payment === 'at_handoff' && fulfilment === 'digital') problems.push('Digital orders are paid online.');
  if (payment === 'online' && total < cfg.minOnlineOrder) {
    problems.push(`Card orders start at ${fmtMoney(cfg.minOnlineOrder)}. Add another item, or choose a meetup and pay at the handoff.`);
  }
  const spare = fulfilment === 'ship' ? spareSmallSlots(items, cfg) : 0;
  return { subtotal, shipping, tax, total, spare, problems, ok: problems.length === 0 };
}

// A cart can hold items from several sellers. Each seller gets their own order and their own box,
// so shipping is worked out per seller and added up. The card minimum applies to the whole cart.
function splitBySeller(items) {
  const groups = {};
  items.forEach(it => { (groups[it.sellerId || ''] = groups[it.sellerId || ''] || []).push(it); });
  return Object.entries(groups).map(([sellerId, list]) => ({ sellerId, items: list }));
}

function cartTotalsAll(items, fulfilment, payment, cfg = CONFIG) {
  const groups = splitBySeller(items).map(g => ({ ...g, t: cartTotals(g.items, fulfilment, payment, { ...cfg, minOnlineOrder: 0 }) }));
  const sum = k => groups.reduce((s, g) => s + g.t[k], 0);
  const all = { subtotal: sum('subtotal'), shipping: sum('shipping'), tax: sum('tax'), total: sum('total'), spare: sum('spare'), groups };
  const problems = [...new Set(groups.flatMap(g => g.t.problems))];
  if (!items.length) problems.push('Your cart is empty.');
  if (payment === 'online' && items.length && all.total < cfg.minOnlineOrder) {
    problems.push(`Card orders start at ${fmtMoney(cfg.minOnlineOrder)}. Add another item, or choose a meetup and pay in person.`);
  }
  return { ...all, problems, ok: problems.length === 0 };
}

// What buyers see on a seller's profile: built from finished orders only, never typed in.
function sellerStats(orders, sellerId) {
  const mine = orders.filter(o => o.sellerId === sellerId);
  const done = mine.filter(o => ['released', 'completed'].includes(o.state));
  const shipDays = mine.map(o => {
    const shipped = o.log.find(e => e.action === 'ship');
    return shipped ? (shipped.at - o.createdAt) / DAY : null;
  }).filter(d => d != null);
  return {
    sales: done.length,
    problems: mine.filter(o => o.problem).length,
    avgShipDays: shipDays.length ? Math.round(shipDays.reduce((a, b) => a + b, 0) / shipDays.length * 10) / 10 : null,
  };
}

// ---------- order engine ----------
// One record per order. Every change goes through transition(), which checks who may do it and logs it.

const STATES = {
  paid_held:  { label: 'Paid, money held',      money: 'held' },
  shipped:    { label: 'Shipped',               money: 'held' },
  delivered:  { label: 'Delivered',             money: 'held' },
  reserved:   { label: 'Reserved for meetup',   money: 'none' },
  problem:    { label: 'Problem reported',      money: 'held' },
  released:   { label: 'Complete',              money: 'released' },
  completed:  { label: 'Complete (paid in person)', money: 'in_person' },
  refunded:   { label: 'Refunded',              money: 'refunded' },
  cancelled:  { label: 'Cancelled',             money: 'none' },
};

// action -> [from states, who may do it, to state]
const ACTIONS = {
  ship:            [['paid_held'], ['seller'], 'shipped'],
  delivered_scan:  [['shipped'], ['carrier', 'seller'], 'delivered'],
  confirm:         [['delivered'], ['buyer'], 'released'],
  report:          [['delivered', 'shipped'], ['buyer'], 'problem'],
  handoff:         [['paid_held', 'reserved'], ['seller'], null],   // released or completed, see transition()
  deliver:         [['paid_held'], ['seller', 'system'], 'delivered'],   // digital: file sent, item handed over in game, or session held
  cancel:          [['paid_held', 'reserved'], ['seller', 'buyer'], null],
  resolve_release: [['problem'], ['seller', 'admin'], 'released'],
  resolve_refund:  [['problem'], ['seller', 'admin'], 'refunded'],
  auto_refund:     [['paid_held'], ['system'], 'refunded'],
  auto_release:    [['delivered'], ['system'], 'released'],
  no_scan:         [['shipped'], ['system'], 'problem'],
  no_show:         [['reserved'], ['system'], 'cancelled'],
};

function makeHandoffCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 6; i++) s += Math.floor(rand() * 10);
  return s;
}

function createOrder({ id, sellerId, items, buyer, fulfilment, payment, method, meetup, address, slot, now, rand = Math.random, checkMinimum = true }, cfg = CONFIG) {
  const t = cartTotals(items, fulfilment, payment, checkMinimum ? cfg : { ...cfg, minOnlineOrder: 0 });
  if (!t.ok) throw new Error(t.problems[0]);
  const online = payment === 'online';
  const order = {
    id, sellerId: sellerId || null, buyer, fulfilment, payment, method: method || (online ? 'card' : 'cash'),
    items: items.map(it => ({ id: it.id, title: it.title, price: it.price, qty: it.qty || 1, size: it.size, cost: it.cost || 0, ...(it.digital ? { digital: it.digital } : {}) })),
    subtotal: t.subtotal, shipping: t.shipping, tax: t.tax, total: t.total,
    cardFee: online ? processingFee(t.total, method || 'card', cfg) : 0,
    meetup: meetup || null, address: address || null,
    handoffCode: fulfilment === 'ship' || fulfilment === 'digital' ? null : makeHandoffCode(rand),
    digital: fulfilment === 'digital' ? { kind: items[0].digital, at: slot || null, game: items[0].game || null, delivery: null } : null,
    tracking: null, packPhoto: null, problem: null, labelCost: 0,
    state: online ? 'paid_held' : 'reserved',
    createdAt: now,
    shipBy: online && fulfilment === 'ship' ? now + cfg.shipByDays * DAY
      : fulfilment === 'digital' ? (slot ? slot + cfg.sessionDoneDays * DAY : now + cfg.digitalDeliverDays * DAY) : null,
    deliveredAt: null, closedAt: null,
    log: [{ at: now, by: 'buyer', action: online ? 'paid' : 'reserved', state: online ? 'paid_held' : 'reserved' }],
  };
  return order;
}

function canDo(order, action, who) {
  const a = ACTIONS[action];
  if (!a) return false;
  if (!a[0].includes(order.state) || !a[1].includes(who)) return false;
  if (action === 'handoff' && ['ship', 'digital'].includes(order.fulfilment)) return false;
  if (action === 'deliver' && order.fulfilment !== 'digital') return false;
  if (action === 'ship' && order.fulfilment !== 'ship') return false;
  return true;
}

function transition(order, action, who, now, data = {}) {
  if (!canDo(order, action, who)) {
    throw new Error(`Can't ${action.replace('_', ' ')} an order that is "${STATES[order.state].label}" (as ${who}).`);
  }
  const o = { ...order, log: order.log.slice() };
  let to = ACTIONS[action][2];
  if (action === 'ship') {
    if (!data.tracking) throw new Error('A tracking number is needed to mark an order shipped.');
    o.tracking = data.tracking;
    if (data.packPhoto) o.packPhoto = data.packPhoto;
    if (data.labelCost) o.labelCost = data.labelCost;
  }
  if (action === 'handoff') {
    if (String(data.code || '').trim() !== order.handoffCode) throw new Error("That code doesn't match. Ask the buyer to read it again.");
    to = order.payment === 'online' ? 'released' : 'completed';
  }
  if (action === 'cancel') to = order.payment === 'online' ? 'refunded' : 'cancelled';
  if (action === 'deliver') {
    const kind = order.digital && order.digital.kind;
    if (kind !== 'session' && !String(data.note || '').trim()) throw new Error(kind === 'download' ? 'Add the download link or file.' : 'Say how and when you handed it over in the game.');
    if (kind === 'session' && order.digital.at && now < order.digital.at) throw new Error("The session hasn't happened yet.");
    o.digital = { ...order.digital, delivery: { note: String(data.note || '').trim(), at: now } };
  }
  if (action === 'report') {
    if (!data.reason) throw new Error('Please say what went wrong.');
    o.problem = { reason: data.reason, at: now };
  }
  if (to === 'delivered') o.deliveredAt = now;
  if (['released', 'completed', 'refunded', 'cancelled'].includes(to)) o.closedAt = now;
  o.state = to;
  o.log.push({ at: now, by: who, action, state: to, note: data.note || data.reason || undefined });
  return o;
}

// Applies the time-based rules. Call on load and whenever the clock moves.
function sweep(order, now, cfg = CONFIG) {
  if (order.state === 'paid_held' && order.shipBy && now > order.shipBy) {
    return transition(order, 'auto_refund', 'system', now, { note: 'Not shipped by the deadline' });
  }
  const checkDays = order.fulfilment === 'digital' ? cfg.digitalCheckDays : cfg.checkWindowDays;
  if (order.state === 'delivered' && now > order.deliveredAt + checkDays * DAY) {
    return transition(order, 'auto_release', 'system', now, { note: 'Check window passed' });
  }
  if (order.state === 'shipped') {
    const shippedAt = [...order.log].reverse().find(e => e.action === 'ship').at;
    if (now > shippedAt + cfg.noScanDays * DAY) {
      return { ...transition(order, 'no_scan', 'system', now, { note: 'No delivery scan' }), problem: { reason: 'No delivery scan from the carrier', at: now } };
    }
  }
  if (order.state === 'reserved' && order.meetup && order.meetup.at && now > order.meetup.at + cfg.meetupGraceDays * DAY) {
    return transition(order, 'no_show', 'system', now, { note: 'Meetup passed without a handoff' });
  }
  return order;
}

// The four-step money bar shown on every order.
function moneySteps(order) {
  if (order.payment === 'at_handoff') {
    const done = order.state === 'completed';
    return [
      { key: 'reserved', label: 'Reserved', done: true },
      { key: 'paid', label: 'Paid at handoff', done },
    ];
  }
  const st = order.state;
  const released = st === 'released';
  return [
    { key: 'paid', label: 'Paid', done: true },
    { key: 'held', label: 'Held', done: true, current: ['paid_held', 'shipped', 'delivered', 'problem'].includes(st) },
    { key: 'released', label: st === 'refunded' ? 'Refunded' : 'Released', done: released || st === 'refunded', current: released || st === 'refunded' },
    { key: 'paidout', label: 'Paid out', done: released },
  ];
}

// What the seller actually keeps from one order.
function payoutFor(order, cfg = CONFIG) {
  const gross = order.total;
  const fee = cfg.trovePaysCardFee ? 0 : order.cardFee;   // seller's share of card processing
  const marketplace = Math.round(order.subtotal * cfg.marketplaceFeePct / 100);
  const label = order.labelCost || 0;
  const itemCost = order.items.reduce((s, it) => s + (it.cost || 0) * it.qty, 0);
  const net = gross - fee - marketplace - order.tax;
  return { gross, fee, marketplace, tax: order.tax, net, label, itemCost, profit: net - label - itemCost };
}

function moneySummary(orders, cfg = CONFIG) {
  const out = { held: 0, released: 0, inPerson: 0, refunded: 0, fees: 0, profit: 0, count: 0 };
  orders.forEach(o => {
    const p = payoutFor(o, cfg);
    const m = STATES[o.state].money;
    if (m === 'held') out.held += p.net;
    if (m === 'released') { out.released += p.net; out.fees += p.fee; out.profit += p.profit; out.count++; }
    if (m === 'in_person') { out.inPerson += p.gross; out.profit += p.profit; out.count++; }
    if (m === 'refunded') out.refunded += o.total;
  });
  return out;
}

// ---------- notifications ----------
// 'essentials' sends only what someone needs to know or act on; 'all' adds every step.

const NOTES = {
  paid:           { buyer: ['essential', 'Order confirmed. Your money is held until the item arrives.'], seller: ['essential', 'New order. Ship it by the deadline to get paid.'] },
  reserved:       { buyer: ['essential', 'Item reserved. Bring your handoff code to the meetup.'], seller: ['essential', 'Item reserved for a meetup. Pay is collected at the handoff.'] },
  ship:           { buyer: ['essential', 'Shipped. Track it from your order page.'] },
  deliver:        { buyer: ['essential', 'Delivered. Check it, then tap "Got it" or report a problem.'], seller: ['step', 'Marked as delivered. Payment releases after the buyer\'s check window.'] },
  delivered_scan: { buyer: ['essential', 'Delivered. Check it over, then tap "Got it" or report a problem.'], seller: ['step', 'Delivered. Payment releases after the buyer\'s check window.'] },
  confirm:        { seller: ['essential', 'The buyer confirmed. Payment released.'], buyer: ['step', 'Thanks! The seller has been paid.'] },
  report:         { seller: ['essential', 'The buyer reported a problem. Payment stays held while you sort it out.'], buyer: ['step', 'We\'ve told the seller. Your money stays held.'] },
  handoff:        { seller: ['essential', 'Handoff confirmed.'], buyer: ['essential', 'Handoff confirmed. Enjoy your find!'] },
  cancel:         { buyer: ['essential', 'Order cancelled.'], seller: ['essential', 'Order cancelled.'] },
  resolve_release:{ buyer: ['essential', 'Problem closed. Payment released to the seller.'], seller: ['essential', 'Problem closed. Payment released.'] },
  resolve_refund: { buyer: ['essential', 'Refund issued.'], seller: ['essential', 'Order refunded.'] },
  auto_refund:    { buyer: ['essential', 'The seller didn\'t ship in time, so you\'ve been refunded in full.'], seller: ['essential', 'Not shipped in time: the buyer was refunded.'] },
  auto_release:   { seller: ['essential', 'Check window passed. Payment released.'] },
  no_scan:        { buyer: ['essential', 'No delivery scan yet. Your money stays held while we look into it.'], seller: ['essential', 'No delivery scan for this order. Add proof of delivery.'] },
  no_show:        { buyer: ['essential', 'The meetup passed without a handoff, so the reservation was cancelled.'], seller: ['essential', 'Meetup passed without a handoff. The item is back on sale.'] },
};

function notificationsFor(action, prefs = {}) {
  const n = NOTES[action] || {};
  const out = [];
  for (const who of ['buyer', 'seller']) {
    if (!n[who]) continue;
    const [kind, text] = n[who];
    const level = prefs[who] || 'essentials';
    if (level === 'off') continue;
    if (kind === 'essential' || level === 'all') out.push({ to: who, kind, text });
  }
  return out;
}

// ---------- search ----------

const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'for', 'with', 'of', 'in', 'to', 'old', 'vintage', 'antique']);

// Pulls simple filters out of a plain-language query, e.g. "brass lamp under $40 pickup".
function parseQuery(q) {
  let text = ' ' + String(q || '').toLowerCase() + ' ';
  const f = {};
  const price = text.match(/\s(?:under|below|less than|max|<)\s*\$?(\d+(?:\.\d+)?)/);
  if (price) { f.maxPrice = cents(price[1]); text = text.replace(price[0], ' '); }
  const over = text.match(/\s(?:over|above|more than|min|>)\s*\$?(\d+(?:\.\d+)?)/);
  if (over) { f.minPrice = cents(over[1]); text = text.replace(over[0], ' '); }
  if (/\s(pickup|pick up|meetup|meet up|local)\s/.test(text)) { f.local = true; text = text.replace(/\s(pickup|pick up|meetup|meet up|local)(?=\s)/g, ' '); }
  const era = text.match(/\s(1[89]\d0)s?\s/);
  if (era) f.decade = Number(era[1]);
  f.words = text.split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w) && !(era && w.startsWith(era[1])));
  return f;
}

function itemText(it) {
  return [it.title, it.description, it.category, it.material, it.maker, it.era, it.game].join(' ').toLowerCase();
}

function matches(it, f) {
  if (it.status && it.status !== 'active') return false;
  if (f.digital != null && !!it.digital !== f.digital) return false;
  if (f.maxPrice != null && it.price > f.maxPrice) return false;
  if (f.minPrice != null && it.price < f.minPrice) return false;
  if (f.local && !it.meetup) return false;
  if (f.category && it.category !== f.category) return false;
  if (f.condition && it.condition !== f.condition) return false;
  if (f.decade && !(it.decade && it.decade >= f.decade && it.decade < f.decade + 10)) return false;
  return true;
}

// Scores each item by how many query words it contains (title words count double).
function search(items, query, extra = {}, sort = 'best') {
  const f = { ...parseQuery(query), ...extra };
  const scored = [];
  items.forEach(it => {
    if (!matches(it, f)) return;
    let score = 0;
    const text = itemText(it), title = it.title.toLowerCase();
    for (const w of f.words) {
      const stem = w.length > 3 ? w.replace(/(es|s)$/, '') : w;
      if (title.includes(stem)) score += 2; else if (text.includes(stem)) score += 1; else { score = -1; break; }
    }
    if (score >= 0) scored.push({ it, score });
  });
  const by = {
    best: (a, b) => b.score - a.score || b.it.listedAt - a.it.listedAt,
    newest: (a, b) => b.it.listedAt - a.it.listedAt,
    low: (a, b) => a.it.price - b.it.price,
    high: (a, b) => b.it.price - a.it.price,
  }[sort] || ((a, b) => b.score - a.score);
  return { results: scored.sort(by).map(s => s.it), filters: f };
}

// ---------- listings ----------

// A digital listing needs different details from a physical one: no condition, box or measurements.
function validateDigital(it) {
  const errs = [];
  if (!it.title || it.title.trim().length < 3) errs.push('Give it a title.');
  if (!(it.price > 0)) errs.push('Set a price.');
  if (!DIGITAL_KINDS[it.digital]) errs.push('Choose what kind of thing it is.');
  if (!it.description || it.description.trim().length < 10) errs.push('Say what the buyer gets.');
  if (it.digital === 'session') {
    if (!(it.durationMin > 0)) errs.push('Set how long a session is.');
    if (!(it.slots && it.slots.length)) errs.push('Add at least one time buyers can book.');
  }
  if (it.digital === 'ingame') {
    if (!it.game || !it.game.trim()) errs.push('Name the game.');
    if (!it.gameAllowsTrade) errs.push("Confirm the game's rules allow selling this item for money.");
  }
  return errs;
}

// Session times still free to book: in the future and not already booked.
function openSlots(item, orders, now) {
  const taken = new Set(orders.filter(o => o.digital && o.digital.at && !['refunded', 'cancelled'].includes(o.state) && o.items.some(l => l.id === item.id)).map(o => o.digital.at));
  return (item.slots || []).filter(t => t > now && !taken.has(t)).sort((a, b) => a - b);
}

const CONDITIONS = [
  ['new', 'New', 'Unused, in its box or with tags'],
  ['likenew', 'Like new', 'Barely used, no visible wear'],
  ['good', 'Good', 'Normal wear, small flaws'],
  ['fair', 'Fair', 'Clear wear or repairs'],
  ['parts', 'For parts', 'Broken or incomplete'],
];

function validateListing(it) {
  const errs = [];
  if (!it.title || it.title.trim().length < 3) errs.push('Give it a title.');
  if (!(it.price > 0)) errs.push('Set a price.');
  if (!CONDITIONS.some(c => c[0] === it.condition)) errs.push('Pick a condition.');
  if (!it.flaws || !it.flaws.trim()) errs.push('Describe any flaws, or write "None".');
  if (!it.size) errs.push('Pick a box size.');
  if (!it.measurements || !it.measurements.trim()) errs.push('Add measurements.');
  // Age matters for antiques but is optional for everything else
  if (it.era && it.era.trim() && !['estimated', 'confirmed'].includes(it.ageSure)) errs.push('Say whether the age is estimated or confirmed.');
  return errs;
}

// ---------- seller analytics ----------

// Sales per week for the last `weeks` weeks (oldest first), counting money the seller has actually earned.
function weeklySales(orders, sellerId, now, weeks = 8) {
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) out.push({ start: now - (i + 1) * 7 * DAY, end: now - i * 7 * DAY, total: 0, count: 0 });
  orders.filter(o => o.sellerId === sellerId && ['released', 'completed'].includes(o.state)).forEach(o => {
    const w = out.find(b => o.closedAt > b.start && o.closedAt <= b.end);
    if (w) { w.total += o.subtotal; w.count++; }
  });
  return out;
}

// Who is interested in what. Events: { itemId, kind: 'view' | 'save' | 'question' | 'cart', who, at }.
// Returns one row per item with counts and the named people (guests are counted, not named), busiest first.
function interestByItem(events, items) {
  const rows = {};
  items.forEach(it => { rows[it.id] = { item: it, view: 0, save: 0, question: 0, cart: 0, people: [], last: 0 }; });
  events.forEach(e => {
    const r = rows[e.itemId];
    if (!r) return;
    r[e.kind] = (r[e.kind] || 0) + 1;
    r.last = Math.max(r.last, e.at);
    if (e.kind !== 'view' && e.who && !r.people.some(p => p.who === e.who && p.kind === e.kind)) r.people.push({ who: e.who, kind: e.kind, at: e.at });
  });
  const score = r => r.view + 3 * r.save + 4 * r.question + 5 * r.cart;
  return Object.values(rows).filter(r => score(r) > 0).sort((a, b) => score(b) - score(a) || b.last - a.last);
}

// Upcoming meetups and drop-offs, grouped by day (local date key), soonest first.
function scheduleByDay(orders, sellerId, now) {
  const days = {};
  orders.filter(o => o.sellerId === sellerId && o.meetup && o.meetup.at && ['paid_held', 'reserved'].includes(o.state) && o.meetup.at >= now - DAY)
    .sort((a, b) => a.meetup.at - b.meetup.at)
    .forEach(o => {
      const d = new Date(o.meetup.at);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      (days[key] = days[key] || []).push(o);
    });
  return Object.entries(days).map(([day, list]) => ({ day, orders: list }));
}

// Items grouped by category in a fixed order, for shop sections and the listings table.
function groupByCategory(items, order) {
  const groups = {};
  items.forEach(it => { (groups[it.category || 'Other'] = groups[it.category || 'Other'] || []).push(it); });
  const keys = Object.keys(groups).sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  return keys.map(k => ({ category: k, items: groups[k] }));
}

// ---------- seller analytics (charts on the Insights tab) ----------
// All take a time window [from, to] in ms so one date filter scopes every chart.

const SOLD = ['released', 'completed'];
const soldIn = (orders, sellerId, from, to) =>
  orders.filter(o => o.sellerId === sellerId && SOLD.includes(o.state) && o.closedAt > from && o.closedAt <= to);

// Totals for a window and the window before it, for "vs previous period" deltas.
function periodCompare(orders, sellerId, now, days, cfg = CONFIG) {
  const sum = (from, to) => soldIn(orders, sellerId, from, to).reduce((t, o) => {
    const p = payoutFor(o, cfg);
    return { sales: t.sales + o.subtotal, profit: t.profit + p.profit, count: t.count + 1 };
  }, { sales: 0, profit: 0, count: 0 });
  return { current: sum(now - days * DAY, now), previous: sum(now - 2 * days * DAY, now - days * DAY) };
}

// One cell per calendar day (local time), oldest first, for the sales calendar.
function salesByDay(orders, sellerId, now, days) {
  const end = new Date(now); end.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    out.push({ start: d.getTime(), end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(), weekday: d.getDay(), total: 0, count: 0 });
  }
  soldIn(orders, sellerId, out[0].start - 1, out[out.length - 1].end).forEach(o => {
    const c = out.find(x => o.closedAt >= x.start && o.closedAt < x.end);
    if (c) { c.total += o.subtotal; c.count++; }
  });
  return out;
}

// Each sold item: its price and how many days it was listed before it sold.
function timeToSell(orders, items, sellerId, from, to) {
  const out = [];
  soldIn(orders, sellerId, from, to).forEach(o => o.items.forEach(line => {
    const it = items.find(i => i.id === line.id);
    if (!it || !it.listedAt) return;
    out.push({ id: it.id, title: it.title, category: it.category || 'Other', price: line.price,
      days: Math.max(0, Math.round((o.closedAt - it.listedAt) / DAY * 10) / 10) });
  }));
  return out;
}

// Views -> saves or questions -> carts -> sold, for one seller's items in a window.
function salesFunnel(events, orders, items, sellerId, from, to) {
  const mine = new Set(items.filter(i => i.sellerId === sellerId).map(i => i.id));
  const ev = events.filter(e => mine.has(e.itemId) && e.at > from && e.at <= to);
  const n = kinds => ev.filter(e => kinds.includes(e.kind)).length;
  const sold = soldIn(orders, sellerId, from, to).reduce((s, o) => s + o.items.length, 0);
  return [
    { step: 'Views', value: n(['view']) },
    { step: 'Saves and questions', value: n(['save', 'question']) },
    { step: 'Added to cart', value: n(['cart']) },
    { step: 'Sold', value: sold },
  ];
}

// How long current listings have been waiting, in age bands.
const AGE_BANDS = [[0, 7, '0 to 7 days'], [7, 30, '1 to 4 weeks'], [30, 60, '1 to 2 months'], [60, Infinity, 'Over 2 months']];
function stockAge(items, sellerId, now) {
  const live = items.filter(i => i.sellerId === sellerId && i.status === 'active');
  return AGE_BANDS.map(([lo, hi, label]) => {
    const list = live.filter(i => { const d = (now - i.listedAt) / DAY; return d >= lo && d < hi; });
    return { label, count: list.length, value: list.reduce((s, i) => s + i.price * (i.qty || 1), 0), items: list };
  });
}

// From sales to profit: what each cost takes out.
function profitSteps(orders, sellerId, from, to, cfg = CONFIG) {
  const t = { sales: 0, shipping: 0, itemCost: 0, labels: 0, fees: 0, profit: 0 };
  soldIn(orders, sellerId, from, to).forEach(o => {
    const p = payoutFor(o, cfg);
    t.sales += o.subtotal; t.shipping += o.shipping; t.itemCost += p.itemCost; t.labels += p.label;
    t.fees += p.fee + p.marketplace; t.profit += p.profit;
  });
  return t;
}

// Average cost and price per item, by category: the markup a seller gets on each kind of thing.
function markupByCategory(orders, items, sellerId, from, to) {
  const g = {};
  soldIn(orders, sellerId, from, to).forEach(o => o.items.forEach(line => {
    const it = items.find(i => i.id === line.id);
    const c = (it && it.category) || 'Other';
    g[c] = g[c] || { category: c, cost: 0, price: 0, n: 0 };
    g[c].cost += (line.cost || 0) * line.qty; g[c].price += line.price * line.qty; g[c].n += line.qty;
  }));
  return Object.values(g).map(x => ({ category: x.category, n: x.n, cost: Math.round(x.cost / x.n), price: Math.round(x.price / x.n) }))
    .sort((a, b) => (b.price - b.cost) - (a.price - a.cost));
}

// When handoffs happen: weekday (0 = Sunday) by time of day, from completed meetups and drop-offs.
const TIME_BANDS = [[6, 12, 'Morning'], [12, 17, 'Afternoon'], [17, 21, 'Evening'], [21, 30, 'Late']];
function meetupTimes(orders, sellerId, from, to) {
  const grid = Array.from({ length: 7 }, () => TIME_BANDS.map(() => 0));
  soldIn(orders, sellerId, from, to).filter(o => o.meetup && o.meetup.at).forEach(o => {
    const d = new Date(o.meetup.at), h = d.getHours() < 6 ? d.getHours() + 24 : d.getHours();
    const b = TIME_BANDS.findIndex(([lo, hi]) => h >= lo && h < hi);
    if (b >= 0) grid[d.getDay()][b]++;
  });
  return grid;
}

// ---------- accounting export ----------

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function isoDate(ms) { return new Date(ms).toISOString().slice(0, 10); }

// One row per closed order, in dollars, ready for a spreadsheet or accounting import.
function ordersCsv(orders, cfg = CONFIG) {
  const head = ['Date', 'Order', 'Items', 'Fulfilment', 'Payment', 'Status', 'Item sales', 'Shipping charged', 'Tax collected',
    'Total', 'Card fee', 'Net received', 'Shipping label', 'Item cost', 'Profit'];
  const rows = orders.filter(o => o.closedAt && o.state !== 'cancelled').map(o => {
    const p = payoutFor(o, cfg);
    const d = c => (c / 100).toFixed(2);
    const refunded = o.state === 'refunded';
    return [isoDate(o.closedAt), o.id, o.items.map(i => i.title).join('; '), o.fulfilment, o.payment, STATES[o.state].label,
      d(refunded ? 0 : o.subtotal), d(refunded ? 0 : o.shipping), d(refunded ? 0 : o.tax), d(refunded ? 0 : o.total),
      d(refunded ? 0 : p.fee), d(refunded ? 0 : p.net), d(p.label), d(refunded ? 0 : p.itemCost), d(refunded ? -p.label : p.profit)];
  });
  return [head, ...rows].map(r => r.map(csvCell).join(',')).join('\n') + '\n';
}

// ---------- Pulse: the shop's heartbeat ----------
// Each factor is scored 0 to 1 from the seller's own data; the seller weights them 0 to 5.
// The weighted average maps onto a heart rate: 48 bpm resting, 180 bpm racing.
const HB_FACTORS = [
  { key: 'sales', label: 'Sales momentum', w: 5, why: 'Sales this period against the one before.' },
  { key: 'orders', label: 'Order momentum', w: 3, why: 'Number of orders against the period before.' },
  { key: 'attention', label: 'Buyer attention', w: 3, why: 'Listing views against the period before.' },
  { key: 'demand', label: 'Demand', w: 3, why: 'Saves and carts for each live listing.' },
  { key: 'conversion', label: 'Conversion', w: 3, why: 'Orders for every view. 10% or better scores full.' },
  { key: 'fresh', label: 'Fresh stock', w: 2, why: 'New listings this period, for each live one.' },
  { key: 'replies', label: 'Replies', w: 2, why: 'Share of buyer questions answered.' },
  { key: 'speed', label: 'Shipping speed', w: 2, why: 'Days from payment to shipping. Same day scores full.' },
  { key: 'trust', label: 'Trust', w: 2, why: 'Share of orders with no problem reported.' },
];
const HB_PRESETS = {
  balanced: { sales: 3, orders: 3, attention: 3, demand: 3, conversion: 3, fresh: 3, replies: 3, speed: 3, trust: 3 },
  growth: { sales: 5, orders: 4, attention: 4, demand: 3, conversion: 2, fresh: 3, replies: 1, speed: 1, trust: 1 },
  reputation: { sales: 1, orders: 1, attention: 1, demand: 2, conversion: 2, fresh: 1, replies: 5, speed: 5, trust: 5 },
  hustle: { sales: 2, orders: 3, attention: 3, demand: 4, conversion: 3, fresh: 5, replies: 4, speed: 2, trust: 1 },
};
const HB_MIN = 48, HB_MAX = 180;
const clamp01 = v => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

// Growth against the period before as 0 to 1: level is 0.5, double is 0.67, half is 0.33.
function momentum(now, before) {
  if (!before) return now ? 0.75 : 0.5;
  const r = now / before;
  return clamp01(r / (1 + r));
}

function heartZone(bpm) {
  return bpm < 72 ? 'resting' : bpm < 100 ? 'steady' : bpm < 130 ? 'rising' : 'racing';
}

// scores: { key: 0..1 }, weights: { key: 0..5 }. Returns the heart rate and each factor's share of it.
function heartbeat(scores, weights) {
  const w = k => Math.max(0, Math.min(5, weights && weights[k] != null ? +weights[k] : HB_FACTORS.find(f => f.key === k).w));
  const total = HB_FACTORS.reduce((t, f) => t + w(f.key), 0);
  const parts = HB_FACTORS.map(f => {
    const score = clamp01(scores[f.key]), weight = w(f.key);
    return { key: f.key, score, weight, bpm: total ? (weight * score / total) * (HB_MAX - HB_MIN) : 0 };
  });
  const composite = total ? parts.reduce((t, p) => t + p.weight * p.score, 0) / total : 0;
  const bpm = Math.round(HB_MIN + composite * (HB_MAX - HB_MIN));
  return { bpm, composite, zone: heartZone(bpm), parts };
}

// How many bpm each factor would add if it were perfect, best first.
function heartGains(scores, weights) {
  const base = heartbeat(scores, weights).bpm;
  return HB_FACTORS.map(f => ({ key: f.key, gain: heartbeat({ ...scores, [f.key]: 1 }, weights).bpm - base }))
    .filter(g => g.gain > 0).sort((a, b) => b.gain - a.gain);
}

if (typeof module !== 'undefined') {
  module.exports = {
    CONFIG, DAY, STATES, ACTIONS, CONDITIONS, HB_FACTORS, HB_PRESETS, HB_MIN, HB_MAX, momentum, heartZone, heartbeat, heartGains,
    cents, fmtMoney, cardFee, PAY_METHODS, ALL_METHODS, methodsFor, processingFee, packBoxes, shippingFor, spareSmallSlots, cartTotals, splitBySeller, cartTotalsAll, sellerStats,
    makeHandoffCode, createOrder, canDo, transition, sweep, moneySteps, payoutFor, moneySummary,
    notificationsFor, parseQuery, search, validateListing, ordersCsv, csvCell,
    DIGITAL_KINDS, DIGITAL_CATEGORIES, isDigital, validateDigital, openSlots,
    weeklySales, interestByItem, scheduleByDay, groupByCategory,
    periodCompare, salesByDay, timeToSell, salesFunnel, stockAge, AGE_BANDS, profitSteps, markupByCategory, meetupTimes, TIME_BANDS,
  };
}
