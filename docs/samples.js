// Trove: sample listings for the demo, and simple line drawings used until real photos are uploaded.
// Prices are in cents. Item costs are private to the seller.

const SAMPLE_ART = {
  // each entry is SVG markup drawn on a 200 x 200 canvas
  bottle: '<path d="M88 40h24v22c0 8 18 14 18 34v62c0 8-6 12-12 12H82c-6 0-12-4-12-12V96c0-20 18-26 18-34z"/><path d="M84 34h32v8H84z"/><path d="M78 110h44"/>',
  candle: '<path d="M60 160h40M64 150h32l-6-12H70z"/><path d="M76 138V70h8v68"/><path d="M80 70c-6-10 0-18 0-22 4 6 8 12 0 22z"/><path d="M110 160h40M114 150h32l-6-12h-20z"/><path d="M126 138V80h8v58"/><path d="M130 80c-6-10 0-18 0-22 4 6 8 12 0 22z"/>',
  car: '<path d="M40 130v-20l20-6 16-24h48l18 24 18 6v20z"/><circle cx="70" cy="132" r="13"/><circle cx="132" cy="132" r="13"/><path d="M82 86h18v18H70zM108 86h12l12 18h-24z"/><path d="M150 112l10-6"/>',
  textile: '<path d="M40 50h120v100H40z"/><path d="M40 70h120M40 78h120M40 122h120M40 130h120"/><path d="M48 150v8M60 150v8M72 150v8M84 150v8M96 150v8M108 150v8M120 150v8M132 150v8M144 150v8M156 150v8"/>',
  postcard: '<path d="M30 60h120v84H30z" transform="rotate(-6 90 100)"/><path d="M50 56h120v84H50z"/><path d="M146 64h16v20h-16z"/><path d="M60 100c14-20 24-20 38 0s24 20 38 0"/><path d="M110 112h46M110 122h46M110 132h30"/>',
  trivet: '<circle cx="100" cy="100" r="56"/><circle cx="100" cy="100" r="18"/><path d="M100 44v38M100 118v38M44 100h38M118 100h38M60 60l27 27M113 113l27 27M140 60l-27 27M87 113l-27 27"/><path d="M70 152l-6 12M130 152l6 12M100 156v12"/>',
  pot: '<path d="M70 70h60l10 82c0 6-4 10-10 10H70c-6 0-10-4-10-10z"/><path d="M76 60h48l-4 10H80z"/><path d="M92 48h16v12H92z"/><path d="M140 86c22 0 22 44 0 46"/><path d="M62 92l-22-16"/><circle cx="84" cy="110" r="3"/><circle cx="110" cy="96" r="3"/><circle cx="116" cy="134" r="3"/><circle cx="94" cy="140" r="3"/>',
  clock: '<path d="M50 160V90c0-34 22-50 50-50s50 16 50 50v70z"/><path d="M42 160h116v10H42z"/><circle cx="100" cy="92" r="30"/><path d="M100 92V72M100 92l14 8"/><path d="M100 132v14"/><circle cx="100" cy="148" r="4"/>',
  spoon: '<ellipse cx="100" cy="58" rx="20" ry="28"/><path d="M96 86c-2 26-6 56-8 72 0 6 4 10 12 10s12-4 12-10c-2-16-6-46-8-72"/>',
  dish: '<path d="M36 128h128l-10 18H46z"/><path d="M58 128c0-30 18-46 42-46s42 16 42 46"/><path d="M92 82c0-8 16-8 16 0"/><path d="M70 110l8 12M86 104l6 18M114 104l-6 18M130 110l-8 12"/>',
  book: '<path d="M54 46h86v114H54z"/><path d="M54 46c-8 0-12 4-12 10v104c0-6 4-10 12-10"/><path d="M72 70h50M72 80h50M80 100h34"/><path d="M42 160h12"/>',
  lantern: '<path d="M86 36h28M100 36v10"/><path d="M80 46h40l6 18H74z"/><path d="M76 64h48v74H76z"/><path d="M76 84h48M76 118h48"/><path d="M100 92c-8 10-6 18 0 20 6-2 8-10 0-20z"/><path d="M70 138h60v12H70z"/><path d="M84 46c0-20 32-20 32 0"/>',
  shakers: '<path d="M60 160V92c0-14 8-24 18-24s18 10 18 24v68z"/><path d="M104 160V92c0-14 8-24 18-24s18 10 18 24v68z"/><circle cx="72" cy="80" r="2"/><circle cx="84" cy="80" r="2"/><circle cx="78" cy="74" r="2"/><circle cx="116" cy="78" r="2"/><circle cx="128" cy="78" r="2"/><path d="M56 160h88"/>',
  headphones: '<path d="M52 118v-18c0-30 22-52 48-52s48 22 48 52v18"/><path d="M44 116h18v42H44c-6 0-10-4-10-10v-22c0-6 4-10 10-10z"/><path d="M156 116h-18v42h18c6 0 10-4 10-10v-22c0-6-4-10-10-10z"/>',
  jacket: '<path d="M78 40l22 14 22-14 34 16 10 64-20 4-4-30v86H58V94l-4 30-20-4 10-64z"/><path d="M100 54v120"/><path d="M78 40l10 30 12-16M122 40l-10 30-12-16"/><path d="M70 130h16M114 130h16"/><circle cx="106" cy="96" r="2"/><circle cx="106" cy="118" r="2"/><circle cx="106" cy="140" r="2"/>',
  plant: '<path d="M70 120h60l-8 50H78z"/><path d="M66 112h68v8H66z"/><path d="M100 112V70"/><path d="M100 86c-24-2-36-18-34-36 20 0 34 14 34 36z"/><path d="M100 76c20-4 30-20 26-36-18 2-28 16-26 36z"/><path d="M100 100c18 0 30-10 32-24-16-2-28 8-32 24z"/>',
  helmet: '<path d="M40 128c0-44 28-72 64-72s58 28 58 62v10z"/><path d="M40 128h122"/><path d="M80 62c-6 20-6 44 0 66M110 56c0 24 0 48 4 72M138 66c6 18 8 40 6 62"/><path d="M62 128l12 26h40l8-26"/>',
  game: '<path d="M44 64h112v84H44z"/><path d="M44 64l12-14h112l-12 14M156 148l12-14V50"/><circle cx="76" cy="96" r="10"/><path d="M98 90h40M98 104h30"/><rect x="62" y="120" width="16" height="16"/><circle cx="66" cy="124" r="1.5"/><circle cx="74" cy="132" r="1.5"/>',
  duck: '<path d="M44 128c0-22 22-34 52-34h20c6-18 18-26 32-22 10 2 14 10 8 16l-12 4c4 8 2 18-6 24-10 10-30 14-50 14H60c-10 0-16-2-16-2z"/><circle cx="142" cy="80" r="3"/><path d="M60 130h80"/><path d="M80 106c14 4 30 4 44-2"/><path d="M90 146v14h20v-14"/><path d="M80 160h40"/>',
};

const TONES = ['#e8dcc4', '#dfe5d8', '#e9d6cc', '#d9e0e6', '#eadfc9', '#e3d9e3'];

function artSvg(kind, tone) {
  const body = SAMPLE_ART[kind] || SAMPLE_ART.book;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<rect width="200" height="200" fill="${tone}"/>` +
    `<g fill="none" stroke="#3a352c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</g>` +
    `<text x="100" y="192" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#6a6355">sample drawing</text></svg>`;
}

const SAMPLE_SELLERS = [
  { id: 's1', name: 'Maple Lane Finds', city: 'Ottawa, ON', about: 'Antiques and old things from estate sales and barns. Every flaw photographed.', joined: '2026-10' },
  { id: 's2', name: "Sam's Spare Room", city: 'Ottawa, ON', about: 'Clearing out good stuff I no longer use. Happy to meet downtown.', joined: '2026-10' },
];

const SAMPLE_ITEMS = [
  { title: 'Brass candlestick pair', price: 3800, cost: 1200, category: 'Home', condition: 'likenew', size: 'medium',
    flaws: 'Light scratches on one base. Natural patina, not polished.', measurements: '21 cm tall, 9 cm base', era: '1920s', decade: 1920, ageSure: 'estimated',
    material: 'Brass', maker: 'Unmarked', description: 'Heavy, well made pair with stepped bases. Holds standard taper candles.', art: 'candle', meetup: true, ships: true },
  { title: 'Blue glass medicine bottle', price: 800, cost: 100, category: 'Glass', condition: 'good', size: 'small',
    flaws: 'Small bubble in the glass near the neck (from the making, not damage).', measurements: '14 cm tall', era: 'Around 1900', decade: 1900, ageSure: 'estimated',
    material: 'Cobalt glass', maker: 'Embossed "Poison" on one side', description: 'Ribbed cobalt bottle with embossing. Lovely on a sunny windowsill.', art: 'bottle', meetup: true, ships: true },
  { title: 'Wind-up tin toy car', price: 4500, cost: 1500, category: 'Toys', condition: 'good', size: 'small',
    flaws: 'Paint worn on the roof and bumpers. Key is a later replacement.', measurements: '16 cm long', era: '1950s', decade: 1950, ageSure: 'estimated',
    material: 'Tin', maker: 'Made in Japan stamp', description: 'Wind-up works and the car runs about two metres.', art: 'car', meetup: true, ships: true },
  { title: 'Wool camp blanket, cream with stripes', price: 8500, cost: 2500, category: 'Textiles', condition: 'good', size: 'large',
    flaws: 'Two small moth holes near one corner, shown in photos. Washed.', measurements: '180 × 230 cm', era: '1960s', decade: 1960, ageSure: 'estimated',
    material: 'Wool', maker: 'No label', description: 'Thick, warm and heavy. Classic stripes at both ends.', art: 'textile', meetup: true, ships: true },
  { title: 'Six Banff postcards', price: 1200, cost: 200, category: 'Paper', condition: 'likenew', size: 'small',
    flaws: 'None written on. Slight corner wear on two.', measurements: '14 × 9 cm each', era: '1940s', decade: 1940, ageSure: 'estimated',
    material: 'Card', maker: 'Various', description: 'Unused mountain and lake views. Sold as a set of six.', art: 'postcard', meetup: true, ships: true },
  { title: 'Cast iron trivet', price: 1500, cost: 300, category: 'Kitchen', condition: 'good', size: 'small',
    flaws: 'Surface rust spots on the underside.', measurements: '17 cm across', era: 'Unknown', decade: null, ageSure: 'unknown',
    material: 'Cast iron', maker: 'Unmarked', description: 'Round trivet on three small feet.', art: 'trivet', meetup: true, ships: true },
  { title: 'Speckled enamel coffee pot', price: 2800, cost: 700, category: 'Kitchen', condition: 'fair', size: 'medium',
    flaws: 'Chips to the enamel on the spout and base, one small dent.', measurements: '24 cm tall', era: '1940s', decade: 1940, ageSure: 'estimated',
    material: 'Enamelware', maker: 'Unmarked', description: 'Blue and white speckle. Good for display or a camp stove.', art: 'pot', meetup: true, ships: true },
  { title: 'Wooden mantel clock (not running)', price: 5500, cost: 1000, category: 'Clocks', condition: 'parts', size: 'large',
    flaws: 'Movement does not run. Veneer lifting at the back. Key missing.', measurements: '32 cm wide, 26 cm tall', era: '1930s', decade: 1930, ageSure: 'estimated',
    material: 'Oak veneer', maker: 'Paper label partly torn', description: 'A restoration project. The case is in decent shape.', art: 'clock', meetup: true, ships: true },
  { title: 'Single silver-plate teaspoon', price: 200, cost: 25, category: 'Kitchen', condition: 'good', size: 'small',
    flaws: 'Plating worn at the tip of the bowl.', measurements: '13 cm long', era: '1950s', decade: 1950, ageSure: 'estimated',
    material: 'Silver plate', maker: 'Marked "EPNS"', description: 'Pretty floral handle. Add it to a box of other small items.', art: 'spoon', meetup: true, ships: true },
  { title: 'Pressed glass butter dish', price: 2200, cost: 500, category: 'Glass', condition: 'likenew', size: 'medium',
    flaws: 'None that I can see.', measurements: '19 cm across', era: '1930s', decade: 1930, ageSure: 'estimated',
    material: 'Pressed glass', maker: 'Unmarked', description: 'Clear pressed glass with a lid. No chips.', art: 'dish', meetup: true, ships: true },
  { title: 'Anne of Green Gables, hardcover reprint', price: 1800, cost: 400, category: 'Books', condition: 'good', size: 'small',
    flaws: 'Dust jacket missing. Name written inside the front cover.', measurements: '20 × 14 cm', era: '1940s', decade: 1940, ageSure: 'confirmed',
    material: 'Cloth hardcover', maker: 'Printing date on the title page', description: 'Tight binding, clean pages.', art: 'book', meetup: true, ships: true },
  { title: 'Railway-style lantern, red globe', price: 9500, cost: 3000, category: 'Lighting', condition: 'good', size: 'large',
    flaws: 'Surface rust on the top, wick is old. Not tested with fuel.', measurements: '34 cm tall with handle', era: '1940s', decade: 1940, ageSure: 'estimated',
    material: 'Steel and glass', maker: 'Stamped mark on the base, worn', description: 'Display piece. Globe is intact with no cracks.', art: 'lantern', meetup: true, ships: false },
  { title: 'Ceramic salt and pepper shakers', price: 600, cost: 100, category: 'Kitchen', condition: 'good', size: 'small',
    flaws: 'One stopper replaced.', measurements: '8 cm tall', era: '1960s', decade: 1960, ageSure: 'estimated',
    material: 'Ceramic', maker: 'Unmarked', description: 'Cheerful cream glaze. Sold as a pair.', art: 'shakers', meetup: true, ships: true },
  { title: 'Hand-carved wooden duck decoy', price: 6500, cost: 2000, category: 'Folk art', condition: 'likenew', size: 'medium',
    flaws: 'Paint rubbed on the head, as you would expect from use.', measurements: '36 cm long', era: 'Unknown', decade: null, ageSure: 'unknown',
    material: 'Carved wood', maker: 'Initials "R.M." under the base', description: 'Solid, hand carved, with a weighted keel.', art: 'duck', meetup: true, ships: true },
  { seller: 's2', title: 'Wireless over-ear headphones', price: 4500, cost: 0, category: 'Electronics', condition: 'good', size: 'small',
    flaws: 'Light scuffs on the headband. Battery still lasts most of a day.', measurements: 'Standard adult size', era: '', ageSure: '',
    material: '', maker: 'Comes with charging cable', description: 'Noise-cancelling works well. Selling because I got earbuds.', art: 'headphones', meetup: true, ships: true },
  { seller: 's2', title: 'Denim jacket, size M', price: 3000, cost: 0, category: 'Clothing', condition: 'likenew', size: 'small',
    flaws: 'None.', measurements: 'Chest 54 cm flat, length 66 cm', era: '', ageSure: '',
    material: 'Cotton denim', maker: '', description: 'Worn a handful of times. Classic mid-blue wash.', art: 'jacket', meetup: true, ships: true },
  { seller: 's2', title: 'Potted pothos plant', price: 1200, cost: 0, category: 'Home', condition: 'good', size: 'medium',
    flaws: 'A couple of yellow leaves.', measurements: 'Pot 15 cm across, trails about 40 cm', era: '', ageSure: '',
    material: '', maker: '', description: 'Healthy and easy to look after. Pickup only so it travels safely.', art: 'plant', meetup: true, ships: false },
  { seller: 's2', title: "Kids' bike helmet", price: 1500, cost: 0, category: 'Sports', condition: 'likenew', size: 'medium',
    flaws: 'None. Never been in a fall.', measurements: 'Fits 50 to 54 cm heads', era: '', ageSure: '',
    material: '', maker: '', description: 'Adjustable dial at the back. Outgrown.', art: 'helmet', meetup: true, ships: true },
  { seller: 's2', title: 'Family board game, complete', price: 2000, cost: 0, category: 'Toys and games', condition: 'good', size: 'medium',
    flaws: 'Box corners worn. All pieces counted and present.', measurements: '40 × 27 cm box', era: '', ageSure: '',
    material: '', maker: '', description: 'Great for 2 to 6 players, ages 8 and up.', art: 'game', meetup: true, ships: true },
];

const OLD_CATEGORY = { Glass: 'Antiques', Clocks: 'Antiques', Lighting: 'Antiques', 'Folk art': 'Antiques', Paper: 'Collectibles', Textiles: 'Home', Toys: 'Toys and games' };

function sampleItems(now) {
  return SAMPLE_ITEMS.map((it, i) => ({
    id: 'i' + (101 + i), ...it, sellerId: it.seller || 's1', category: OLD_CATEGORY[it.category] || it.category, qty: 1, status: 'active', photos: [],
    alt: `Line drawing of a ${it.title.toLowerCase()}`, tone: TONES[i % TONES.length],
    listedAt: now - i * 3600 * 1000 * 7, questions: [],
  }));
}

// Past sales, interest and one upcoming meetup, so the dashboard opens with something to look at.
// All of it is sample data, made with the real order rules.
const SAMPLE_PAST = [
  ['s1', 'Copper kettle', 3500, 900, 'Kitchen', 'pot', 2], ['s1', 'Folding film camera', 6000, 2000, 'Collectibles', 'game', 5],
  ['s1', 'Floral teacup set', 2400, 600, 'Kitchen', 'dish', 9], ['s1', 'Brass oil lamp', 4000, 1200, 'Antiques', 'lantern', 12],
  ['s1', 'Postcard lot, 1950s', 1000, 200, 'Collectibles', 'postcard', 16], ['s1', 'Carved bookends', 2800, 700, 'Antiques', 'book', 23],
  ['s1', 'Pressed glass vase', 1800, 400, 'Antiques', 'bottle', 30], ['s1', 'Tin wind-up bird', 3200, 900, 'Toys and games', 'car', 40],
  ['s2', 'Desk lamp', 1800, 0, 'Home', 'lantern', 4], ['s2', 'Running shoes, size 9', 3500, 0, 'Sports', 'helmet', 18],
];
const SAMPLE_PEOPLE = ['Wei', 'Priya', 'Tom', 'Mei', 'Jordan', 'Ana'];

function sampleHistory(now, items) {
  const out = { items: [], orders: [], events: [] };
  let n = 1;
  const rand = () => ((n++ * 37) % 10) / 10;
  SAMPLE_PAST.forEach(([sellerId, title, price, cost, category, art, daysAgo], i) => {
    const at = now - daysAgo * DAY;
    const it = { id: 'h' + (i + 1), sellerId, title, price, cost, category, art, tone: TONES[i % TONES.length], condition: 'good', size: 'small',
      flaws: 'See photos.', measurements: '', qty: 0, status: 'sold', soldAt: at, soldPrice: price, photos: [], alt: 'Line drawing of a ' + title.toLowerCase(),
      listedAt: at - 5 * DAY, questions: [], meetup: true, ships: true };
    out.items.push(it);
    let o = createOrder({ id: 'P-' + (101 + i), sellerId, items: [it], buyer: { name: SAMPLE_PEOPLE[i % SAMPLE_PEOPLE.length] }, fulfilment: 'meetup',
      payment: i % 2 ? 'online' : 'at_handoff', meetup: { place: MEET_DEFAULT, at }, now: at - DAY, rand, checkMinimum: false });
    o = transition(o, 'handoff', 'seller', at, { code: o.handoffCode });
    out.orders.push(o);
  });
  // interest in things still for sale
  const pick = id => items.find(x => x.id === id);
  [['i103', 'view', 9], ['i103', 'save', 'Wei'], ['i103', 'save', 'Tom'], ['i103', 'question', 'Mei'],
   ['i104', 'view', 6], ['i104', 'cart', 'Priya'], ['i104', 'save', 'Ana'],
   ['i101', 'view', 4], ['i101', 'save', 'Jordan'], ['i114', 'view', 5], ['i114', 'question', 'Wei'],
   ['i102', 'view', 2], ['i115', 'view', 7], ['i115', 'save', 'Mei'], ['i116', 'view', 3]].forEach(([itemId, kind, x], k) => {
    if (!pick(itemId)) return;
    if (kind === 'view') for (let v = 0; v < x; v++) out.events.push({ itemId, kind, who: 'guest', at: now - (v + 1) * 3 * 3600e3 });
    else out.events.push({ itemId, kind, who: x, at: now - (k + 1) * 2 * 3600e3 });
  });
  const q = pick('i103'); if (q) q.questions = [{ q: 'Does the wind-up still work?', a: '', at: now - 5 * 3600e3 }];
  const q2 = pick('i114'); if (q2) q2.questions = [{ q: 'Can you hold it until Saturday?', a: '', at: now - 9 * 3600e3 }];
  // one meetup booked for tomorrow afternoon
  const trivet = pick('i106');
  if (trivet) {
    const t = new Date(now + DAY); t.setHours(15, 0, 0, 0);
    const o = createOrder({ id: 'T-1000', sellerId: 's1', items: [trivet], buyer: { name: 'Wei', email: 'wei@example.ca' }, fulfilment: 'meetup', payment: 'at_handoff',
      meetup: { place: 'Public library entrance', at: t.getTime() }, now: now - 3600e3, rand });
    out.orders.push(o);
    trivet.qty = 0; trivet.status = 'reserved';
  }
  return out;
}
const MEET_DEFAULT = 'Public library entrance';

if (typeof module !== 'undefined') module.exports = { sampleItems, artSvg, SAMPLE_ART, SAMPLE_SELLERS };
