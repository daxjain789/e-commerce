import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { hashPassword } from './password';

/**
 * Seeds a brand-new database with a demo catalogue, CMS pages and an admin
 * account. Runs once: every step checks whether data already exists.
 */
export function seedDatabase(database: DatabaseSync): void {
  const settingsRow = database.prepare('SELECT COUNT(*) AS n FROM settings').get() as { n: number };
  const seeded = database.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
  const adminRow = database.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };

  if (adminRow.n === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'change-me-now';
    const name = process.env.ADMIN_NAME || 'Store Owner';
    database
      .prepare('INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), email, name, hashPassword(password), 'admin', new Date().toISOString());
  }

  if (seeded.n > 0) return;
  if ((process.env.SEED_DEMO_DATA || 'true').toLowerCase() === 'false') return;

  const now = Date.now();
  const iso = (daysAgo = 0) => new Date(now - daysAgo * 864e5).toISOString();
  const id = () => randomUUID();

  // ---------------------------------------------------------------- categories
  const categories = [
    { id: id(), name: 'Tableware', slug: 'tableware', description: 'Stoneware made to be used daily.', image: '/demo/bowl.svg', position: 1 },
    { id: id(), name: 'Lighting', slug: 'lighting', description: 'Warm, low light for desks and corners.', image: '/demo/lamp.svg', position: 2 },
    { id: id(), name: 'Desk', slug: 'desk', description: 'Tools that keep a surface honest.', image: '/demo/tray.svg', position: 3 },
    { id: id(), name: 'Textiles', slug: 'textiles', description: 'Linen and merino, woven to soften.', image: '/demo/throw.svg', position: 4 },
    { id: id(), name: 'Carry', slug: 'carry', description: 'Canvas and leather for the daily haul.', image: '/demo/tote.svg', position: 5 },
    { id: id(), name: 'Home', slug: 'home', description: 'Small objects that change a room.', image: '/demo/vase.svg', position: 6 },
  ];

  const insertCategory = database.prepare(
    'INSERT INTO categories (id, name, slug, description, image, position) VALUES (?, ?, ?, ?, ?, ?)',
  );
  categories.forEach((c) => insertCategory.run(c.id, c.name, c.slug, c.description, c.image, c.position));
  const cat = (slug: string) => categories.find((c) => c.slug === slug)!.id;

  // ------------------------------------------------------------------ products
  const products = [
    {
      name: 'Ridgefield Stoneware Mug',
      slug: 'ridgefield-stoneware-mug',
      description:
        'Thrown in a small studio outside Portland, each mug carries the marks of the wheel — a slight asymmetry at the lip, a thumbprint where the handle meets the body.\n\nA matte ash glaze outside, a satin interior that keeps coffee hot for the length of a chapter. Holds 340 ml. Dishwasher safe, though it will age more beautifully by hand.',
      price: 3800,
      compare: null,
      sku: 'TAB-MUG-01',
      stock: 42,
      category: 'tableware',
      image: '/demo/mug.svg',
      featured: 1,
    },
    {
      name: 'Copper Pour-Over Kettle',
      slug: 'copper-pour-over-kettle',
      description:
        'Hand-hammered copper with a gooseneck spout that gives you control at the last inch of the pour. The handle stays cool; the base is wide enough for a stable, even boil.\n\nCopper patinas with use — the bright rose surface will deepen toward bronze within a year. 900 ml.',
      price: 12900,
      compare: 14900,
      sku: 'TAB-KET-02',
      stock: 8,
      category: 'tableware',
      image: '/demo/kettle.svg',
      featured: 1,
    },
    {
      name: 'Meridian Task Lamp',
      slug: 'meridian-task-lamp',
      description:
        'A single brass joint, a weighted base, and a shade angled exactly where the work is. The lamp throws a warm 2700K pool of light with no glare above the rim.\n\nPowder-coated steel with a solid brass pivot. 40 cm tall, E14 bulb included. Inline dimmer on the cord.',
      price: 18900,
      compare: null,
      sku: 'LGT-LMP-03',
      stock: 15,
      category: 'lighting',
      image: '/demo/lamp.svg',
      featured: 1,
    },
    {
      name: 'Walnut Desk Tray',
      slug: 'walnut-desk-tray',
      description:
        'Milled from a single block of American black walnut, with a shallow well for keys, cards and the things that otherwise drift across a desk.\n\nFinished with hard wax oil, so it can be sanded and re-oiled indefinitely. 24 × 16 cm.',
      price: 7400,
      compare: null,
      sku: 'DSK-TRY-04',
      stock: 23,
      category: 'desk',
      image: '/demo/tray.svg',
      featured: 0,
    },
    {
      name: 'Highland Merino Throw',
      slug: 'highland-merino-throw',
      description:
        'Woven on a century-old loom in the Scottish borders from undyed merino, with a hand-knotted fringe at both ends. Light enough for summer evenings, warm enough for a cold study.\n\n180 × 130 cm. Dry clean, or air it on the line.',
      price: 16500,
      compare: null,
      sku: 'TXT-THR-05',
      stock: 12,
      category: 'textiles',
      image: '/demo/throw.svg',
      featured: 1,
    },
    {
      name: 'Field Notes Journal',
      slug: 'field-notes-journal',
      description:
        'A cloth-bound notebook with 192 pages of 100 gsm cream paper, sewn flat so it opens without a fight. Ruled faintly in graphite.\n\nDeep green cover with a brass foil label, an elastic closure and a ribbon marker. A5.',
      price: 3200,
      compare: null,
      sku: 'DSK-JRN-06',
      stock: 64,
      category: 'desk',
      image: '/demo/notebook.svg',
      featured: 0,
    },
    {
      name: 'Stone Serving Bowl',
      slug: 'stone-serving-bowl',
      description:
        'A wide, shallow bowl in speckled buff stoneware — the one you reach for for salad, for fruit, for the keys by the door.\n\nGlazed inside and out, unglazed foot. 28 cm across, 9 cm deep. Oven safe to 220°C.',
      price: 5800,
      compare: null,
      sku: 'TAB-BWL-07',
      stock: 19,
      category: 'tableware',
      image: '/demo/bowl.svg',
      featured: 0,
    },
    {
      name: 'Ember Soy Candle',
      slug: 'ember-soy-candle',
      description:
        'Cedarwood, smoked vetiver and a little black pepper. Poured by hand into a matte ceramic vessel that makes a decent brush pot once the candle is spent.\n\n60 hour burn time. Cotton wick, soy and coconut wax, no phthalates.',
      price: 4400,
      compare: null,
      sku: 'HOM-CND-08',
      stock: 4,
      category: 'home',
      image: '/demo/candle.svg',
      featured: 0,
    },
    {
      name: 'Canvas Market Tote',
      slug: 'canvas-market-tote',
      description:
        'A 18 oz cotton canvas tote with a reinforced base and straps long enough to go over a shoulder in a coat.\n\nDeep navy, stitched with natural thread. Interior pocket for keys and a phone. 40 × 36 cm.',
      price: 6800,
      compare: null,
      sku: 'CRY-TOT-09',
      stock: 31,
      category: 'carry',
      image: '/demo/tote.svg',
      featured: 0,
    },
    {
      name: 'Terracotta Bud Vase',
      slug: 'terracotta-bud-vase',
      description:
        'A narrow-necked vase for one stem, or three. Unglazed terracotta outside to hold warmth, sealed inside so it does not sweat onto a sill.\n\n22 cm tall. Made in a family workshop in Alentejo, Portugal.',
      price: 4600,
      compare: null,
      sku: 'HOM-VSE-10',
      stock: 27,
      category: 'home',
      image: '/demo/vase.svg',
      featured: 1,
    },
  ];

  const insertProduct = database.prepare(
    `INSERT INTO products (id, name, slug, description, price_cents, compare_at_cents, sku, stock,
       category_id, images, status, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
  );
  const insertMovement = database.prepare(
    'INSERT INTO stock_movements (id, product_id, delta, reason, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  );

  const productIds = new Map<string, string>();
  products.forEach((p, index) => {
    const pid = id();
    productIds.set(p.slug, pid);
    insertProduct.run(
      pid,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.compare,
      p.sku,
      p.stock,
      cat(p.category),
      JSON.stringify([p.image]),
      p.featured,
      iso(30 - index),
      iso(30 - index),
    );
    insertMovement.run(id(), pid, p.stock, 'Initial stock', null, iso(30 - index));
  });

  // -------------------------------------------------------------------- pages
  const insertPage = database.prepare(
    `INSERT INTO pages (id, slug, title, blocks, status, seo_title, seo_description, updated_at)
     VALUES (?, ?, ?, ?, 'published', ?, ?, ?)`,
  );

  const block = (type: string, props: Record<string, unknown>) => ({ id: id(), type, props });

  const homeBlocks = [
    block('hero', {
      eyebrow: 'Small-batch homeware · Portland, OR',
      title: 'Objects that get better with use.',
      body: 'Stoneware, walnut, linen and brass — made in short runs by people who care how things wear in. Free shipping over $150, 30-day returns, repairs for life.',
      image: '/demo/hero.svg',
      ctaLabel: 'Shop the collection',
      ctaHref: '/products',
      secondaryLabel: 'Read our story',
      secondaryHref: '/about',
      align: 'left',
    }),
    block('productGrid', {
      eyebrow: 'The collection',
      title: 'Ten objects, chosen slowly',
      body: 'Everything we stock is made by a studio we have visited. No seasonal churn — the catalogue changes when something better comes along.',
      source: 'featured',
      limit: 4,
      ctaLabel: 'View all products',
      ctaHref: '/products',
    }),
    block('imageText', {
      eyebrow: 'Materials',
      title: 'Made to be repaired, not replaced.',
      body: 'We buy from workshops that keep their moulds, their looms and their tools. When something chips, we fix it — the terracotta is sealed so it can be re-sealed, the walnut re-oiled, the brass re-polished. A longer life is the whole point.',
      image: '/demo/atelier.svg',
      ctaLabel: 'How we make things',
      ctaHref: '/about',
      imageSide: 'right',
    }),
    block('featureList', {
      eyebrow: 'Why buy here',
      title: 'The unglamorous promises',
      items: [
        { title: 'Repairs for life', body: 'Chips, dents and worn finishes are covered. Send it back and we mend it, free, for as long as you own it.' },
        { title: 'Plastic-free packing', body: 'Recycled board, paper tape and a wool pad. The box is designed to be reused for returns.' },
        { title: 'Made in small batches', body: 'We restock when the workshop finishes a run, not when a spreadsheet says so. Sold out means genuinely sold out.' },
      ],
    }),
    block('quote', {
      quote: 'The mug arrived in a box I have since used three times. That is the level of thought here.',
      author: 'Imogen R.',
      role: 'Verified buyer · Ridgefield Stoneware Mug',
    }),
    block('cta', {
      title: 'Start with one good thing.',
      body: 'Free shipping over $150. 30 days to change your mind. A repair service that outlives the trend cycle.',
      ctaLabel: 'Browse everything',
      ctaHref: '/products',
      image: '/demo/story.svg',
    }),
  ];

  const aboutBlocks = [
    block('hero', {
      eyebrow: 'Our story',
      title: 'A shop for the things you keep.',
      body: 'Meridian Supply started in a one-room studio with a kiln, a lathe and a stubborn belief that household objects should outlive their owners.',
      image: '/demo/story.svg',
      ctaLabel: 'See what we make',
      ctaHref: '/products',
      secondaryLabel: '',
      secondaryHref: '',
      align: 'left',
    }),
    block('richText', {
      body: '## How we choose\n\nEvery object in the catalogue comes from a workshop we have stood in. We look for three things: materials that age honestly, a maker who can repair what they sell, and a price that pays the person doing the work.\n\nThat means the catalogue is short. Ten objects is not a limitation we are apologising for — it is the entire point. A shop that stocks everything is a shop that has chosen nothing.\n\n## The repair promise\n\nIf a piece chips, dents or loses its finish, send it back. We mend it, re-oil it or re-glaze it and return it, free, for as long as you own it. This is not a marketing gesture: it is cheaper than throwing things away, and it is the reason we choose makers who keep their moulds.\n\n## Where the money goes\n\nRoughly 60% of every sale goes to the workshop, 20% to materials and freight, and the remainder keeps the lights on and the repair bench staffed. We publish this number every year because most shops do not.',
    }),
    block('featureList', {
      eyebrow: 'The studio',
      title: 'What we actually do all day',
      items: [
        { title: 'Visit workshops', body: 'Two trips a month, always in person. We buy from people we have watched work.' },
        { title: 'Test to destruction', body: 'Every new piece is dropped, washed, overfilled and left in the sun before it is listed.' },
        { title: 'Repair, not replace', body: 'The bench in the back has fixed 1,400 pieces since we opened. None of them cost the owner a cent.' },
      ],
    }),
    block('cta', {
      title: 'Come see the bench.',
      body: 'We are open Thursday to Saturday, 10–5. Bring something broken and we will tell you honestly whether it can be saved.',
      ctaLabel: 'Get in touch',
      ctaHref: '/contact',
      image: '/demo/atelier.svg',
    }),
  ];

  const faqBlocks = [
    block('hero', {
      eyebrow: 'Support',
      title: 'Questions, answered plainly.',
      body: 'If the answer is not here, write to us — a person replies, usually the same day.',
      image: '',
      ctaLabel: 'Email us',
      ctaHref: 'mailto:hello@meridiansupply.co',
      secondaryLabel: '',
      secondaryHref: '',
      align: 'center',
    }),
    block('faq', {
      title: 'Shipping & delivery',
      items: [
        { question: 'How long until my order ships?', answer: 'In-stock orders leave the studio within two business days. You will get a tracking link by email the moment the label is printed.' },
        { question: 'Do you ship internationally?', answer: 'Yes, to 34 countries. Duties are calculated at checkout where possible; where they are not, the courier collects them on delivery.' },
        { question: 'Can I change my address after ordering?', answer: 'If the order has not shipped, yes — reply to your confirmation email and we will update it. After dispatch the courier has to be the one to redirect.' },
        { question: 'What does shipping cost?', answer: 'A flat $12 in the continental US, free over $150. International rates are shown at checkout before you pay.' },
      ],
    }),
    block('faq', {
      title: 'Returns & repairs',
      items: [
        { question: 'What is the returns window?', answer: '30 days from delivery, unused and in its original packaging. We refund the item price; the return postage is yours unless the item arrived damaged.' },
        { question: 'How does the repair promise work?', answer: 'Send a photo to hello@meridiansupply.co. If it is repairable we send a prepaid label, fix it at the bench and ship it back. There is no charge and no time limit.' },
        { question: 'Something arrived broken. What now?', answer: 'Send a photo within seven days and we ship a replacement immediately — you keep the broken piece for the repair bench.' },
      ],
    }),
  ];

  const careBlocks = [
    block('hero', {
      eyebrow: 'Care guide',
      title: 'How to make it last decades.',
      body: 'Short instructions, no mystique. Everything here is designed to be maintained by the person using it.',
      image: '',
      ctaLabel: '',
      ctaHref: '',
      secondaryLabel: '',
      secondaryHref: '',
      align: 'center',
    }),
    block('richText', {
      body: '## Stoneware\n\nWash by hand with a soft sponge and hot water. Avoid thermal shock — do not move a hot bowl into cold water. A dilute vinegar soak lifts tea and coffee stains overnight; the matte glaze will re-darken slightly over years, which is the intended patina.\n\n## Copper\n\nCopper is reactive and will patina. To restore the rose colour, rub with a paste of lemon juice and fine salt, rinse and dry immediately. Never leave acidic food in contact with copper for long periods. Do not put copper in a dishwasher.\n\n## Walnut\n\nDust with a dry cloth. Twice a year, wipe with a hard wax oil and buff after twenty minutes. Water rings lift with a light sanding at 400 grit followed by oil. Never soak.\n\n## Merino\n\nAir rather than wash. When washing is necessary, cold hand-wash with a pH-neutral wool detergent, press water out in a towel, and dry flat away from direct heat. Fold, do not hang.\n\n## Brass\n\nBrass darkens with handling. Polish with a dry cloth for a soft glow, or leave it alone for the deeper bronze that most people eventually prefer. Avoid abrasive pads on the lacquered shade.',
    }),
    block('cta', {
      title: 'Still stuck?',
      body: 'Send a photo and we will tell you what to do — even if the answer is "leave it alone, it looks better that way".',
      ctaLabel: 'Ask the studio',
      ctaHref: '/contact',
      image: '/demo/atelier.svg',
    }),
  ];

  const shippingBlocks = [
    block('hero', {
      eyebrow: 'Shipping & returns',
      title: 'Plain terms.',
      body: 'Two business days to dispatch, 30 days to change your mind, and a repair bench that never closes.',
      image: '',
      ctaLabel: '',
      ctaHref: '',
      secondaryLabel: '',
      secondaryHref: '',
      align: 'center',
    }),
    block('richText', {
      body: '## Dispatch\n\nIn-stock orders are packed and dispatched within two business days. Orders placed after 2pm Friday ship Monday. You will receive a tracking link as soon as the label is created.\n\n## Rates\n\n- Continental US: flat $12, free over $150\n- Alaska, Hawaii and Canada: $22 flat\n- International: calculated at checkout, duties may be collected on delivery\n\n## Returns\n\nUnused items can be returned within 30 days in their original packaging for a full refund of the item price. Return postage is the customer\'s responsibility unless the item arrived damaged or incorrect.\n\nStart a return by replying to your order confirmation — you do not need an account, just the order number.\n\n## Damaged in transit\n\nSend a photo within seven days of delivery. We ship a replacement immediately and you keep the damaged piece for the repair bench. No forms, no return shipping.\n\n## Repairs\n\nAny piece bought from us can be sent back for repair at any time, free of charge. We cover the return label both ways. Most repairs take two weeks.',
    }),
  ];

  const contactBlocks = [
    block('richText', {
      body: '## Talk to a person\n\nThe studio is small enough that the person who packs your order is often the person answering this inbox. We reply within one business day, usually sooner.\n\n**Email** — hello@meridiansupply.co\n\n**Phone** — +1 (415) 555-0142, Thursday to Saturday, 10am–5pm Pacific\n\n**Studio** — 18 Foundry Lane, Studio 4, Portland, OR 97209. Open to visitors Thursday to Saturday; the repair bench is in the back and you are welcome to watch.\n\n## Wholesale\n\nWe supply a small number of shops. Write to wholesale@meridiansupply.co with your store name and a sense of what you stock.\n\n## Press\n\nImages and samples available on request. Please include your outlet and deadline.',
    }),
    block('cta', {
      title: 'Prefer to write?',
      body: 'hello@meridiansupply.co — every message is read by the studio, not a chatbot.',
      ctaLabel: 'Email the studio',
      ctaHref: 'mailto:hello@meridiansupply.co',
      image: '/demo/story.svg',
    }),
  ];

  insertPage.run(id(), 'home', 'Home', JSON.stringify(homeBlocks), 'Meridian Supply — objects that get better with use', 'Small-batch stoneware, lighting, textiles and desk objects. Free shipping over $150, repairs for life.', iso(1));
  insertPage.run(id(), 'about', 'Our story', JSON.stringify(aboutBlocks), 'Our story — Meridian Supply', 'A shop for the things you keep: how we choose makers, and why we repair rather than replace.', iso(2));
  insertPage.run(id(), 'faq', 'FAQ', JSON.stringify(faqBlocks), 'FAQ — Meridian Supply', 'Shipping, returns, repairs and everything else, answered plainly.', iso(3));
  insertPage.run(id(), 'care-guide', 'Care guide', JSON.stringify(careBlocks), 'Care guide — Meridian Supply', 'How to clean and maintain stoneware, copper, walnut, merino and brass.', iso(4));
  insertPage.run(id(), 'shipping-returns', 'Shipping & returns', JSON.stringify(shippingBlocks), 'Shipping & returns — Meridian Supply', 'Dispatch times, shipping rates, returns and the repair promise.', iso(5));
  insertPage.run(id(), 'contact', 'Contact', JSON.stringify(contactBlocks), 'Contact — Meridian Supply', 'Talk to the studio about orders, repairs, wholesale or press.', iso(6));

  // ------------------------------------------------------------------- orders
  const insertOrder = database.prepare(
    `INSERT INTO orders (id, number, email, name, phone, address, items, subtotal_cents, shipping_cents,
       tax_cents, total_cents, currency, status, payment_provider, payment_status, payment_ref, notes,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const orderFixture = [
    {
      number: 'MC-1001',
      name: 'Imogen Reyes',
      email: 'imogen.reyes@example.com',
      phone: '+1 503 555 0119',
      address: { line1: '4427 SE Belmont St', city: 'Portland', region: 'OR', postalCode: '97215', country: 'US' },
      items: [
        { slug: 'ridgefield-stoneware-mug', name: 'Ridgefield Stoneware Mug', image: '/demo/mug.svg', priceCents: 3800, quantity: 2 },
        { slug: 'ember-soy-candle', name: 'Ember Soy Candle', image: '/demo/candle.svg', priceCents: 4400, quantity: 1 },
      ],
      shipping: 1200,
      status: 'fulfilled',
      paymentStatus: 'paid',
      provider: 'stripe',
      daysAgo: 14,
      notes: '',
    },
    {
      number: 'MC-1002',
      name: 'Daniel Okoro',
      email: 'd.okoro@example.com',
      phone: '+1 415 555 0188',
      address: { line1: '88 Albion Street', line2: 'Apt 3', city: 'San Francisco', region: 'CA', postalCode: '94103', country: 'US' },
      items: [{ slug: 'meridian-task-lamp', name: 'Meridian Task Lamp', image: '/demo/lamp.svg', priceCents: 18900, quantity: 1 }],
      shipping: 0,
      status: 'paid',
      paymentStatus: 'paid',
      provider: 'bank',
      daysAgo: 4,
      notes: 'Bank transfer cleared 09:12.',
    },
    {
      number: 'MC-1003',
      name: 'Sofia Lindqvist',
      email: 'sofia.l@example.com',
      phone: '+46 70 555 0121',
      address: { line1: 'Västergatan 14', city: 'Malmö', region: '', postalCode: '211 21', country: 'SE' },
      items: [
        { slug: 'highland-merino-throw', name: 'Highland Merino Throw', image: '/demo/throw.svg', priceCents: 16500, quantity: 1 },
      ],
      shipping: 2200,
      status: 'pending',
      paymentStatus: 'unpaid',
      provider: 'cod',
      daysAgo: 1,
      notes: 'Customer asked to deliver after the 12th.',
    },
  ];

  for (const order of orderFixture) {
    const subtotal = order.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    const total = subtotal + order.shipping;
    insertOrder.run(
      id(),
      order.number,
      order.email,
      order.name,
      order.phone,
      JSON.stringify(order.address),
      JSON.stringify(
        order.items.map((item) => ({
          productId: productIds.get(item.slug)!,
          name: item.name,
          slug: item.slug,
          image: item.image,
          priceCents: item.priceCents,
          quantity: item.quantity,
        })),
      ),
      subtotal,
      order.shipping,
      0,
      total,
      'USD',
      order.status,
      order.provider,
      order.paymentStatus,
      '',
      order.notes,
      iso(order.daysAgo),
      iso(order.daysAgo),
    );
  }

  // Mark seeding complete so settings written later are not overwritten.
  database
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING')
    .run('_seeded_at', JSON.stringify(new Date().toISOString()));

  void settingsRow;
}
