// Trove: the guided tour. It runs on an example shop, so nothing a visitor does in the tour touches their own data.
//
// Each step is one entry: its section, the page to open, the part to highlight, the words, and an optional action
// that does something live (search, add to cart, check out, confirm a handoff). Adding a step means adding an entry.
// tests/tour.check.js runs every step and fails if a highlighted part has been renamed or removed.

const TOUR_SECTIONS = [
  ['start', 'Quick look', '快速了解'],
  ['buy', 'Buying', '购买'],
  ['sell', 'Selling', '出售'],
  ['digital', 'Trove Digital', 'Trove 数字'],
  ['dash', 'Seller dashboard', '卖家中心'],
  ['insights', 'Insights', '洞察'],
];

const tq = sel => document.querySelector(sel);
const fill = (sel, v) => { const el = tq(sel); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } };
const tourState = { order: null, listing: null, handedOff: false, booking: null };

// The example listing the selling steps fill in, bit by bit.
function fillListing(withCost) {
  if (!tq('[data-form=listing]')) return;
  if (!pendingPhotos.length) {
    pendingPhotos = ['data:image/svg+xml;charset=utf-8,' + encodeURIComponent(artSvg('candle', '#eadfc9'))];
    drawPreviews();
  }
  fill('[data-form=listing] [name=alt]', 'Drawing of a brass bell');
  fill('[data-form=listing] [name=title]', 'Brass desk bell (example)');
  fill('[data-form=listing] [name=price]', '24');
  const cat = tq('#catSelect'); if (cat) { cat.value = 'Home'; cat.dispatchEvent(new Event('change', { bubbles: true })); }
  const good = tq('[data-form=listing] [name=condition][value=good]'); if (good) good.checked = true;
  fill('[data-form=listing] [name=flaws]', 'Small dent on the base. Rings clearly.');
  fill('[data-form=listing] [name=measurements]', '9 cm across');
  if (withCost) { const d = tq('[data-form=listing] details'); if (d) d.open = true; fill('[data-form=listing] [name=cost]', '6'); }
}

const TOUR_STEPS = [
  // ---- quick look ----
  { section: 'start', route: '#/', target: '#hero',
    title: ['Welcome to Trove', '欢迎来到 Trove'],
    text: ['A marketplace with no fees for buyers or sellers. This tour runs on an example shop, so click around freely. Nothing here is saved.',
      '一个买卖双方都不收费的市场。导览使用示例店铺，可以随便点，这里的操作都不会保存。'] },
  { section: 'start', route: '#/', target: '#hero .fee-badge',
    title: ['No fees, either side', '买卖双方都免费'],
    text: ['Sellers keep the full price. Buyers pay the price and any delivery, nothing more.', '卖家拿到全部售价。买家只付价格和运费。'] },
  { section: 'start', route: '#/', target: '#searchForm',
    title: ['Search in plain words', '直接搜索'],
    text: ['Type what you want, even “lamp under $30”. Trove reads the price for you.', '直接输入想要的东西，比如“30 元以下的灯”。'] },
  { section: 'start', route: '#/', target: '#browseMenu summary',
    title: ['Browse by type or price', '按类别或价格浏览'],
    text: ['Types, price ranges and pickup near you are all in this one menu.', '类别、价格区间和附近自取都在这个菜单里。'] },
  { section: 'start', route: '#/', target: () => tq('#hero .features'),
    title: ['Pick a part to see it work', '选一个部分看看'],
    text: ['Next we buy a lantern, list something for sale, book a lesson on Trove Digital, then run the seller dashboard. Use the menu in this card to jump anywhere.',
      '接下来我们会买一盏灯、上架一件商品、在 Trove 数字预约一节课，再看看卖家中心。可以用卡片里的菜单跳到任何部分。'] },

  // ---- buying ----
  { section: 'buy', route: '#/?q=lantern', target: '#app .card',
    run: () => fill('#searchForm input', 'lantern'),
    title: ['Search results', '搜索结果'],
    text: ['We searched for “lantern”. Every card shows the price, the condition and whether it ships.', '我们搜索了“lantern”。每张卡片都显示价格、成色和能否邮寄。'] },
  { section: 'buy', route: '#/item/i112', target: '.bigprice',
    title: ['Everything up front', '信息一目了然'],
    text: ['Price, condition, and how you get it: this one is pickup only. Flaws and measurements are listed below.',
      '价格、成色和取货方式：这件只能自取。瑕疵和尺寸写在下面。'] },
  { section: 'buy', route: '#/item/i112', target: '[data-form=ask]',
    title: ['Ask the seller', '问卖家'],
    text: ['Questions and answers stay on the listing, so the next buyer sees them too.', '问答会留在商品页上，后来的买家也能看到。'] },
  { section: 'buy', route: '#/item/i112', target: 'nav.main a[data-nav=cart]',
    run: () => { const st = S(); if (!st.cart.some(c => c.id === 'i112') && !tourState.order) { st.cart.push({ id: 'i112', qty: 1 }); route(); } },
    title: ['Added to the cart', '已加入购物车'],
    text: ['We added the lantern. Items from different sellers become separate orders automatically.', '灯已经加入购物车。不同卖家的商品会自动分成不同订单。'] },
  { section: 'buy', route: '#/cart', target: '[data-form=choice]', skipIf: () => !!tourState.order,
    run: () => { if (tourState.order) return; S().checkout = { fulfilment: 'meetup', payment: 'online' }; route(); },
    title: ['Pick up, pay now, protected', '自取，现在付款，有保障'],
    text: ['Pickup is free. Paying now means Trove holds the money until you have the lantern in your hands.',
      '自取免费。现在付款的话，Trove 会保管这笔钱，直到你拿到灯。'] },
  { section: 'buy', route: '#/checkout', target: '[data-form=checkout]',
    skipIf: () => !!tourState.order,
    run: () => { fill('[data-form=checkout] [name=name]', 'Jordan Lee (example)'); fill('[data-form=checkout] [name=email]', 'jordan@example.com'); },
    title: ['Checkout', '结账'],
    text: ['We filled in an example buyer. Choose a public meeting spot and a time, then pay. No card is charged in this demo.',
      '我们填了一位示例买家。选一个公共见面地点和时间，然后付款。演示中不会扣款。'] },
  { section: 'buy', route: () => tourState.order ? '#/order/' + tourState.order : null, target: '.code',
    run: () => {
      if (tourState.order) return;
      const f = tq('[data-form=checkout]');
      if (!f) return;
      const before = new Set(S().orders.map(o => o.id));
      f.requestSubmit();
      const made = S().orders.find(o => !before.has(o.id));
      if (made) tourState.order = made.id;
    },
    title: ['Your 6-digit handoff code', '你的 6 位交接码'],
    text: ['At the meetup, check the lantern first. When you are happy, read this code to the seller. That finishes the sale.',
      '见面时先检查灯。满意后把这个码念给卖家，交易就完成了。'] },
  { section: 'buy', route: () => tourState.order ? '#/order/' + tourState.order : null, target: 'ol.money',
    title: ['Where your money is', '你的钱在哪里'],
    text: ['Paid, then held by Trove, then released to the seller after the handoff. If the seller never shows, you get it back.',
      '付款后由 Trove 保管，交接后才给卖家。如果卖家没来，钱会退还给你。'] },

  // ---- selling ----
  { section: 'sell', route: '#/sell/new', target: '#dropZone',
    skipIf: () => !!tourState.listing,
    title: ['Photos first', '先拍照'],
    text: ['Add photos straight from your phone, flaws included. Several at once is fine.', '直接用手机添加照片，包括瑕疵。一次可以加好几张。'] },
  { section: 'sell', route: '#/sell/new', target: () => { const i = tq('[data-form=listing] [name=title]'); return i && i.closest('label'); },
    skipIf: () => !!tourState.listing,
    run: () => fillListing(),
    title: ['A title, a price, the flaws', '标题、价格、瑕疵'],
    text: ['We filled in an example: title, price, type, condition and any flaws. Honest flaws mean fewer returns.',
      '我们填了一个例子：标题、价格、类别、成色和瑕疵。如实写瑕疵，退货更少。'] },
  { section: 'sell', route: '#/sell/new', target: () => { const i = tq('[data-form=listing] [name=cost]'); return i && i.closest('label'); },
    skipIf: () => !!tourState.listing,
    run: () => fillListing(true),
    title: ['What you paid stays private', '成本只有你能看到'],
    text: ['Buyers never see this. Trove uses it to show your real profit on every sale.', '买家看不到。Trove 用它算出每笔销售的真实利润。'] },
  { section: 'sell', route: '#/sell/new', target: () => { const i = tq('[data-form=listing] [name=size]'); return i && i.closest('fieldset'); },
    skipIf: () => !!tourState.listing,
    title: ['Box size sets shipping', '箱子大小决定运费'],
    text: ['Pick a box size and shipping is worked out for the buyer. Small things can share a box.', '选好箱子大小，运费会自动算好。小东西可以放在同一个箱子里。'] },
  { section: 'sell', route: () => tourState.listing ? '#/item/' + tourState.listing : null, target: '[data-act=share]',
    run: () => {
      if (tourState.listing) return;
      const f = tq('[data-form=listing]');
      if (!f) return;
      fillListing(true);
      const before = new Set(S().items.map(i => i.id));
      f.requestSubmit();
      const made = S().items.find(i => !before.has(i.id));
      if (made) tourState.listing = made.id;
    },
    title: ['Live, and ready to share', '已上架，可以分享'],
    text: ['Published. Share the link to WeChat, RedNote or Facebook in one tap. Listing is free.', '已发布。一键分享到微信、小红书或 Facebook。上架免费。'] },

  // ---- Trove Digital ----
  { section: 'digital', route: '#/', target: '.dshelf',
    title: ['Trove Digital', 'Trove 数字'],
    text: ['Lessons, expert advice, downloads and game items, sold by the same people with the same no-fee checkout. Each side sends buyers to the other.',
      '课程、专家咨询、下载和游戏物品，由同一批卖家出售，结账同样免费。两边互相带来买家。'] },
  { section: 'digital', route: '#/digital', target: '.dhow',
    title: ['Held until it happens', '完成后才放款'],
    text: ['Sessions are paid after they happen. Downloads get 2 days to check. Game items wait until the buyer confirms they arrived.',
      '课程结束后才付给卖家。下载有 2 天检查期。游戏物品要等买家确认收到。'] },
  { section: 'digital', route: '#/item/g101', target: '.slots',
    title: ['Pick a time', '选择时间'],
    text: ['This antique shop also sells 30-minute appraisals by video call. Buyers pick one of the open times.',
      '这家古董店也提供 30 分钟视频鉴定。买家从空闲时间里选一个。'] },
  { section: 'digital', route: () => tourState.booking ? '#/order/' + tourState.booking : null, target: '.dpanel',
    run: () => {
      if (tourState.booking) return;
      const f = tq('[data-form=buyDigital]');
      if (!f) return;
      if (!f.elements.name.value) f.elements.name.value = 'Mei Lin';
      if (!f.elements.email.value) f.elements.email.value = 'mei@example.com';
      const before = new Set(S().orders.map(o => o.id));
      f.requestSubmit();
      const made = S().orders.find(o => !before.has(o.id));
      if (made) tourState.booking = made.id;
    },
    title: ['Booked', '已预约'],
    text: ['We booked the first time. The money is held by Trove until the session is over, and refunded if it never happens.',
      '我们预约了第一个时间。款项由 Trove 托管到课程结束；如果课程没有进行就退款。'] },
  { section: 'digital', route: '#/dashboard', target: () => { const b = tq('[data-act=sessionDone]:not([disabled])'); return b && b.closest('.todo'); },
    title: ['Sessions on the same dashboard', '课程也在同一个后台'],
    text: ['Yesterday’s appraisal is done, so the seller marks it here. The buyer has 2 days to report a problem, then the money is paid out.',
      '昨天的鉴定已经完成，卖家在这里标记。买家有 2 天可以报告问题，之后款项就会付出。'] },

  // ---- seller dashboard ----
  { section: 'dash', route: '#/dashboard', target: '.side',
    title: ['Your seller dashboard', '你的卖家中心'],
    text: ['This is the example shop, Maple Lane Finds. Everything for selling is in this sidebar.', '这是示例店铺 Maple Lane Finds。卖东西需要的都在侧边栏里。'] },
  { section: 'dash', route: '#/dashboard', target: '.console .tiles',
    title: ['The last 30 days at a glance', '最近 30 天一目了然'],
    text: ['Sales, orders and views, each with a small trend line. Click a card to open its page.', '销售额、订单和浏览量，每项都有小趋势线。点卡片可以打开详情。'] },
  { section: 'dash', route: '#/dashboard', target: () => { const f = tq('[data-form=handoff]'); return f && f.closest('.todo'); },
    skipIf: () => tourState.handedOff,
    run: () => {
      const f = tq('[data-form=handoff]'); if (!f) return;
      const o = S().orders.find(x => x.id === f.dataset.id);
      if (o) fill('[data-form=handoff] [name=code]', o.handoffCode);
    },
    title: ['At the meetup: enter the code', '见面时：输入交接码'],
    text: ['The buyer reads you their code. We typed it in for you. Confirming it finishes the sale.', '买家把码念给你。我们已经帮你输入了。确认后交易完成。'] },
  { section: 'dash', route: '#/dashboard', target: '.activity',
    run: () => { const f = tq('[data-form=handoff]'); if (f && !tourState.handedOff) { tourState.handedOff = true; f.requestSubmit(); } },
    title: ['Sale done, money released', '交易完成，款项已放出'],
    text: ['The handoff is confirmed and the sale shows up in your recent sales, with the profit after costs.', '交接已确认，这笔销售出现在最近销售里，并显示扣除成本后的利润。'] },
  { section: 'dash', route: '#/dashboard/schedule', target: '.cal',
    title: ['Meetups and ship-by dates', '见面和发货日期'],
    text: ['Two weeks at a glance. Busy days are marked so you can plan your errands.', '两周的安排一目了然。忙的日子会标出来。'] },
  { section: 'dash', route: '#/dashboard/interest', target: '#app .interest',
    title: ['Who is interested', '谁感兴趣'],
    text: ['Questions to answer come first, then views, saves and carts for each listing, with buyer names.', '先是要回答的问题，然后是每件商品的浏览、收藏和加购，附买家名字。'] },
  { section: 'dash', route: '#/dashboard/money', target: '.console .tiles',
    title: ['Money, clearly', '收入一清二楚'],
    text: ['On the way, earned, fees (none) and profit after what you paid for each item.', '在路上的、已到手的、手续费（没有）和扣除成本后的利润。'] },
  { section: 'dash', route: '#/dashboard/money', target: '[data-act=csv]',
    title: ['Ready for your accountant', '方便给会计'],
    text: ['Export every completed order as a spreadsheet for your books.', '把所有完成的订单导出成表格，方便记账。'] },

  // ---- insights ----
  { section: 'insights', route: '#/dashboard/insights', target: '.pact .seg',
    title: ['Pick a date range', '选择时间范围'],
    text: ['Every chart on this page follows this range, and the top cards compare with the period before.', '这个页面的所有图表都跟随这个范围，顶部卡片会和前一段时间对比。'] },
  { section: 'insights', route: '#/dashboard/insights', target: () => { const s = tq('.wf'); return s && s.closest('.viz'); },
    run: () => setTimeout(() => {
      const h = document.querySelectorAll('.wf .hit')[2]; if (!h) return;
      const r = h.getBoundingClientRect();
      h.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 3 }));
    }, 450),
    title: ['From sales to profit', '从销售额到利润'],
    text: ['Each cost steps down from your sales to what you keep. Hover any bar for the exact amount.', '每项成本从销售额中一步步扣除，剩下的就是你留下的。鼠标移到柱子上看具体金额。'] },
  { section: 'insights', route: '#/dashboard/insights', target: () => { const s = tq('.funnel'); return s && s.closest('.viz'); },
    title: ['Where buyers drop off', '买家在哪一步离开'],
    text: ['Views, then saves, then carts, then sales. A big drop tells you what to fix: photos, price or details.', '浏览、收藏、加购、成交。哪一步掉得多，就知道该改照片、价格还是描述。'] },
  { section: 'insights', route: '#/dashboard/insights', target: () => { const s = tq('.cal-heat'); return s && s.closest('.viz'); },
    title: ['Which days sell', '哪几天卖得好'],
    text: ['Darker days sold more. Post new things just before your best days.', '颜色越深卖得越多。在卖得最好的日子前上新。'] },
  { section: 'insights', route: '#/dashboard/insights', target: () => { const s = tq('.age'); return s && s.closest('.viz'); },
    run: () => { const b = tq('.age .hit[data-i="3"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.dispatchEvent(new MouseEvent('click', { bubbles: true })); },
    title: ['What has waited too long', '哪些等太久了'],
    text: ['We clicked “Over 2 months” to list those items. Each has a link to change its price.', '我们点了“超过 2 个月”，列出这些商品。每件都有改价链接。'] },
  { section: 'insights', route: '#/dashboard/insights', target: () => { const s = tq('.db'); return s && s.closest('.viz'); },
    title: ['Your best markups', '利润最高的类别'],
    text: ['What you paid against what it sold for, by type. Buy more of what earns the most.', '按类别比较成本和售价。多进利润最高的那类货。'] },
  { section: 'insights', route: '#/', target: '#menu summary',
    title: ['That’s the tour', '导览结束'],
    text: ['Orders, alerts, settings and 中文 live in this menu. Close the tour and your own data comes back exactly as it was.',
      '订单、提醒、设置和中文都在这个菜单里。关闭导览后，你自己的数据会原样恢复。'] },
];

const Tour = (() => {
  let at = -1, card = null, ring = null, raf = 0, poll = 0, target = null, returnTo = '#/';
  const zh = () => lang() === 'zh';
  const pick = pair => zh() ? pair[1] : pair[0];
  const valueOf = v => typeof v === 'function' ? v() : v;
  const sectionSteps = sec => TOUR_STEPS.map((s, i) => [s, i]).filter(([s]) => s.section === sec);

  function start(section) {
    if (at >= 0) { go(section ? firstOf(section) : 0); return; }
    returnTo = location.hash || '#/';
    Object.assign(tourState, { order: null, listing: null, handedOff: false, booking: null });
    Store.tourBegin((ex, own) => {
      // keep how the site looks and reads; everything else is the example shop
      ex.prefs = { ...ex.prefs, lang: own.prefs.lang, bg: own.prefs.bg, btn: own.prefs.btn, density: own.prefs.density, tourDone: true };
      ex.me = { name: 'Jordan Lee (example)', email: 'jordan@example.com' };
    });
    document.getElementById('menu').open = false;
    build();
    document.documentElement.classList.add('touring');
    go(section ? firstOf(section) : 0);
  }

  function firstOf(section) { return TOUR_STEPS.findIndex(s => s.section === section); }

  function end() {
    if (at < 0) return;
    at = -1;
    cancelAnimationFrame(raf); clearTimeout(poll);
    card.remove(); ring.remove(); card = ring = target = null;
    document.documentElement.classList.remove('touring');
    Store.tourEnd();
    if (!S().prefs.tourDone) { S().prefs.tourDone = true; save(); }
    if (location.hash === returnTo) route(); else location.hash = returnTo;
    toast(zh() ? '导览已关闭。你的数据已恢复。' : 'Tour closed. Your own data is back.');
  }

  function build() {
    ring = document.createElement('div'); ring.className = 'tour-ring'; ring.hidden = true;
    card = document.createElement('div'); card.className = 'tour-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Tour');
    document.body.append(ring, card);
    card.addEventListener('click', e => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      if (b.dataset.t === 'next') step(1); else if (b.dataset.t === 'back') step(-1); else if (b.dataset.t === 'close') end();
      else if (b.dataset.t === 'dot') go(+b.dataset.i);
    });
    card.addEventListener('change', e => { if (e.target.dataset.t === 'section') go(firstOf(e.target.value)); });
    follow();
  }

  function step(dir) {
    let i = at + dir;
    while (i >= 0 && i < TOUR_STEPS.length && TOUR_STEPS[i].skipIf && TOUR_STEPS[i].skipIf()) i += dir;
    if (i >= TOUR_STEPS.length) { end(); return; }
    if (i >= 0) go(i);
  }

  function go(i) {
    at = i; target = null; ring.hidden = true; clearTimeout(poll);
    const s = TOUR_STEPS[i];
    if (s.section !== 'buy') fill('#searchForm input', '');
    draw(s);
    const r = valueOf(s.route);
    const cur = location.hash || '#/';
    if (r && r !== cur) location.hash = r;
    // let the page render, then run the live demo and look for the part to highlight
    setTimeout(() => {
      if (at !== i) return;
      if (s.run) s.run();
      find(s, i, 0);
    }, 120);
  }

  // The part may only appear a moment later (after a re-render), so look again every 300 ms for a few seconds.
  function find(s, i, tries) {
    if (at !== i) return;
    const el = typeof s.target === 'function' ? s.target() : s.target && document.querySelector(s.target);
    if (el) { target = el; ring.hidden = false; scrollAbove(el); return; }
    if (tries < 12) poll = setTimeout(() => find(s, i, tries + 1), 300);
  }

  // Scroll so the part sits in view above the card.
  function scrollAbove(el) {
    const r = el.getBoundingClientRect(), cardTop = card.getBoundingClientRect().top;
    // keep clear of the sticky site header too
    const hdr = document.querySelector('body > header');
    const top = hdr && getComputedStyle(hdr).position === 'sticky' ? Math.max(16, hdr.getBoundingClientRect().bottom + 12) : 16;
    const room = cardTop - 16;
    if (r.top >= top && r.bottom <= room) return;
    const want = r.height > room - top ? r.top - top : r.top - (room - r.height) / 2;
    window.scrollBy({ top: want, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
  }

  // The highlight follows its part every frame, so it stays put through scrolling and layout changes.
  function follow() {
    raf = requestAnimationFrame(follow);
    if (!target || !ring) return;
    if (!target.isConnected) { const s = TOUR_STEPS[at]; target = null; ring.hidden = true; if (s) find(s, at, 0); return; }
    const r = target.getBoundingClientRect(), pad = 6;
    Object.assign(ring.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
  }

  function draw(s) {
    const steps = sectionSteps(s.section), pos = steps.findIndex(([, i]) => i === at);
    const first = at === 0, last = at === TOUR_STEPS.length - 1;
    card.innerHTML = `<div class="tc-top">
        <select data-t="section" aria-label="${zh() ? '跳到' : 'Jump to'}">${TOUR_SECTIONS.map(([k, en, cn]) => `<option value="${k}" ${k === s.section ? 'selected' : ''}>${esc(zh() ? cn : en)}</option>`).join('')}</select>
        <span class="tc-count">${pos + 1} / ${steps.length}</span>
        <button type="button" class="tc-x" data-t="close" aria-label="${zh() ? '关闭导览' : 'Close tour'}">✕</button></div>
      <h3>${esc(pick(s.title))}</h3>
      <p>${esc(pick(s.text))}</p>
      <div class="tc-foot">
        <div class="tc-dots">${steps.map(([, i]) => `<button type="button" data-t="dot" data-i="${i}" class="${i === at ? 'on' : ''}" aria-label="${zh() ? '第' : 'Step'} ${steps.findIndex(([, j]) => j === i) + 1}"></button>`).join('')}</div>
        <span class="tc-ex">${zh() ? '示例数据' : 'Example data'}</span>
        ${first ? '' : `<button type="button" class="ghost small" data-t="back">${zh() ? '上一步' : 'Back'}</button>`}
        <button type="button" class="small" data-t="next">${last ? (zh() ? '完成' : 'Done') : (zh() ? '下一步' : 'Next')}</button>
      </div>`;
    card.querySelector('[data-t=next]').focus({ preventScroll: true });
  }

  document.addEventListener('keydown', e => {
    if (at < 0) return;
    if (e.key === 'Escape') { e.preventDefault(); end(); return; }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  return { start, end, go, active: () => at >= 0, steps: TOUR_STEPS, current: () => at, target: () => target };
})();

// Old entry points in app.js call startTour()
function startTour() { Tour.start(); }

document.getElementById('tourLink').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('menu').open = false;
  startTour();
});
