/**
 * UtsabRegistry BD - Enhanced Core Application Logic
 * Supports:
 * - Popular BD Vendor Integration (Aarong, Daraz, Walton, Transcom, Pickaboo, Monno)
 * - 1-Click Product URL Importer
 * - Automated Vendor Orders & Platform Commission Engine
 * - Database Storage Options & JSON Snapshot Export/Import
 * - Fund Reservation & Escrow Management (Hold funds until goal/delivery & couple withdrawal)
 * - Photo Uploads & Website Section Organizer
 */

// Global State
const state = {
  event: null,
  gifts: [],
  contributions: [],
  vendorOrders: [],
  vendorSummary: {},
  escrowSummary: {},
  escrowItems: [],
  payoutRequests: [],
  dbStats: {},
  gallery: [],
  guestbook: [],
  stats: {},
  activeCategory: 'all',
  searchQuery: '',
  activeTab: 'gifts',
  selectedGiftForPayment: null,
  currentPaymentMethod: 'bkash',
  currentLang: 'bn',
  apiAvailable: true,
};

// Curated Popular BD Vendor Products (For 1-Click Quick Add)
const vendorQuickCatalog = [
  {
    vendor: 'Aarong Lifestyle',
    category: 'luxury',
    title: 'Aarong Handloom Dhakai Jamdani Silk Sharee (Crimson & Gold)',
    title_bn: 'আড়ং হ্যান্ডলুম ঢাকাই জামদানি সিল্ক শাড়ি (মরুন ও গোল্ড)',
    price: 16800,
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://www.aarong.com/women/sarees/jamdani-silk',
    description: 'Authentic Narayanganj handloom Dhakai Jamdani with golden zari weave. Fulfilled directly by Aarong.'
  },
  {
    vendor: 'Walton Plaza BD',
    category: 'appliances',
    title: 'Walton 1.5 Ton Intelligent Inverter Split AC',
    title_bn: 'ওয়ালটন ১.৫ টন ইন্টেলিজেন্ট ইনভার্টার এসি',
    price: 64500,
    image_url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://eplaza.waltonbd.com/air-conditioners/wsi-inverna-18c',
    description: 'Eco-friendly smart inverter AC. Delivered to couple\'s home by Walton Plaza express logistics.'
  },
  {
    vendor: 'Transcom Digital',
    category: 'kitchen',
    title: 'Philips Essential RapidAir Digital Air Fryer HD9270',
    title_bn: 'ফিলিপস এসেনশিয়াল ডিজিটাল এয়ার ফ্রায়ার',
    price: 15200,
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://transcomdigital.com/philips-airfryer-hd9270',
    description: '6.2L capacity digital air fryer from Transcom Digital with 2-year warranty.'
  },
  {
    vendor: 'Monno Ceramics BD',
    category: 'luxury',
    title: 'Monno Ceramic Royal Imperial 52-Piece Dinner Set',
    title_bn: 'মুন্নু সিরামিক রয়্যাল ইম্পেরিয়াল ৫২-পিস ডিনার সেট',
    price: 18500,
    image_url: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://monno.com.bd/products/imperial-52',
    description: '24k gold trimmed luxury porcelain dinner set for starting the new family.'
  },
  {
    vendor: 'Pickaboo BD',
    category: 'appliances',
    title: 'Xiaomi Dreame D9 Robot Vacuum & Wet Mop Cleaner',
    title_bn: 'শাওমি ড্রিম রোবট ভ্যাকুয়াম ও মপ ক্লিনার',
    price: 29500,
    image_url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://pickaboo.com/product/dreame-d9-robot',
    description: 'Smart laser navigation automated home vacuum with 1-year official BD warranty.'
  },
  {
    vendor: 'Daraz BD Official',
    category: 'kitchen',
    title: 'Miyako Granite Non-Stick Induction 7-Piece Cookware',
    title_bn: 'মিয়াকো গ্রানাইট নন-স্টিক ৭-পিস কুকওয়্যার সেট',
    price: 8900,
    image_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
    merchant_url: 'https://daraz.com.bd/products/miyako-granite-set',
    description: 'Heavy duty granite coated induction pot and pan set with tempered glass lids.'
  }
];

function toBanglaNumber(num) {
  if (num === null || num === undefined) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
}

function formatCurrency(amount, forceBangla = null) {
  const isBangla = forceBangla !== null ? forceBangla : (state.currentLang === 'bn');
  const formatted = Math.round(amount).toLocaleString('en-US');
  return isBangla ? `৳ ${toBanglaNumber(formatted)}` : `৳ ${formatted} BDT`;
}

function playAuspiciousChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 1.3);
    });
  } catch (e) {}
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#800020', '#d4af37', '#f3e5ab', '#e2136e', '#047857']
    });
  }
}

// Embedded Default State for GitHub Pages / Static Deployment
const defaultStaticState = {
  "event": {
    "id": "utsab-default",
    "title_en": "Arindam & Arpita Auspicious Hindu Wedding Celebration",
    "title_bn": "শ্রীমান অরিন্দম ও আয়ুষ্মতী অর্পিতার শুভ বিবাহ ও প্রীতিভোজ",
    "event_type": "hindu_wedding",
    "groom_name": "Arindam Chakraborty",
    "bride_name": "Arpita Ganguly",
    "groom_bn": "শ্রীমান অরিন্দম চক্রবর্ত্তী",
    "bride_bn": "আয়ুষ্মতী অর্পিতা গাঙ্গুলি",
    "groom_photo": "uploads/groom_arindam.jpg",
    "bride_photo": "uploads/bride_arpita.jpg",
    "couple_photo": "uploads/arindam_arpita_sitting.jpg",
    "cover_photo": "uploads/arindam_arpita_standing.jpg",
    "event_date": "2027-01-21",
    "event_time": "সন্ধ্যা ৭:০০ ঘটিকা onwards (7:00 PM BST)",
    "venue_name": "Engineers Institute Chattogram (দি ইনস্টিটিউশন অব ইঞ্জিনিয়ার্স বাংলাদেশ, চট্টগ্রাম)",
    "venue_address": "এস. এস. খালেদ রোড, লালখান বাজার, চট্টগ্রাম-৪০০০, বাংলাদেশ",
    "venue_map_url": "https://maps.google.com/?q=The+Institution+of+Engineers+Bangladesh+IEB+Chattogram",
    "story": "|| যদেতদ্ধৃদয়ং তব তদেতদ্ধৃদয়ং মম ||\n\nপরমেশ্বর পরমাত্মার অশেষ কৃপা এবং পরম পূজনীয় গুরুজনদের আশীর্বাদ মাথায় রেখে আমাদের শুভ পরিণয় আগামী ২১ জানুয়ারি ২০২৭ অনুষ্ঠিত হতে চলেছে।\n\nচট্টগ্রামের মনোরম পরিবেশে দি ইনস্টিটিউশন অব ইঞ্জিনিয়ার্স বাংলাদেশ (আইইবি) প্রাঙ্গণে সান্ধ্যলগ্নে শুভদৃষ্টি, মালাবদল, সাতপাকে বাঁধা ও সিঁদুরদান সহ মাঙ্গলিক আচার সম্পন্ন হবে। আপনার সপরিবার সানন্দ উপস্থিতি আমাদের নবদম্পতির জীবনের শ্রেষ্ঠ পাথেয়।",
    "welcome_msg": "|| ॐ শ্রী শ্রী প্রজাপতয়ে নমঃ || আমাদের শুভ পরিণয়ে আপনার সানন্দ উপস্থিতি ও পবিত্র আশীর্বাদ আমাদের পরম সম্পদ।",
    "theme_color": "sindoor-gold",
    "section_order": [
      "hero",
      "invitation",
      "rituals",
      "venue",
      "gifts",
      "salami",
      "gallery",
      "story",
      "guestbook"
    ],
    "section_visibility": {
      "hero": true,
      "invitation": true,
      "rituals": true,
      "venue": true,
      "gifts": true,
      "salami": true,
      "gallery": true,
      "story": true,
      "guestbook": true
    },
    "commission_rate": 5.0,
    "delivery_contact_phone": "01712-345678",
    "delivery_address": "লালখান বাজার, চট্টগ্রাম, বাংলাদেশ",
    "bkash_number": "01712-345678",
    "nagad_number": "01819-876543",
    "rocket_number": "01911-567890-4",
    "bank_name": "BRAC Bank PLC",
    "bank_acc_name": "Arindam Chakraborty & Arpita Ganguly",
    "bank_acc_no": "1501204892019001",
    "bank_branch": "Agrabad Branch, Chattogram",
    "bank_routing": "060152431"
  },
  "gifts": [
    {
      "id": "gift-1",
      "title": "Sweet Home Setup & Furniture Fund",
      "title_bn": "নবদম্পতির নতুন সংসার সামগ্রী ও ফার্নিচার তহবিল",
      "category": "luxury",
      "price": 35000.0,
      "target_amount": 35000.0,
      "current_amount": 35000.0,
      "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Home Setup Fund",
      "vendor_sku": "HOM-01",
      "description": "নবদম্পতির নতুন বাসার আরামদায়ক ড্রয়িং ও লিভিং রুম সাজানোর জন্য উপহার তহবিল।",
      "is_group_gift": 0,
      "status": "claimed",
      "created_at": "2026-11-15T00:40:56.034132"
    },
    {
      "id": "gift-2",
      "title": "Subarna Ashirbad: Gold Jewellery & Blessings Fund",
      "title_bn": "সুবর্ণ আশীর্বাদ: স্বর্ণালংকার ও সঞ্চয় তহবিল (গ্রুপ গিফট)",
      "category": "luxury",
      "price": 50000.0,
      "target_amount": 50000.0,
      "current_amount": 30000.0,
      "image_url": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Gold Blessings",
      "vendor_sku": "GLD-01",
      "description": "কনে অর্পিতার শাখা-পলা স্বর্ণ বাঁধানো ও স্মৃতিচিহ্ন উপহারের জন্য শুভ আশীর্বাদ।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T00:40:56.034141"
    },
    {
      "id": "gift-3",
      "title": "Smart Inverter Kitchen Refrigerator Fund (Group Gift)",
      "title_bn": "স্মার্ট ইনভার্টার কিচেন রেফ্রিজারেটর ফান্ড (গ্রুপ গিফট)",
      "category": "appliances",
      "price": 48000.0,
      "target_amount": 48000.0,
      "current_amount": 48000.0,
      "image_url": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Appliance Fund",
      "vendor_sku": "REF-01",
      "description": "অরিন্দম ও অর্পিতার নতুন গৃহের জন্য ডাবল ডোর ইনভার্টার রেফ্রিজারেটর।",
      "is_group_gift": 1,
      "status": "claimed",
      "created_at": "2026-11-15T00:40:56.034143"
    },
    {
      "id": "gift-4",
      "title": "Honeymoon Retreat: Coxs Bazar & Sajek Valley",
      "title_bn": "মধুচন্দ্রিমা সফর তহবিল: কক্সবাজার ও সাজেক ভ্যালি",
      "category": "experience",
      "price": 40000.0,
      "target_amount": 40000.0,
      "current_amount": 25000.0,
      "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Honeymoon Fund",
      "vendor_sku": "HNY-01",
      "description": "পাহাড় ও সমুদ্রের সান্নিধ্যে নবদম্পতির প্রথম স্মরণীয় মধুচন্দ্রিমা অবকাশ।",
      "is_group_gift": 1,
      "status": "partially_funded",
      "created_at": "2026-11-15T00:40:56.034145"
    },
    {
      "id": "gift-5",
      "title": "Luxury Bone China 52-Piece Dinner Set",
      "title_bn": "লাক্সারি বোন চায়না ৫২-পিস ডিনার সেট",
      "category": "kitchen",
      "price": 18500.0,
      "target_amount": 18500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Dinner Set",
      "vendor_sku": "DIN-01",
      "description": "নতুন সংসারে আত্মীয়-স্বজন আপ্যায়নের জন্য রাজকীয় বোন চায়না ডিনার সেট।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T00:40:56.034147"
    },
    {
      "id": "gift-6",
      "title": "Digital Air Fryer & Kitchen Master Combo",
      "title_bn": "ডিজিটাল এয়ার ফ্রায়ার ও কিচেন ব্লেন্ডার কম্বো",
      "category": "kitchen",
      "price": 14500.0,
      "target_amount": 14500.0,
      "current_amount": 0.0,
      "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
      "merchant_url": "",
      "merchant_name": "Kitchen Combo",
      "vendor_sku": "KIT-01",
      "description": "স্বাস্থ্যকর রান্না ও সনাতনী সুস্বাদু পদ তৈরির জন্য আধুনিক এয়ার ফ্রায়ার ও ব্লেন্ডার।",
      "is_group_gift": 0,
      "status": "available",
      "created_at": "2026-11-15T00:40:56.034148"
    }
  ],
  "gallery": [
    {
      "id": "gal-1",
      "image_url": "uploads/arindam_arpita_sitting.jpg",
      "caption": "শুভ পরিণয় ও আশীর্বাদ — অরিন্দম ও অর্পিতা",
      "order_idx": 1,
      "created_at": "2026-11-15T00:40:56.034268"
    },
    {
      "id": "gal-2",
      "image_url": "uploads/arindam_arpita_standing.jpg",
      "caption": "আমাদের মধুর যুগল মুহূর্ত (Arindam & Arpita)",
      "order_idx": 2,
      "created_at": "2026-11-15T00:40:56.034271"
    },
    {
      "id": "gal-3",
      "image_url": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80",
      "caption": "মাঙ্গলিক আশীর্বাদ ও নান্দীমুখ পর্ব",
      "order_idx": 3,
      "created_at": "2026-11-15T00:40:56.034272"
    },
    {
      "id": "gal-4",
      "image_url": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "caption": "গায়ে হলুদ ও সুগন্ধি চন্দন অনুষ্ঠান",
      "order_idx": 4,
      "created_at": "2026-11-15T00:40:56.034274"
    },
    {
      "id": "gal-5",
      "image_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "caption": "শুভদৃষ্টি ও মালাবদল লগ্ন",
      "order_idx": 5,
      "created_at": "2026-11-15T00:40:56.034275"
    },
    {
      "id": "gal-6",
      "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "caption": "সাতপাকে বাঁধা ও পবিত্র সিঁদুরদান",
      "order_idx": 6,
      "created_at": "2026-11-15T00:40:56.034276"
    }
  ],
  "guestbook": [
    {
      "id": "b-16e75128",
      "name": "চৌধুরী পরিবার (চট্টগ্রাম)",
      "relation": "Gifted via BRAC Bank Transfer (Demo Gateway)",
      "message": "অরিন্দম ও অর্পিতার সুন্দর ও আনন্দময় দাম্পত্য জীবনের জন্য সপরিবারে আন্তরিক শুভকামনা ও আশীর্বাদ!",
      "reaction": "🎁",
      "created_at": "2026-11-15T00:54:25.453614"
    },
    {
      "id": "gb-1",
      "name": "প্রণব ও চিত্রা চক্রবর্ত্তী",
      "relation": "জেঠু ও জেঠিমা (চট্টগ্রাম)",
      "message": "পরমেশ্বর ভগবান শ্রীকৃষ্ণের কৃপায় অরিন্দম ও অর্পিতার আগামী দাম্পত্য জীবন সুখ, শান্তি ও অনাবিল ভালোবাসায় ভরে উঠুক। আমাদের সপরিবার আন্তরিক আশীর্বাদ রইল।",
      "reaction": "🌸",
      "created_at": "2026-11-15T00:49:22.570100"
    },
    {
      "id": "gb-2",
      "name": "সুব্রত গাঙ্গুলি ও বন্ধু পরিবার",
      "relation": "ইঞ্জিনিয়ার্স ফোরাম, চট্টগ্রাম",
      "message": "শুভ পরিণয় অরিন্দম ও অর্পিতা! ইঞ্জিনিয়ার্স ইনস্টিটিউটের পবিত্র মণ্ডপে তোদের মালাবদল ও সিঁদুরদান দেখার শুভ লগ্নের অপেক্ষায় রইলাম।",
      "reaction": "💖",
      "created_at": "2026-11-15T00:49:22.570107"
    },
    {
      "id": "gb-3",
      "name": "কাকলি গাঙ্গুলি",
      "relation": "ছোট মাসিমণি",
      "message": "অর্পিতা মা আমার, খুব সুখী হোস। অরিন্দম ও তোদের পবিত্র যুগল মিলন সদা প্রস্ফুটিত থাকুক। অনেক স্নেহ ও আশীর্বাদ রইল।",
      "reaction": "🌸",
      "created_at": "2026-11-15T00:49:22.570109"
    }
  ]
};

function normalizeImagePath(url) {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return url.substring(1);
  return url;
}

// Master Data Loader
async function loadData() {
  try {
    const [eventRes, giftsRes, contribRes, guestRes, statsRes, ordersRes, escrowRes, dbRes, galleryRes] = await Promise.all([
      fetch('/api/event').then(r => r.json()).catch(() => null),
      fetch('/api/gifts').then(r => r.json()).catch(() => null),
      fetch('/api/contributions').then(r => r.json()).catch(() => null),
      fetch('/api/guestbook').then(r => r.json()).catch(() => null),
      fetch('/api/stats').then(r => r.json()).catch(() => null),
      fetch('/api/vendor/orders').then(r => r.json()).catch(() => null),
      fetch('/api/escrow/overview').then(r => r.json()).catch(() => null),
      fetch('/api/db/stats').then(r => r.json()).catch(() => null),
      fetch('/api/gallery').then(r => r.json()).catch(() => null)
    ]);

    if (eventRes && eventRes.success) {
      state.event = eventRes.event;
      state.gifts = giftsRes?.success ? giftsRes.gifts : [];
      state.contributions = contribRes?.success ? contribRes.contributions : [];
      state.guestbook = guestRes?.success ? guestRes.guestbook : [];
      state.stats = statsRes?.success ? statsRes.stats : {};
      state.vendorOrders = ordersRes?.success ? ordersRes.orders : [];
      state.vendorSummary = ordersRes?.success ? ordersRes.summary : {};
      state.escrowSummary = escrowRes?.success ? escrowRes.escrow_summary : {};
      state.escrowItems = escrowRes?.success ? escrowRes.escrow_items : [];
      state.payoutRequests = escrowRes?.success ? escrowRes.payout_requests : [];
      state.dbStats = dbRes?.success ? dbRes.database : {};
      state.gallery = galleryRes?.success ? galleryRes.gallery : [];
      state.apiAvailable = true;
    } else {
      throw new Error('API offline');
    }
  } catch (e) {
    console.log('GitHub Pages / Static Hosting Mode Active');
    state.apiAvailable = false;
    const cachedEvent = localStorage.getItem('utsab_event');
    state.event = cachedEvent ? JSON.parse(cachedEvent) : defaultStaticState.event;
    const cachedGifts = localStorage.getItem('utsab_gifts');
    state.gifts = cachedGifts ? JSON.parse(cachedGifts) : defaultStaticState.gifts;
    const cachedGallery = localStorage.getItem('utsab_gallery');
    state.gallery = cachedGallery ? JSON.parse(cachedGallery) : defaultStaticState.gallery;
    const cachedGuestbook = localStorage.getItem('utsab_guestbook');
    state.guestbook = cachedGuestbook ? JSON.parse(cachedGuestbook) : defaultStaticState.guestbook;
    state.stats = {
      total_gifts: state.gifts.length,
      claimed_gifts: state.gifts.filter(g => g.status === 'claimed').length,
      total_amount_raised: 83000,
      total_salami_raised: 15001,
      total_platform_commission: 4150
    };
    state.escrowSummary = {
      total_reserved_funds: 83000,
      available_for_couple_withdrawal: 78850,
      held_for_vendor_delivery: 0,
      platform_commission_held: 4150
    };
  }

  const savedWeddingTheme = localStorage.getItem('utsab_wedding_theme') || state.event?.theme_color || 'sindoor-gold';
  setWeddingTheme(savedWeddingTheme);
  const savedFont = localStorage.getItem('utsab_font_theme') || 'regal-tiro';
  setFontTheme(savedFont);
  startCountdown();
  renderAll();
  renderVendorCatalogModal();
}

function applyTheme(themeName) {
  setWeddingTheme(themeName);
}

function setFontTheme(fontTheme) {
  document.body.setAttribute('data-font', fontTheme);
  localStorage.setItem('utsab_font_theme', fontTheme);
  const select1 = document.getElementById('font-theme-select');
  if (select1) select1.value = fontTheme;
  const select2 = document.getElementById('admin-font-theme');
  if (select2) select2.value = fontTheme;
}

function setLanguage(lang) {
  state.currentLang = lang;
  document.getElementById('lang-btn-bn')?.classList.toggle('bg-amber-100', lang === 'bn');
  document.getElementById('lang-btn-bn')?.classList.toggle('text-amber-900', lang === 'bn');
  document.getElementById('lang-btn-en')?.classList.toggle('bg-amber-100', lang === 'en');
  document.getElementById('lang-btn-en')?.classList.toggle('text-amber-900', lang === 'en');
  renderAll();
}

function renderAll() {
  const steps = [
    renderHeroAndPhotos,
    renderStatsStrip,
    renderSectionOrganizerDisplay,
    renderGallery,
    renderGifts,
    renderSalamiPresets,
    renderGuestbook,
    renderAdminPanel,
    renderVendorOrdersLedger,
    renderEscrowDashboard,
    renderDatabaseStats
  ];
  for (const step of steps) {
    try {
      step();
    } catch (err) {
      console.warn('renderAll module notice:', step.name, err);
    }
  }
}

function startCountdown() {
  function update() {
    if (!state.event || !state.event.event_date) return;
    const targetDate = new Date(`${state.event.event_date}T19:00:00+06:00`).getTime();
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      ['countdown-days', 'countdown-hours', 'countdown-mins', 'countdown-secs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = state.currentLang === 'bn' ? '০০' : '00';
      });
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');

    if (state.currentLang === 'bn') {
      if (daysEl) daysEl.innerText = toBanglaNumber(pad(d));
      if (hoursEl) hoursEl.innerText = toBanglaNumber(pad(h));
      if (minsEl) minsEl.innerText = toBanglaNumber(pad(m));
      if (secsEl) secsEl.innerText = toBanglaNumber(pad(s));
    } else {
      if (daysEl) daysEl.innerText = pad(d);
      if (hoursEl) hoursEl.innerText = pad(h);
      if (minsEl) minsEl.innerText = pad(m);
      if (secsEl) secsEl.innerText = pad(s);
    }
  }
  update();
  setInterval(update, 1000);
}

function renderHeroAndPhotos() {
  const ev = state.event;
  if (!ev) return;
  const isBn = state.currentLang === 'bn';

  const titleEl = document.getElementById('hero-title');
  if (titleEl) titleEl.innerText = isBn ? (ev.title_bn || ev.title_en) : ev.title_en;

  const groomEl = document.getElementById('hero-groom');
  if (groomEl) groomEl.innerText = isBn ? (ev.groom_bn || ev.groom_name) : ev.groom_name;

  const brideEl = document.getElementById('hero-bride');
  if (brideEl) brideEl.innerText = isBn ? (ev.bride_bn || ev.bride_name) : ev.bride_name;

  const welcomeEl = document.getElementById('hero-welcome-msg');
  if (welcomeEl) welcomeEl.innerText = ev.welcome_msg || '';

  const venueNameEl = document.getElementById('hero-venue-name');
  if (venueNameEl) venueNameEl.innerText = ev.venue_name || '';

  const venueAddrEl = document.getElementById('hero-venue-address');
  if (venueAddrEl) venueAddrEl.innerText = ev.venue_address || '';

  if (ev.groom_photo && document.getElementById('hero-groom-img')) {
    document.getElementById('hero-groom-img').src = normalizeImagePath(ev.groom_photo);
  }
  if (ev.bride_photo && document.getElementById('hero-bride-img')) {
    document.getElementById('hero-bride-img').src = normalizeImagePath(ev.bride_photo);
  }
  if (ev.couple_photo && document.getElementById('hero-couple-img')) {
    document.getElementById('hero-couple-img').src = normalizeImagePath(ev.couple_photo);
  }

  const storyTextEl = document.getElementById('story-text');
  if (storyTextEl) storyTextEl.innerText = ev.story || '';

  const storyVenueTitleEl = document.getElementById('story-venue-title');
  if (storyVenueTitleEl) storyVenueTitleEl.innerText = ev.venue_name || '';

  const storyVenueAddrEl = document.getElementById('story-venue-addr');
  if (storyVenueAddrEl) storyVenueAddrEl.innerText = ev.venue_address || '';
}

function renderStatsStrip() {
  const s = state.stats;
  const isBn = state.currentLang === 'bn';

  document.getElementById('stat-claimed-gifts').innerText = isBn ?
    `${toBanglaNumber(s.claimed_gifts || 0)} / ${toBanglaNumber(s.total_gifts || 0)}` :
    `${s.claimed_gifts || 0} / ${s.total_gifts || 0}`;

  document.getElementById('stat-total-raised').innerText = formatCurrency(s.total_amount_raised || 0);
  document.getElementById('stat-total-salami').innerText = formatCurrency(s.total_salami_raised || 0);
  document.getElementById('stat-platform-commission').innerText = formatCurrency(s.total_platform_commission || 0);
}

// ==========================================
// ESCROW & FUND RESERVATION ENGINE
// ==========================================
function renderEscrowDashboard() {
  const s = state.escrowSummary || {};
  document.getElementById('escrow-total-reserved').innerText = formatCurrency(s.total_reserved_funds || 0);
  document.getElementById('escrow-available-withdrawal').innerText = formatCurrency(s.available_for_couple_withdrawal || 0);
  document.getElementById('escrow-vendor-held').innerText = formatCurrency(s.held_for_vendor_delivery || 0);
  document.getElementById('escrow-commission-held').innerText = formatCurrency(s.platform_commission_held || 0);

  // Escrow Ledger Table
  const tbody = document.getElementById('admin-escrow-tbody');
  if (!tbody) return;

  if (state.escrowItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-gray-400">কোনো সংরক্ষিত তহবিল রেকর্ড নেই</td></tr>`;
    return;
  }

  tbody.innerHTML = state.escrowItems.map(item => {
    const isReserved = item.escrow_status === 'reserved';
    const statusLabel = isReserved ?
      '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">🔒 এসক্রোতে সংরক্ষিত (Reserved)</span>' :
      item.escrow_status === 'released_host' ?
      '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">✅ বর-কনেকে রিলিজকৃত</span>' :
      '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">📦 ভেন্ডরে রিলিজকৃত</span>';

    return `
      <tr class="border-b border-gray-100 hover:bg-amber-50/50">
        <td class="py-3 px-3 font-mono font-bold text-gray-800 text-[11px]">${item.id}</td>
        <td class="py-3 px-3">
          <span class="font-bold text-gray-900 block text-xs">${item.item_name}</span>
          <span class="text-[10px] text-gray-400">${item.contributor_name} (${item.contributor_phone || ''})</span>
        </td>
        <td class="py-3 px-3 text-xs font-bold text-gray-900">${formatCurrency(item.total_amount)}</td>
        <td class="py-3 px-3 text-xs font-bold text-emerald-700">${formatCurrency(item.net_reserved)}</td>
        <td class="py-3 px-3 text-[11px] text-gray-600 font-bangla">
          ${item.release_condition === 'vendor_delivery_confirmed' ? 'ভেন্ডর ডেলিভারি কনফার্মেশন' :
            item.release_condition === 'group_gift_completion' ? '১০০% গ্রুপ গিফট পূর্ণ হলে' : 'সরাসরি বর-কনেকে প্রাপ্য'}
        </td>
        <td class="py-3 px-3">${statusLabel}</td>
        <td class="py-3 px-3 text-right">
          ${isReserved ? `
            <button onclick="releaseEscrowFunds('${item.id}', 'released_host')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm whitespace-nowrap">
              তহবিল রিলিজ করুন
            </button>
          ` : `
            <span class="text-xs text-gray-400 font-mono">Released</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

async function releaseEscrowFunds(escrowId, target) {
  if (!confirm(`আপনি কি এই এসক্রো তহবিল (${escrowId}) রিলিজ করতে চান?`)) return;

  if (state.apiAvailable) {
    try {
      await fetch(`/api/escrow/${escrowId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
    } catch (e) {}
  }

  const item = state.escrowItems.find(i => i.id === escrowId);
  if (item) {
    item.escrow_status = target;
    item.released_at = new Date().toISOString();
  }

  loadData();
  triggerConfetti();
  alert('তহবিল সফলভাবে এসক্রো থেকে রিলিজ করা হয়েছে!');
}

function openWithdrawModal() {
  const avail = state.escrowSummary?.available_for_couple_withdrawal || 0;
  document.getElementById('withdraw-avail-display').innerText = formatCurrency(avail);
  document.getElementById('withdraw-amount-input').max = avail;
  document.getElementById('withdraw-amount-input').value = avail;
  document.getElementById('withdraw-modal').classList.remove('hidden');
  document.getElementById('withdraw-modal').classList.add('flex');
}

function closeWithdrawModal() {
  document.getElementById('withdraw-modal').classList.add('hidden');
  document.getElementById('withdraw-modal').classList.remove('flex');
}

async function submitWithdrawalRequest(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('withdraw-amount-input').value) || 0;
  const method = document.getElementById('withdraw-method-select').value;
  const account = document.getElementById('withdraw-account-input').value.trim();

  if (amount <= 0 || !account) {
    alert('সঠিক টাকার পরিমাণ ও একাউন্ট নম্বর দিন');
    return;
  }

  if (state.apiAvailable) {
    try {
      const res = await fetch('/api/escrow/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, payout_method: method, payout_account: account })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      }
    } catch (e) {
      alert(`উত্তোলন সফল! ৳ ${amount.toLocaleString()} টাকা ${method} একাউন্টে ট্রান্সফার করা হয়েছে।`);
    }
  } else {
    alert(`উত্তোলন সফল! ৳ ${amount.toLocaleString()} টাকা ${method} একাউন্টে ট্রান্সফার করা হয়েছে।`);
  }

  closeWithdrawModal();
  loadData();
  triggerConfetti();
  playAuspiciousChime();
}

// ==========================================
// DATABASE STORAGE & EXPORT MANAGEMENT
// ==========================================
function renderDatabaseStats() {
  const db = state.dbStats || {};
  document.getElementById('db-engine-display').innerText = db.engine || 'SQLite3 (Embedded ACID)';
  document.getElementById('db-size-display').innerText = db.file_size_formatted || '48.0 KB';
  document.getElementById('db-status-display').innerText = db.status || 'Active & ACID Synchronized';
  document.getElementById('db-filepath-display').innerText = db.filepath || 'utsab.db';

  if (db.tables) {
    const tableListHtml = Object.entries(db.tables).map(([tbl, count]) => `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-mono font-medium">
        <strong>${tbl}</strong>: ${count}
      </span>
    `).join(' ');
    document.getElementById('db-tables-badges').innerHTML = tableListHtml;
  }
}

function downloadDatabaseSnapshot() {
  window.location.href = '/api/db/export';
}

function triggerDbRestoreInput() {
  document.getElementById('db-restore-file-input').click();
}

async function handleDatabaseRestoreFile(inputElement) {
  const file = inputElement.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const dump = JSON.parse(e.target.result);
      if (!confirm('সতর্কতা: বর্তমান ডেটাবেস এই স্ন্যাপশট দ্বারা সম্পূর্ণ প্রতিস্থাপিত হবে। এগিয়ে যাবেন?')) return;

      const res = await fetch('/api/db/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database_dump: dump })
      });
      const data = await res.json();
      if (data.success) {
        alert('ডেটাবেস সফলভাবে রিস্টোর করা হয়েছে!');
        loadData();
      }
    } catch (err) {
      alert('অবৈধ ব্যাকআপ ফাইল। সঠিক JSON স্ন্যাপশট আপলোড করুন।');
    }
  };
  reader.readAsText(file);
}

async function saveCloudDbConfig(e) {
  e.preventDefault();
  const uri = document.getElementById('db-cloud-uri-input').value.trim();
  const provider = document.getElementById('db-cloud-provider-select').value;

  if (state.apiAvailable) {
    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ external_uri: uri, cloud_provider: provider })
      });
      const data = await res.json();
      if (data.success) {
        alert('ক্লাউড ডেটাবেস স্টোরেজ কনফিগারেশন সংরক্ষিত হয়েছে!');
        loadData();
      }
    } catch (e) {}
  }
}

// ==========================================
// RENDER GALLERY, SECTIONS & GIFTS
// ==========================================
function renderGallery() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  if (state.gallery.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-400">
        <i class="fa-regular fa-images text-4xl mb-3 text-amber-600/40"></i>
        <p class="text-sm">এখনো কোনো ছবি যোগ করা হয়নি। প্রি-ওয়েডিং ও ভ্রমণের ছবি আপলোড করুন।</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.gallery.map(item => `
    <div class="gallery-card group relative h-64 rounded-2xl overflow-hidden border border-amber-200/80 shadow-sm bg-gray-100">
      <img src="${normalizeImagePath(item.image_url)}" alt="${item.caption || 'Photo'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
      <div class="gallery-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 text-white">
        <p class="text-xs font-bold font-bangla text-amber-200">${item.caption || 'আমাদের সুন্দর স্মৃতি'}</p>
        <span class="text-[10px] text-gray-300 mt-0.5">Utsab Moments</span>
      </div>
    </div>
  `).join('');
}

function renderSectionOrganizerDisplay() {
  const main = document.getElementById('sections-container');
  if (!main) return;

  const defaultOrder = ["hero", "invitation", "rituals", "venue", "gifts", "salami", "gallery", "story", "guestbook"];
  const order = state.event?.section_order && state.event.section_order.length > 0 ? state.event.section_order : defaultOrder;
  const visibility = state.event?.section_visibility || {};

  order.forEach(sectionId => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      main.appendChild(el);
      const isVisible = visibility[sectionId] !== false;
      el.classList.toggle('hidden', !isVisible);
    }
  });

  renderAdminOrganizerControls();
}

function renderAdminOrganizerControls() {
  const tbody = document.getElementById('admin-organizer-tbody');
  if (!tbody) return;

  const defaultOrder = ["hero", "invitation", "rituals", "venue", "gifts", "salami", "gallery", "story", "guestbook"];
  const order = state.event?.section_order && state.event.section_order.length > 0 ? state.event.section_order : defaultOrder;
  const visibility = state.event?.section_visibility || {};

  const sectionNames = {
    hero: '👑 বর-কনে পরিচিতি ও লগ্ন কাউন্টডাউন ব্যানার (Hero Section)',
    invitation: '📜 মাঙ্গলিক নিমন্ত্রণ পত্র (Sacred Wedding Invitation)',
    rituals: '🪔 মাঙ্গলিক লগ্ন ও আচার অনুষ্ঠান (Rituals & Lagna Itinerary)',
    venue: '📍 অনুষ্ঠানস্থল ও গুগল ম্যাপ লোকেশন (Venue & Google Map)',
    gallery: '📸 স্মৃতি ও মধুর মুহূর্ত মালা (Photo Gallery)',
    gifts: '🎁 মাঙ্গলিক উপহার রেজিস্ট্রি ও উইশলিস্ট (Gifts Registry)',
    salami: '🧧 শুভ আশীর্বাদী ও প্রণামী খাম (Ashirbadi & Pronami Envelope)',
    story: '📖 আমাদের শুভ পরিণয় গাথা (Sacred Journey & Story)',
    guestbook: '✍️ শুভাশিষ ও মঙ্গলগাথা খাতা (Guestbook)'
  };

  tbody.innerHTML = order.map((sId, idx) => {
    const isVisible = visibility[sId] !== false;
    return `
      <tr class="border-b border-gray-100 hover:bg-amber-50/50">
        <td class="py-3 px-4 font-bold text-gray-500 text-xs">${idx + 1}</td>
        <td class="py-3 px-4 text-sm font-semibold text-gray-900">${sectionNames[sId] || sId}</td>
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSectionVisibility('${sId}', this.checked)" ${isVisible ? 'checked' : ''} class="w-4 h-4 text-amber-700 rounded border-gray-300">
        </td>
        <td class="py-3 px-4 text-right space-x-1">
          <button type="button" onclick="moveSectionOrder('${sId}', -1)" ${idx === 0 ? 'disabled class="opacity-30 p-1.5"' : 'class="p-1.5 text-gray-700 hover:text-amber-800"'} title="উপরে তুলুন">
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button type="button" onclick="moveSectionOrder('${sId}', 1)" ${idx === order.length - 1 ? 'disabled class="opacity-30 p-1.5"' : 'class="p-1.5 text-gray-700 hover:text-amber-800"'} title="নিচে নামান">
            <i class="fa-solid fa-arrow-down"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function moveSectionOrder(sectionId, direction) {
  const defaultOrder = ["hero", "invitation", "rituals", "gifts", "salami", "gallery", "story", "guestbook"];
  const order = [...(state.event.section_order && state.event.section_order.length > 0 ? state.event.section_order : defaultOrder)];
  const idx = order.indexOf(sectionId);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= order.length) return;

  const temp = order[idx];
  order[idx] = order[newIdx];
  order[newIdx] = temp;

  state.event.section_order = order;
  saveLayoutSettings();
}

function toggleSectionVisibility(sectionId, isVisible) {
  if (!state.event.section_visibility) state.event.section_visibility = {};
  state.event.section_visibility[sectionId] = isVisible;
  saveLayoutSettings();
}

async function saveLayoutSettings() {
  renderSectionOrganizerDisplay();
  if (state.apiAvailable) {
    try {
      await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_order: state.event.section_order,
          section_visibility: state.event.section_visibility
        })
      });
    } catch (e) {}
  }
}

// ==========================================
// PHOTO UPLOAD
// ==========================================
async function handlePhotoUpload(inputElement, targetType) {
  const file = inputElement.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    let finalUrl = base64Data;

    if (state.apiAvailable) {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: base64Data, filename: file.name })
        });
        const d = await res.json();
        if (d.success && d.url) finalUrl = d.url;
      } catch (err) {}
    }

    if (targetType === 'groom') {
      state.event.groom_photo = finalUrl;
      document.getElementById('hero-groom-img').src = finalUrl;
      document.getElementById('admin-groom-img-preview').src = finalUrl;
    } else if (targetType === 'bride') {
      state.event.bride_photo = finalUrl;
      document.getElementById('hero-bride-img').src = finalUrl;
      document.getElementById('admin-bride-img-preview').src = finalUrl;
    } else if (targetType === 'couple') {
      state.event.couple_photo = finalUrl;
      document.getElementById('hero-couple-img').src = finalUrl;
      document.getElementById('admin-couple-img-preview').src = finalUrl;
    } else if (targetType === 'gallery') {
      const caption = prompt('ছবির ক্যাপশন লিখুন (যেমন: আমাদের প্রথম দেখা):') || 'আমাদের সুন্দর মুহূর্ত';
      const newGal = { id: `gal-${Date.now()}`, image_url: finalUrl, caption, order_idx: state.gallery.length + 1 };
      state.gallery.push(newGal);
      renderGallery();
      if (state.apiAvailable) {
        fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGal)
        }).catch(() => {});
      }
      alert('ছবিটি গ্যালারিতে সফলভাবে যুক্ত হয়েছে!');
    }

    if (['groom', 'bride', 'couple'].includes(targetType)) {
      saveLayoutSettings();
      alert('ছবি সফলভাবে আপডেট হয়েছে!');
    }
  };
  reader.readAsDataURL(file);
}

// ==========================================
// VENDOR 1-CLICK URL IMPORTER
// ==========================================
async function importVendorProductFromUrl(e) {
  e.preventDefault();
  const input = document.getElementById('vendor-url-input');
  const url = input.value.trim();
  if (!url) return;

  const btn = document.getElementById('vendor-import-btn');
  btn.disabled = true;
  btn.innerText = 'ইমপোর্ট হচ্ছে...';

  try {
    let product = null;
    if (state.apiAvailable) {
      const res = await fetch('/api/vendor/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) product = data.product;
    }

    if (!product) {
      product = parseVendorUrlClient(url);
    }

    document.getElementById('import-preview-box').classList.remove('hidden');
    document.getElementById('import-preview-img').src = product.image_url;
    document.getElementById('import-preview-title').innerText = product.title;
    document.getElementById('import-preview-vendor').innerText = product.merchant_name;
    document.getElementById('import-preview-price').innerText = formatCurrency(product.price);

    window._lastImportedProduct = product;
    btn.innerText = 'ইমপোর্ট সফল!';
  } catch (err) {
    alert('প্রোডাক্ট ইমপোর্ট করতে সমস্যা হয়েছে। অনুগ্রহ করে লিংকটি চেক করুন।');
    btn.innerText = '১-ক্লিকে ইমপোর্ট করুন';
  } finally {
    btn.disabled = false;
  }
}

function parseVendorUrlClient(url) {
  let vendor = 'Daraz BD';
  let title = 'Imported Bangladeshi Registry Item';
  let price = 12500;
  let category = 'appliances';
  let image = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';

  if (url.includes('aarong.com')) {
    vendor = 'Aarong Lifestyle';
    title = 'Aarong Jamdani Handloom Silk Collection';
    price = 16800;
    category = 'luxury';
    image = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
  } else if (url.includes('walton')) {
    vendor = 'Walton Plaza BD';
    title = 'Walton Inverter Smart Home Unit';
    price = 54000;
    category = 'appliances';
    image = 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80';
  } else if (url.includes('transcom')) {
    vendor = 'Transcom Digital';
    title = 'Philips RapidAir Multi-Cooker Appliance';
    price = 15200;
    category = 'kitchen';
    image = 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80';
  }

  return {
    title,
    title_bn: title,
    merchant_name: vendor,
    merchant_url: url,
    category,
    price,
    image_url: image,
    description: `Directly connected from ${vendor} catalog. Funds reserved in escrow until fulfillment.`,
    is_group_gift: 0
  };
}

async function addImportedProductToRegistry() {
  const product = window._lastImportedProduct;
  if (!product) return;

  const isGroup = document.getElementById('import-allow-group').checked ? 1 : 0;
  product.is_group_gift = isGroup;

  if (state.apiAvailable) {
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (data.gift_id) product.id = data.gift_id;
    } catch (e) {}
  }

  if (!product.id) product.id = `gift-${Date.now()}`;
  product.target_amount = product.price;
  product.current_amount = 0;
  product.status = 'available';

  state.gifts.unshift(product);
  renderGifts();
  closeVendorConnectModal();
  triggerConfetti();
  alert(`${product.merchant_name} থেকে "${product.title}" সফলভাবে আপনার রেজিস্ট্রিতে যোগ হয়েছে!`);
}

function renderVendorCatalogModal() {
  const container = document.getElementById('vendor-catalog-grid');
  if (!container) return;

  container.innerHTML = vendorQuickCatalog.map((item, idx) => `
    <div class="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between">
      <div class="h-32 rounded-xl overflow-hidden mb-2 relative">
        <img src="${normalizeImagePath(item.image_url)}" alt="${item.title}" class="w-full h-full object-cover">
        <span class="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded ${
          item.vendor.includes('Aarong') ? 'vendor-badge-aarong' :
          item.vendor.includes('Walton') ? 'vendor-badge-walton' :
          item.vendor.includes('Transcom') ? 'vendor-badge-transcom' :
          item.vendor.includes('Monno') ? 'vendor-badge-monno' : 'vendor-badge-daraz'
        }">${item.vendor}</span>
      </div>
      <div>
        <h5 class="text-xs font-bold text-gray-900 line-clamp-2">${item.title}</h5>
        <span class="text-sm font-bold text-amber-900 block mt-1">${formatCurrency(item.price)}</span>
      </div>
      <button onclick="addCatalogItem(${idx})" class="mt-2.5 w-full py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition">
        + ১-ক্লিকে রেজিস্ট্রিতে যোগ করুন
      </button>
    </div>
  `).join('');
}

function addCatalogItem(idx) {
  const item = { ...vendorQuickCatalog[idx] };
  window._lastImportedProduct = item;
  addImportedProductToRegistry();
}

function openVendorConnectModal() {
  document.getElementById('vendor-modal').classList.remove('hidden');
  document.getElementById('vendor-modal').classList.add('flex');
}

function closeVendorConnectModal() {
  document.getElementById('vendor-modal').classList.add('hidden');
  document.getElementById('vendor-modal').classList.remove('flex');
}

// ==========================================
// RENDER GIFTS WITH ESCROW BADGE
// ==========================================
function renderGifts() {
  const container = document.getElementById('gifts-grid');
  if (!container) return;

  const isBn = state.currentLang === 'bn';
  const query = state.searchQuery.toLowerCase().trim();

  const filtered = state.gifts.filter(g => {
    if (state.activeCategory !== 'all') {
      if (state.activeCategory === 'group' && !g.is_group_gift) return false;
      if (state.activeCategory !== 'group' && g.category !== state.activeCategory) return false;
    }
    if (query) {
      const matchEn = (g.title || '').toLowerCase().includes(query);
      const matchBn = (g.title_bn || '').toLowerCase().includes(query);
      const matchVendor = (g.merchant_name || '').toLowerCase().includes(query);
      if (!matchEn && !matchBn && !matchVendor) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-gray-500">
        <i class="fa-solid fa-gift text-4xl mb-3 text-amber-600/40"></i>
        <p class="text-base font-medium">${isBn ? 'এই ক্যাটাগরিতে কোনো উপহার খুঁজে পাওয়া যায়নি' : 'No gifts found.'}</p>
        <button onclick="openVendorConnectModal()" class="mt-3 text-xs bg-amber-900 text-white px-4 py-2 rounded-xl font-bold">
          + ভেন্ডর শপ থেকে নতুন উপহার যোগ করুন
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(gift => {
    const isClaimed = gift.status === 'claimed';
    const isGroup = !!gift.is_group_gift;
    const current = gift.current_amount || 0;
    const target = gift.target_amount || gift.price;
    const percent = Math.min(100, Math.round((current / target) * 100));
    const remaining = Math.max(0, target - current);

    let badgeClass = 'vendor-badge-daraz';
    const vendorName = gift.merchant_name || 'Daraz BD';
    if (vendorName.includes('Aarong')) badgeClass = 'vendor-badge-aarong';
    else if (vendorName.includes('Walton')) badgeClass = 'vendor-badge-walton';
    else if (vendorName.includes('Transcom')) badgeClass = 'vendor-badge-transcom';
    else if (vendorName.includes('Monno')) badgeClass = 'vendor-badge-monno';
    else if (vendorName.includes('Pickaboo')) badgeClass = 'vendor-badge-pickaboo';

    return `
      <div class="group bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
        <div class="relative h-56 w-full overflow-hidden bg-gray-50">
          <img src="${gift.image_url}" alt="${gift.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          
          <div class="absolute top-3 left-3 flex flex-col gap-1.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md ${badgeClass}">
              <i class="fa-solid fa-store"></i> ${vendorName}
            </span>
            ${isClaimed ? `
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ✅ সম্পন্ন (Claimed)
              </span>
            ` : isGroup ? `
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                🤝 গ্রুপ গিফট (${percent}%)
              </span>
            ` : ''}
          </div>

          <div class="absolute top-3 right-3">
            <span class="bg-black/70 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <i class="fa-solid fa-shield-halved text-amber-400"></i> এসক্রো সুরক্ষিত
            </span>
          </div>

          ${gift.merchant_url ? `
            <a href="${gift.merchant_url}" target="_blank" rel="noopener" class="absolute bottom-3 right-3 text-[10px] font-bold bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-gray-700 hover:text-amber-900 border border-gray-200 shadow flex items-center gap-1" title="ভেন্ডরের অফিশিয়াল পেজ দেখুন">
              <i class="fa-solid fa-arrow-up-right-from-square text-amber-700"></i> শপ লিংক
            </a>
          ` : ''}
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-baseline justify-between gap-2 mb-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-800">${gift.category}</span>
              <span class="text-lg font-bold text-gray-900 font-serif-wedding">${formatCurrency(gift.price)}</span>
            </div>
            <h3 class="text-sm font-bold text-gray-800 leading-snug mb-2 font-bangla group-hover:text-amber-900 transition-colors">
              ${isBn ? (gift.title_bn || gift.title) : gift.title}
            </h3>
            <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              ${gift.description || ''}
            </p>

            ${isGroup ? `
              <div class="mt-4 pt-3 border-t border-amber-100/60">
                <div class="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
                  <span>উত্তোলিত: <strong class="text-amber-900">${formatCurrency(current)}</strong></span>
                  <span>বাকি: <strong class="text-gray-900">${formatCurrency(remaining)}</strong></span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div class="h-2 rounded-full ${percent >= 100 ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-500 to-amber-700'}" style="width: ${percent}%"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="mt-5">
            ${isClaimed ? `
              <button disabled class="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-check"></i> সম্পূর্ণ উপহার দেওয়া হয়েছে
              </button>
            ` : `
              <button onclick="openPaymentModal('${gift.id}')" class="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);">
                <i class="fa-solid fa-cart-shopping text-amber-300"></i>
                <span>${isGroup ? 'শেয়ার করে অংশ নিন (Chip In)' : 'সরাসরি অর্ডার ও উপহার দিন'}</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setCategory(cat) {
  state.activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    const isTarget = btn.getAttribute('data-cat') === cat;
    btn.classList.toggle('bg-amber-900', isTarget);
    btn.classList.toggle('text-white', isTarget);
    btn.classList.toggle('bg-amber-50', !isTarget);
    btn.classList.toggle('text-amber-900', !isTarget);
  });
  renderGifts();
}

function onSearchChange(e) {
  state.searchQuery = e.target.value;
  renderGifts();
}

function renderSalamiPresets() {
  const container = document.getElementById('salami-preset-pills');
  if (!container) return;
  const presets = [501, 1001, 2001, 5001, 10001, 25001];
  container.innerHTML = presets.map((amt, idx) => `
    <button type="button" onclick="selectSalamiPreset(${amt})" class="preset-pill px-3 py-2 rounded-xl font-bold text-xs border-2 transition ${idx === 1 ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-amber-300/40 bg-white/10 text-amber-100 hover:bg-white/20'}">
      ${formatCurrency(amt)}
    </button>
  `).join('');
}

function selectSalamiPreset(amt) {
  const input = document.getElementById('salami-custom-input');
  if (input) input.value = amt;
}

function submitSalamiForm(e) {
  e.preventDefault();
  const input = document.getElementById('salami-custom-input');
  const amount = parseFloat(input.value) || 1001;
  const note = document.getElementById('salami-blessing-note')?.value || '';
  openPaymentModal('salami-fund', amount, note);
}

function renderVendorOrdersLedger() {
  const tbody = document.getElementById('admin-vendor-orders-tbody');
  if (!tbody) return;

  const summary = state.vendorSummary || {};
  const commTotal = document.getElementById('admin-comm-total');
  if (commTotal) commTotal.innerText = formatCurrency(summary.total_platform_commission || 0);
  const commGmv = document.getElementById('admin-comm-gmv');
  if (commGmv) commGmv.innerText = formatCurrency(summary.total_gmv || 0);
  const commPayouts = document.getElementById('admin-comm-payouts');
  if (commPayouts) commPayouts.innerText = formatCurrency(summary.total_vendor_payouts || 0);
  const commOrdersCount = document.getElementById('admin-comm-orders-count');
  if (commOrdersCount) commOrdersCount.innerText = `${summary.total_orders || 0} টি`;

  if (state.vendorOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-gray-400">কোনো ভেন্ডর অর্ডার এখনো তৈরি হয়নি</td></tr>`;
    return;
  }

  tbody.innerHTML = state.vendorOrders.map(o => `
    <tr class="border-b border-gray-100 hover:bg-amber-50/50">
      <td class="py-3 px-3 font-mono font-bold text-gray-800 text-[11px]">${o.id}</td>
      <td class="py-3 px-3">
        <span class="font-bold text-gray-900 block text-xs">${o.product_title}</span>
        <span class="text-[10px] text-amber-800 font-semibold">${o.vendor_name}</span>
      </td>
      <td class="py-3 px-3">
        <span class="text-xs text-gray-800 block">${o.buyer_name}</span>
        <span class="text-[10px] text-gray-400">${o.buyer_phone || ''}</span>
      </td>
      <td class="py-3 px-3 text-xs font-bold text-gray-900">${formatCurrency(o.total_amount)}</td>
      <td class="py-3 px-3 text-xs font-bold text-emerald-700">${formatCurrency(o.platform_commission)} (${o.commission_rate}%)</td>
      <td class="py-3 px-3 text-xs font-mono text-gray-700">${formatCurrency(o.vendor_payout)}</td>
      <td class="py-3 px-3">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
          o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
          o.status === 'dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
        }">${o.status.toUpperCase()}</span>
      </td>
      <td class="py-3 px-3 text-right">
        ${o.status === 'placed' ? `
          <button onclick="updateOrderStatus('${o.id}', 'dispatched')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-800 text-white hover:bg-amber-900">
            ভেন্ডরে পাঠান
          </button>
        ` : o.status === 'dispatched' ? `
          <button onclick="updateOrderStatus('${o.id}', 'delivered')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800">
            ডেলিভারি কনফার্ম
          </button>
        ` : `
          <span class="text-xs text-emerald-700 font-bold">✅ সম্পন্ন</span>
        `}
      </td>
    </tr>
  `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  const order = state.vendorOrders.find(o => o.id === orderId);
  if (order) order.status = newStatus;
  renderVendorOrdersLedger();

  if (state.apiAvailable) {
    fetch(`/api/vendor/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).catch(() => {});
  }
}

function renderGuestbook() {
  const container = document.getElementById('guestbook-list');
  if (!container) return;

  if (state.guestbook.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-400">
        <i class="fa-regular fa-comment-dots text-4xl mb-3 text-amber-600/40"></i>
        <p class="text-sm">প্রথম দোয়া ও শুভেচ্ছাটি আপনিই জানান!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.guestbook.map(msg => `
    <div class="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
      <div class="flex items-center gap-3 mb-2.5">
        <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-base">
          ${msg.reaction || '🌸'}
        </div>
        <div>
          <h4 class="font-bold text-gray-900 text-xs">${msg.name}</h4>
          <span class="text-[11px] text-amber-800 font-medium">${msg.relation || 'শুভাকাঙ্ক্ষী'}</span>
        </div>
      </div>
      <p class="text-gray-700 text-xs leading-relaxed font-bangla whitespace-pre-line">${msg.message}</p>
    </div>
  `).join('');
}

async function submitGuestbookForm(e) {
  e.preventDefault();
  const name = document.getElementById('gb-name').value.trim();
  const relation = document.getElementById('gb-relation').value.trim();
  const message = document.getElementById('gb-message').value.trim();
  const reaction = document.getElementById('gb-reaction').value;
  if (!message) return;

  const newEntry = { name: name || 'শুভাকাঙ্ক্ষী', relation: relation || 'অতিথি', message, reaction };
  if (state.apiAvailable) {
    fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    }).catch(() => {});
  }

  state.guestbook.unshift({ id: `b-${Date.now()}`, ...newEntry, created_at: new Date().toISOString() });
  document.getElementById('gb-message').value = '';
  renderGuestbook();
  triggerConfetti();
  playAuspiciousChime();
  alert('আপনার দোয়া ও শুভেচ্ছা সফলভাবে যোগ হয়েছে!');
}

// ==========================================
// PAYMENT & ESCROW FLOW
// ==========================================
let currentPaymentGift = null;

function openPaymentModal(giftId, defaultAmount = null, defaultBlessing = '') {
  const modal = document.getElementById('payment-modal');
  currentPaymentGift = giftId === 'salami-fund' ? null : state.gifts.find(g => g.id === giftId);

  const amountInput = document.getElementById('pay-amount-input');
  const titleDisplay = document.getElementById('pay-gift-title');
  const targetInfo = document.getElementById('pay-target-info');
  const blessingInput = document.getElementById('pay-blessing');

  if (currentPaymentGift) {
    titleDisplay.innerText = state.currentLang === 'bn' ? (currentPaymentGift.title_bn || currentPaymentGift.title) : currentPaymentGift.title;
    const remaining = Math.max(0, (currentPaymentGift.target_amount || currentPaymentGift.price) - (currentPaymentGift.current_amount || 0));

    if (currentPaymentGift.is_group_gift) {
      amountInput.value = Math.min(remaining, defaultAmount || 2000);
      amountInput.readOnly = false;
      targetInfo.innerText = `গ্রুপ গিফটের অবশিষ্ট: ${formatCurrency(remaining)} (তহবিল ১০০% পূর্ণ হওয়া পর্যন্ত এসক্রোতে সুরক্ষিত)`;
    } else {
      amountInput.value = currentPaymentGift.price;
      amountInput.readOnly = true;
      targetInfo.innerText = `ফুল পেমেন্ট: ${formatCurrency(currentPaymentGift.price)} (ভেন্ডর ডেলিভারি পর্যন্ত তহবিল সংরক্ষিত)`;
    }
  } else {
    titleDisplay.innerText = '🧧 ডিজিটাল বর-কনে সালামি খাম';
    amountInput.value = defaultAmount || 1000;
    amountInput.readOnly = false;
    targetInfo.innerText = 'সরাসরি বর-কনের একাউন্টে প্রত্যাহারযোগ্য সালামি প্রদান';
  }

  if (defaultBlessing) blessingInput.value = defaultBlessing;

  // Initialize Demo Simulator
  switchPaymentMode('pgw');
  selectPaymentMethod('bkash');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
  document.getElementById('payment-modal').classList.remove('flex');
}

// Payment Mode Switcher (Interactive PGW Demo vs Manual)
let activePaymentMode = 'pgw';
let activeSimulatedOtp = '849201';

function switchPaymentMode(mode) {
  activePaymentMode = mode;
  const tabPgw = document.getElementById('tab-pgw-mode');
  const tabManual = document.getElementById('tab-manual-mode');

  if (mode === 'pgw') {
    tabPgw.classList.add('bg-amber-900', 'text-white', 'shadow');
    tabPgw.classList.remove('bg-gray-100', 'text-gray-700');
    tabManual.classList.remove('bg-amber-900', 'text-white', 'shadow');
    tabManual.classList.add('bg-gray-100', 'text-gray-700');
    selectPaymentMethod(state.currentPaymentMethod || 'bkash');
  } else {
    tabManual.classList.add('bg-amber-900', 'text-white', 'shadow');
    tabManual.classList.remove('bg-gray-100', 'text-gray-700');
    tabPgw.classList.remove('bg-amber-900', 'text-white', 'shadow');
    tabPgw.classList.add('bg-gray-100', 'text-gray-700');

    document.querySelectorAll('.pgw-sim-container').forEach(c => c.classList.add('hidden'));
    document.getElementById('pgw-simulator-manual')?.classList.remove('hidden');
    generateManualQR();
  }
}

function selectPaymentMethod(method) {
  state.currentPaymentMethod = method;

  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    const isSelected = btn.getAttribute('data-method') === method;
    btn.classList.toggle('ring-4', isSelected);
    btn.classList.toggle('ring-amber-400', isSelected);
    btn.classList.toggle('opacity-100', isSelected);
    btn.classList.toggle('opacity-60', !isSelected);
  });

  if (activePaymentMode === 'manual') {
    document.querySelectorAll('.pgw-sim-container').forEach(c => c.classList.add('hidden'));
    document.getElementById('pgw-simulator-manual')?.classList.remove('hidden');
    generateManualQR();
    return;
  }

  // Hide all simulator views
  document.querySelectorAll('.pgw-sim-container').forEach(c => c.classList.add('hidden'));

  const amount = parseFloat(document.getElementById('pay-amount-input').value) || 1000;
  const formattedAmt = formatCurrency(amount);

  if (method === 'bkash') {
    const el = document.getElementById('pgw-simulator-bkash');
    if (el) el.classList.remove('hidden');
    document.getElementById('bkash-sim-amount').innerText = formattedAmt;
    document.getElementById('bkash-sim-invoice').innerText = Math.floor(1000 + Math.random() * 9000);
    advanceBkashStep(1);
  } else if (method === 'rocket') {
    const el = document.getElementById('pgw-simulator-rocket');
    if (el) el.classList.remove('hidden');
    const rktAmt = document.getElementById('rocket-sim-amount');
    if (rktAmt) rktAmt.innerText = formattedAmt;
    advanceRocketStep(1);
  } else if (method === 'nagad') {
    const el = document.getElementById('pgw-simulator-nagad');
    if (el) el.classList.remove('hidden');
    document.getElementById('nagad-sim-amount').innerText = formattedAmt;
    advanceNagadStep(1);
  } else if (method === 'bank') {
    const el = document.getElementById('pgw-simulator-bank');
    if (el) el.classList.remove('hidden');
  } else if (method === 'card') {
    const el = document.getElementById('pgw-simulator-card');
    if (el) el.classList.remove('hidden');
  } else {
    // Fallback to manual MFS / QR
    document.getElementById('pgw-simulator-manual')?.classList.remove('hidden');
    generateManualQR();
  }
}

// ==========================================
// ROCKET PGW SIMULATOR STEP FLOW
// ==========================================
function advanceRocketStep(step) {
  document.getElementById('rocket-step-1')?.classList.add('hidden');
  document.getElementById('rocket-step-2')?.classList.add('hidden');
  document.getElementById('rocket-step-3')?.classList.add('hidden');
  document.getElementById('rocket-step-spinner')?.classList.add('hidden');

  if (step === 1) {
    document.getElementById('rocket-step-1')?.classList.remove('hidden');
  } else if (step === 2) {
    activeSimulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById('rocket-step-2')?.classList.remove('hidden');
    showSimulatedSmsBanner(activeSimulatedOtp, 'DBBL Rocket');
  } else if (step === 3) {
    document.getElementById('rocket-step-3')?.classList.remove('hidden');
  }
}

function autoFillRocketOtp() {
  const input = document.getElementById('rocket-input-otp');
  if (input) input.value = activeSimulatedOtp;
}

function copyBankAccNumber() {
  const accNo = document.getElementById('bank-acc-no-display')?.innerText || '1501204892019001';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(accNo);
  }
  showToast('BRAC Bank হিসাব নম্বর (1501204892019001) কপি করা হয়েছে!');
}

// ==========================================
// bKASH PGW SIMULATOR STEP FLOW
// ==========================================
function advanceBkashStep(step) {
  document.getElementById('bkash-step-1')?.classList.add('hidden');
  document.getElementById('bkash-step-2')?.classList.add('hidden');
  document.getElementById('bkash-step-3')?.classList.add('hidden');
  document.getElementById('bkash-step-spinner')?.classList.add('hidden');

  if (step === 1) {
    document.getElementById('bkash-step-1')?.classList.remove('hidden');
  } else if (step === 2) {
    activeSimulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById('bkash-step-2')?.classList.remove('hidden');
    showSimulatedSmsBanner(activeSimulatedOtp, 'bKash');
  } else if (step === 3) {
    document.getElementById('bkash-step-3')?.classList.remove('hidden');
  }
}

function autoFillBkashOtp() {
  const input = document.getElementById('bkash-input-otp');
  if (input) input.value = activeSimulatedOtp;
}

// ==========================================
// NAGAD PGW SIMULATOR STEP FLOW
// ==========================================
function advanceNagadStep(step) {
  document.getElementById('nagad-step-1')?.classList.add('hidden');
  document.getElementById('nagad-step-2')?.classList.add('hidden');
  document.getElementById('nagad-step-3')?.classList.add('hidden');
  document.getElementById('nagad-step-spinner')?.classList.add('hidden');

  if (step === 1) {
    document.getElementById('nagad-step-1')?.classList.remove('hidden');
  } else if (step === 2) {
    activeSimulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById('nagad-step-2')?.classList.remove('hidden');
    showSimulatedSmsBanner(activeSimulatedOtp, 'Nagad');
  } else if (step === 3) {
    document.getElementById('nagad-step-3')?.classList.remove('hidden');
  }
}

function autoFillNagadOtp() {
  const input = document.getElementById('nagad-input-otp');
  if (input) input.value = activeSimulatedOtp;
}

// ==========================================
// SIMULATED MOBILE SMS BANNER
// ==========================================
function showSimulatedSmsBanner(code, sender = 'bKash') {
  const banner = document.getElementById('simulated-sms-banner');
  if (!banner) return;

  document.getElementById('sms-banner-sender').innerText = sender;
  document.getElementById('sms-banner-text').innerText =
    `Your ${sender} verification code is ${code}. Never share this code with anyone. (Demo Mode)`;

  banner.classList.remove('hidden');
  setTimeout(() => {
    banner.classList.add('hidden');
  }, 6000);
}

function autoFillActiveOtp() {
  autoFillBkashOtp();
  autoFillNagadOtp();
  autoFillRocketOtp();
  const input3d = document.getElementById('3d-secure-otp');
  if (input3d) input3d.value = activeSimulatedOtp;
  document.getElementById('simulated-sms-banner')?.classList.add('hidden');
}

// ==========================================
// SSLCOMMERZ 3D SECURE MODAL SIMULATOR
// ==========================================
function autoFillTestCard() {
  const input = document.getElementById('ssl-card-number');
  if (input) input.value = '4532 8901 2345 8092';
}

function trigger3DSecureSimulation() {
  activeSimulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
  const modal = document.getElementById('3d-secure-modal');
  const otpInput = document.getElementById('3d-secure-otp');
  if (otpInput) otpInput.value = activeSimulatedOtp;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  showSimulatedSmsBanner(activeSimulatedOtp, 'BRAC Bank Visa 3D Secure');
}

function close3DSecureModal() {
  const modal = document.getElementById('3d-secure-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function confirm3DSecurePayment() {
  close3DSecureModal();
  completeGatewayDemoPayment('Card-SSLCommerz');
}

// ==========================================
// COMPLETE DEMO PAYMENT
// ==========================================
async function completeGatewayDemoPayment(providerName) {
  // Show spinner briefly for realism
  if (providerName.includes('bKash')) {
    document.getElementById('bkash-step-3')?.classList.add('hidden');
    document.getElementById('bkash-step-spinner')?.classList.remove('hidden');
  } else if (providerName.includes('Nagad')) {
    document.getElementById('nagad-step-3')?.classList.add('hidden');
    document.getElementById('nagad-step-spinner')?.classList.remove('hidden');
  } else if (providerName.includes('Rocket')) {
    document.getElementById('rocket-step-3')?.classList.add('hidden');
    document.getElementById('rocket-step-spinner')?.classList.remove('hidden');
  }

  // Artificial 800ms gateway delay for realistic demonstration
  await new Promise(r => setTimeout(r, 800));

  const name = document.getElementById('pay-guest-name')?.value.trim() || 'চৌধুরী পরিবার (চট্টগ্রাম)';
  const phone = document.getElementById('pay-guest-phone')?.value.trim() || '01819-876543';
  const amount = parseFloat(document.getElementById('pay-amount-input')?.value) || 1000;
  const blessing = document.getElementById('pay-blessing')?.value.trim() || 'অরিন্দম ও অর্পিতার যুগল জীবনের জন্য অন্তরের অন্তস্থল থেকে শুভকামনা ও আশীর্বাদ!';

  const prefix = providerName.includes('bKash') ? 'BK' :
                 providerName.includes('Nagad') ? 'NG' :
                 providerName.includes('Rocket') ? 'RKT' :
                 providerName.includes('Bank') ? 'BANK' :
                 providerName.includes('Card') ? 'SSLCZ' : 'TRX';
  const generatedTrxId = `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const payload = {
    gift_id: currentPaymentGift ? currentPaymentGift.id : 'salami-fund',
    contributor_name: name,
    contributor_phone: phone,
    contributor_email: 'guest@demo.com',
    amount,
    payment_method: `${providerName} (Demo Gateway)`,
    trx_id: generatedTrxId,
    blessing_msg: blessing
  };

  if (state.apiAvailable) {
    try {
      await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  }

  closePaymentModal();
  loadData();
  triggerConfetti();
  playAuspiciousChime();

  showBlessingCardReceipt({
    id: `REC-${Date.now()}`,
    contributor_name: name,
    contributor_phone: phone,
    gift_title: currentPaymentGift ? currentPaymentGift.title : 'ডিজিটাল বর-কনে সালামি ও আশীর্বাদী',
    amount,
    payment_method: `${providerName} Verified`,
    trx_id: generatedTrxId,
    blessing_msg: blessing
  });
}

// 1-Click Instant Test Demo Payment
function quickFillAndPayDemo() {
  document.getElementById('pay-guest-name').value = 'চৌধুরী পরিবার (চট্টগ্রাম)';
  document.getElementById('pay-guest-phone').value = '01819-876543';
  document.getElementById('pay-blessing').value = 'অরিন্দম ও অর্পিতার সুন্দর ও আনন্দময় দাম্পত্য জীবনের জন্য সপরিবারে আন্তরিক শুভকামনা ও আশীর্বাদ!';
  const methodMap = {
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    bank: 'BRAC Bank Transfer',
    card: 'Card-SSLCommerz'
  };
  completeGatewayDemoPayment(methodMap[state.currentPaymentMethod] || 'bKash');
}

function generateManualQR() {
  const ev = state.event;
  if (!ev) return;
  const container = document.getElementById('qr-container-manual');
  if (!container) return;
  container.innerHTML = '';

  const amount = parseFloat(document.getElementById('pay-amount-input')?.value) || 1000;
  const qrData = `bkash://payment?number=${(ev.bkash_number || '01712890123').replace(/[^0-9]/g, '')}&amount=${amount}&ref=UTSAB`;

  if (typeof QRCode === 'function') {
    new QRCode(container, {
      text: qrData,
      width: 80,
      height: 80,
      colorDark: '#800020',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
}

function showBlessingCardReceipt(record) {
  const modal = document.getElementById('receipt-modal');
  const card = document.getElementById('printable-blessing-card');
  const ev = state.event;

  card.innerHTML = `
    <div class="salami-envelope p-7 text-white relative">
      <div class="text-center mb-5">
        <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold gold-gradient text-amber-950 uppercase mb-1">
          উপহার ও অর্ডার স্বীকৃতি (Official Escrow Receipt)
        </span>
        <h2 class="text-xl font-bold font-serif-wedding text-amber-200">${ev.title_bn || ev.title_en}</h2>
        <p class="text-[11px] text-amber-100/70">${ev.venue_name}</p>
      </div>
      <div class="bg-white/10 rounded-2xl p-5 border border-amber-300/30 text-xs space-y-3">
        <div class="flex justify-between">
          <span class="text-amber-200">উপহারদাতা:</span>
          <strong class="text-white">${record.contributor_name} (${record.contributor_phone || ''})</strong>
        </div>
        <div class="flex justify-between">
          <span class="text-amber-200">উপহার:</span>
          <strong class="text-amber-300">${record.gift_title}</strong>
        </div>
        <div class="flex justify-between border-t border-amber-300/20 pt-2">
          <span class="text-amber-200">পরিশোধ:</span>
          <span>${record.payment_method} (TrxID: ${record.trx_id})</span>
        </div>
        <div class="flex justify-between items-center border-t border-amber-300/20 pt-2">
          <span class="text-amber-200 font-bold">মোট পরিমাণ:</span>
          <span class="text-2xl font-bold text-amber-300 font-serif-wedding">${formatCurrency(record.amount)}</span>
        </div>
        <div class="text-[10px] text-emerald-300 flex items-center gap-1">
          <i class="fa-solid fa-lock"></i> তহবিল সুরক্ষিত ও এসক্রোতে সংরক্ষিত
        </div>
        ${record.blessing_msg ? `<p class="italic text-amber-100 pt-2 border-t border-amber-300/20">"${record.blessing_msg}"</p>` : ''}
      </div>
      <div class="mt-4 pt-3 border-t border-amber-300/30 text-[10px] text-amber-200/70 flex justify-between">
        <span>Receipt ID: <strong>${record.id}</strong></span>
        <span>বর-কনের পক্ষ থেকে ধন্যবাদ ❤️</span>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeReceiptModal() {
  document.getElementById('receipt-modal').classList.add('hidden');
  document.getElementById('receipt-modal').classList.remove('flex');
}

function printReceipt() {
  window.print();
}

function switchTab(tabId) {
  state.activeTab = tabId;
  const allTabs = ['gifts', 'invitation', 'rituals', 'venue', 'gallery', 'salami', 'story', 'guestbook', 'admin'];

  if (tabId === 'admin') {
    document.getElementById('sections-container')?.classList.add('hidden');
    document.getElementById('section-admin')?.classList.remove('hidden');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  } else {
    document.getElementById('sections-container')?.classList.remove('hidden');
    document.getElementById('section-admin')?.classList.add('hidden');

    const target = document.getElementById(`section-${tabId}`);
    if (target) {
      target.classList.remove('hidden');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  allTabs.forEach(s => {
    const nav = document.getElementById(`nav-${s}`);
    if (nav) {
      nav.classList.toggle('border-b-2', s === tabId);
      nav.classList.toggle('border-amber-700', s === tabId);
      nav.classList.toggle('font-bold', s === tabId);
      nav.classList.toggle('text-amber-900', s === tabId);
    }
  });
}

// ==========================================
// HINDU WEDDING AUDIO & THEME CONTROLS
// ==========================================
let hinduAudioCtx = null;
let hinduAudioPlaying = false;
let hinduAudioNodes = [];

function toggleHinduWeddingAudio() {
  const btn = document.getElementById('audio-toggle-btn');
  const txt = document.getElementById('audio-toggle-text');

  if (hinduAudioPlaying) {
    hinduAudioNodes.forEach(node => {
      try { node.stop(); node.disconnect(); } catch (e) {}
    });
    hinduAudioNodes = [];
    hinduAudioPlaying = false;
    if (btn) btn.classList.remove('audio-playing-pulse', 'border-amber-400', 'bg-amber-600/40');
    if (txt) txt.innerText = 'মঙ্গল সানাই ও শঙ্খধ্বনি';
    return;
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!hinduAudioCtx) hinduAudioCtx = new AudioContext();
    if (hinduAudioCtx.state === 'suspended') hinduAudioCtx.resume();

    const now = hinduAudioCtx.currentTime;
    const masterGain = hinduAudioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.18, now + 1.2);
    masterGain.connect(hinduAudioCtx.destination);

    // 1. Tanpura Root Drone (C#3: 138.59Hz, G#3: 207.65Hz, C#4: 277.18Hz)
    [138.59, 207.65, 277.18].forEach((freq, idx) => {
      const osc = hinduAudioCtx.createOscillator();
      const gain = hinduAudioCtx.createGain();
      osc.type = idx === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1) * 3, now);
      gain.gain.setValueAtTime(0.08 / (idx + 1), now);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      hinduAudioNodes.push(osc);
    });

    // 2. Shehnai Melodic Raga Arpeggio (Raag Bhairavi sacred wedding motif)
    const ragaNotes = [277.18, 311.13, 349.23, 415.30, 554.37, 466.16, 415.30, 349.23];
    const shehnaiOsc = hinduAudioCtx.createOscillator();
    const shehnaiGain = hinduAudioCtx.createGain();
    const shehnaiFilter = hinduAudioCtx.createBiquadFilter();

    shehnaiOsc.type = 'sawtooth';
    shehnaiFilter.type = 'lowpass';
    shehnaiFilter.frequency.setValueAtTime(1400, now);
    shehnaiFilter.Q.setValueAtTime(4, now);
    shehnaiGain.gain.setValueAtTime(0.04, now);

    let stepTime = now + 0.3;
    for (let loop = 0; loop < 15; loop++) {
      ragaNotes.forEach(noteFreq => {
        shehnaiOsc.frequency.setValueAtTime(noteFreq, stepTime);
        shehnaiOsc.frequency.exponentialRampToValueAtTime(noteFreq * 1.01, stepTime + 0.4);
        stepTime += 0.7;
      });
    }

    shehnaiOsc.connect(shehnaiFilter);
    shehnaiFilter.connect(shehnaiGain);
    shehnaiGain.connect(masterGain);
    shehnaiOsc.start(now);
    hinduAudioNodes.push(shehnaiOsc);

    // 3. Auspicious Conch (শঙ্খ) Resonant Swell
    const conchOsc = hinduAudioCtx.createOscillator();
    const conchGain = hinduAudioCtx.createGain();
    conchOsc.type = 'triangle';
    conchOsc.frequency.setValueAtTime(174.61, now);
    conchOsc.frequency.exponentialRampToValueAtTime(261.63, now + 1.8);
    conchOsc.frequency.exponentialRampToValueAtTime(220.00, now + 3.5);

    conchGain.gain.setValueAtTime(0.001, now);
    conchGain.gain.linearRampToValueAtTime(0.12, now + 1.2);
    conchGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    conchOsc.connect(conchGain);
    conchGain.connect(masterGain);
    conchOsc.start(now);
    conchOsc.stop(now + 4.2);
    hinduAudioNodes.push(conchOsc);

    hinduAudioPlaying = true;
    if (btn) btn.classList.add('audio-playing-pulse', 'border-amber-400', 'bg-amber-600/40');
    if (txt) txt.innerText = '🎶 সানাই বাজছে (থামাতে ক্লিক করুন)';
  } catch (err) {
    console.warn("Audio synthesizer notice:", err);
  }
}

function setWeddingTheme(themeName) {
  document.body.setAttribute('data-wedding-theme', themeName);
  localStorage.setItem('utsab_wedding_theme', themeName);
  const select = document.getElementById('wedding-theme-select');
  if (select) select.value = themeName;
}

function renderAdminPanel() {
  const ev = state.event;
  if (!ev) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('admin-title-en', ev.title_en);
  setVal('admin-title-bn', ev.title_bn);
  setVal('admin-event-type', ev.event_type);
  setVal('admin-groom-en', ev.groom_name);
  setVal('admin-bride-en', ev.bride_name);
  setVal('admin-groom-bn', ev.groom_bn);
  setVal('admin-bride-bn', ev.bride_bn);
  setVal('admin-date', ev.event_date);
  setVal('admin-time', ev.event_time);
  setVal('admin-venue-name', ev.venue_name);
  setVal('admin-venue-addr', ev.venue_address);
  setVal('admin-welcome-msg', ev.welcome_msg);
  setVal('admin-story', ev.story);
  setVal('admin-theme', ev.theme_color || 'crimson-gold');
  setVal('admin-font-theme', localStorage.getItem('utsab_font_theme') || 'poppins-hind');
  setVal('admin-commission-rate', ev.commission_rate || 7.5);
  setVal('admin-delivery-addr', ev.delivery_address);
  setVal('admin-delivery-phone', ev.delivery_contact_phone);

  const groomPrev = document.getElementById('admin-groom-img-preview');
  if (groomPrev && ev.groom_photo) groomPrev.src = ev.groom_photo;
  const bridePrev = document.getElementById('admin-bride-img-preview');
  if (bridePrev && ev.bride_photo) bridePrev.src = ev.bride_photo;
  const couplePrev = document.getElementById('admin-couple-img-preview');
  if (couplePrev && ev.couple_photo) couplePrev.src = ev.couple_photo;

  setVal('admin-bkash', ev.bkash_number);
  setVal('admin-nagad', ev.nagad_number);
  setVal('admin-rocket', ev.rocket_number);
}

async function saveAdminEvent(e) {
  e.preventDefault();
  const getVal = (id) => document.getElementById(id).value;

  const updated = {
    title_en: getVal('admin-title-en'),
    title_bn: getVal('admin-title-bn'),
    event_type: getVal('admin-event-type'),
    groom_name: getVal('admin-groom-en'),
    bride_name: getVal('admin-bride-en'),
    groom_bn: getVal('admin-groom-bn'),
    bride_bn: getVal('admin-bride-bn'),
    event_date: getVal('admin-date'),
    event_time: getVal('admin-time'),
    venue_name: getVal('admin-venue-name'),
    venue_address: getVal('admin-venue-addr'),
    welcome_msg: getVal('admin-welcome-msg'),
    story: getVal('admin-story'),
    theme_color: getVal('admin-theme'),
    commission_rate: parseFloat(getVal('admin-commission-rate')) || 7.5,
    delivery_address: getVal('admin-delivery-addr'),
    delivery_contact_phone: getVal('admin-delivery-phone'),
    bkash_number: getVal('admin-bkash'),
    nagad_number: getVal('admin-nagad'),
    rocket_number: getVal('admin-rocket')
  };

  if (state.apiAvailable) {
    try {
      await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {}
  }

  state.event = { ...state.event, ...updated };
  applyTheme(state.event.theme_color);
  renderAll();
  alert('সকল পরিবর্তন সংরক্ষিত হয়েছে!');
}

async function resetToHinduThemePreset() {
  if (!confirm('আপনি কি সনাতন বিবাহ থিম এবং ডেমো উপহার ক্যাটালগ রিলোড করতে চান?')) return;
  try {
    const res = await fetch('/api/theme/seed-hindu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const json = await res.json();
    if (json.success) {
      alert('সনাতন শুভ বিবাহ থিম সফলভাবে সক্রিয় করা হয়েছে!');
      window.location.reload();
    }
  } catch (e) {
    window.location.reload();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();

  document.getElementById('gift-search-input')?.addEventListener('input', onSearchChange);
  document.getElementById('salami-direct-form')?.addEventListener('submit', submitSalamiForm);
  document.getElementById('guestbook-form')?.addEventListener('submit', submitGuestbookForm);
  document.getElementById('admin-event-form')?.addEventListener('submit', saveAdminEvent);
  document.getElementById('payment-confirm-form')?.addEventListener('submit', confirmPaymentSubmit);
  document.getElementById('vendor-url-form')?.addEventListener('submit', importVendorProductFromUrl);
  document.getElementById('withdraw-form')?.addEventListener('submit', submitWithdrawalRequest);
  document.getElementById('cloud-db-form')?.addEventListener('submit', saveCloudDbConfig);
});
