// Trove: where data lives. In demo mode everything is kept in this browser's localStorage.
// Later this file is the one place that changes to talk to the real database (see PROCESS.md),
// so app.js only ever calls Store.* and never touches storage directly.

const Store = (() => {
  const KEY = 'trove.v3';
  let state = null;

  function fresh() {
    const now = Date.now();
    const items = sampleItems(now);
    const past = sampleHistory(now, items);
    return {
      items: items.concat(past.items), events: past.events, recent: [],
      sellers: SAMPLE_SELLERS.map(x => ({ ...x })),
      actingSeller: 's1',   // demo only: which seller's dashboard you're looking at
      orders: past.orders, wants: [{ what: 'cast iron skillet', max: 4000, at: now - DAY }, { what: 'vintage film camera', max: null, at: now - 2 * DAY }],
      misses: [{ q: 'record player', at: now - DAY, count: 3 }], inbox: [],
      cart: [], favs: [],
      prefs: { buyer: 'essentials', seller: 'essentials', marketing: false, lang: 'en', density: 'large', heroHidden: false, tourDone: false },
      me: { name: '', email: '' },
      clockDays: 0, seq: 1001,
    };
  }

  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
    if (!state || !Array.isArray(state.items)) state = fresh();
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }   // full or blocked: the page keeps working for this visit
  }

  return {
    get: () => state || load(),
    save,
    reset() { state = fresh(); save(); },
    now: () => Date.now() + (state ? state.clockDays : 0) * 86400000,
    nextOrderId() { const id = 'T-' + state.seq++; return id; },
  };
})();
