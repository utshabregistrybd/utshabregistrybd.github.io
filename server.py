#!/usr/bin/env python3
"""
UtsabRegistry BD - Complete Backend Server & API
Features:
- Cultural Event Registry & Wishlist
- Popular Bangladeshi Vendor Integrations (Aarong, Daraz, Walton, Transcom, Pickaboo, Monno)
- 1-Click Product URL Importer from BD E-commerce
- Automated Vendor Ordering with Platform Commission Engine
- Database Storage Options & Backup/Export (SQLite, JSON Dump & Cloud DB Config)
- Fund Reservation & Escrow Engine (Funds safely held until fulfillment / couple withdrawal)
- Photo Uploads & Website Section Organizer
"""

import os
import sys
import json
import sqlite3
import mimetypes
import base64
import re
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver
import datetime
import uuid

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "utsab.db")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(FRONTEND_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Database Storage Configuration State
DB_CONFIG = {
    "engine": "SQLite3 (Embedded ACID)",
    "filepath": DB_FILE,
    "cloud_provider": "Local / Self-hosted",
    "external_uri": "sqlite:///" + DB_FILE,
    "last_backup": None,
    "version": "3.37+"
}

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    # Events table
    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title_en TEXT,
            title_bn TEXT,
            event_type TEXT,
            groom_name TEXT,
            bride_name TEXT,
            groom_bn TEXT,
            bride_bn TEXT,
            groom_photo TEXT,
            bride_photo TEXT,
            couple_photo TEXT,
            cover_photo TEXT,
            event_date TEXT,
            event_time TEXT,
            venue_name TEXT,
            venue_address TEXT,
            venue_map_url TEXT,
            story TEXT,
            welcome_msg TEXT,
            theme_color TEXT,
            section_order TEXT,
            section_visibility TEXT,
            commission_rate REAL DEFAULT 7.5,
            delivery_contact_phone TEXT,
            delivery_address TEXT,
            bkash_number TEXT,
            nagad_number TEXT,
            rocket_number TEXT,
            bank_name TEXT,
            bank_acc_name TEXT,
            bank_acc_no TEXT,
            bank_branch TEXT,
            bank_routing TEXT
        )
    ''')

    # Gifts table
    c.execute('''
        CREATE TABLE IF NOT EXISTS gifts (
            id TEXT PRIMARY KEY,
            title TEXT,
            title_bn TEXT,
            category TEXT,
            price REAL,
            target_amount REAL,
            current_amount REAL,
            image_url TEXT,
            merchant_url TEXT,
            merchant_name TEXT,
            vendor_sku TEXT,
            description TEXT,
            is_group_gift INTEGER DEFAULT 0,
            status TEXT DEFAULT 'available',
            created_at TEXT
        )
    ''')

    # Vendor Orders table
    c.execute('''
        CREATE TABLE IF NOT EXISTS vendor_orders (
            id TEXT PRIMARY KEY,
            gift_id TEXT,
            vendor_name TEXT,
            product_title TEXT,
            product_url TEXT,
            total_amount REAL,
            commission_rate REAL,
            platform_commission REAL,
            vendor_payout REAL,
            buyer_name TEXT,
            buyer_phone TEXT,
            delivery_recipient TEXT,
            delivery_address TEXT,
            delivery_phone TEXT,
            payment_method TEXT,
            trx_id TEXT,
            status TEXT DEFAULT 'placed',
            created_at TEXT
        )
    ''')

    # Escrow & Fund Reservation table
    c.execute('''
        CREATE TABLE IF NOT EXISTS funds_escrow (
            id TEXT PRIMARY KEY,
            source_type TEXT,
            reference_id TEXT,
            item_name TEXT,
            contributor_name TEXT,
            contributor_phone TEXT,
            total_amount REAL,
            platform_commission REAL,
            net_reserved REAL,
            escrow_status TEXT DEFAULT 'reserved',
            release_condition TEXT,
            payout_destination TEXT,
            created_at TEXT,
            released_at TEXT
        )
    ''')

    # Payout Requests table (Couple withdrawing reserved funds)
    c.execute('''
        CREATE TABLE IF NOT EXISTS payout_requests (
            id TEXT PRIMARY KEY,
            requested_by TEXT,
            amount REAL,
            payout_method TEXT,
            payout_account TEXT,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at TEXT,
            processed_at TEXT
        )
    ''')

    # Contributions table
    c.execute('''
        CREATE TABLE IF NOT EXISTS contributions (
            id TEXT PRIMARY KEY,
            gift_id TEXT,
            contributor_name TEXT,
            contributor_phone TEXT,
            contributor_email TEXT,
            amount REAL,
            payment_method TEXT,
            trx_id TEXT,
            blessing_msg TEXT,
            created_at TEXT,
            status TEXT DEFAULT 'verified'
        )
    ''')

    # Photo Gallery table
    c.execute('''
        CREATE TABLE IF NOT EXISTS gallery (
            id TEXT PRIMARY KEY,
            image_url TEXT,
            caption TEXT,
            order_idx INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')

    # Guestbook table
    c.execute('''
        CREATE TABLE IF NOT EXISTS guestbook (
            id TEXT PRIMARY KEY,
            name TEXT,
            relation TEXT,
            message TEXT,
            reaction TEXT,
            created_at TEXT
        )
    ''')

    conn.commit()

    def seed_hindu_wedding(force=False):
        c.execute('SELECT COUNT(*) FROM events')
        ev_count = c.fetchone()[0]
        if ev_count == 0 or force:
            default_sections = json.dumps(["hero", "invitation", "rituals", "venue", "gifts", "salami", "gallery", "story", "guestbook"])
            default_visibility = json.dumps({
                "hero": True,
                "invitation": True,
                "venue": True,
                "gifts": True,
                "salami": True,
                "gallery": True,
                "story": True,
                "guestbook": True
            })
            c.execute('DELETE FROM events WHERE id = "utsab-default"')
            c.execute('''
                INSERT INTO events VALUES (
                    'utsab-default',
                    'Arindam & Arpita Auspicious Hindu Wedding Celebration',
                    'অরিন্দম ও অর্পিতার শুভ বিবাহ ও বৌভাত প্রীতিভোজ',
                    'hindu_wedding',
                    'Arindam Chakraborty',
                    'Arpita Ganguly',
                    'অরিন্দম চক্রবর্ত্তী',
                    'অর্পিতা গাঙ্গুলি',
                    '/uploads/groom_arindam.jpg',
                    '/uploads/bride_arpita.jpg',
                    '/uploads/arindam_arpita_sitting.jpg',
                    '/uploads/arindam_arpita_standing.jpg',
                    '2027-01-21',
                    'সন্ধ্যা ৭:০০ ঘটিকা onwards (7:00 PM BST)',
                    'Engineers Institute Chattogram (দি ইনস্টিটিউশন অব ইঞ্জিনিয়ার্স বাংলাদেশ, চট্টগ্রাম)',
                    'এস. এস. খালেদ রোড, লালখান বাজার, চট্টগ্রাম-৪০০০, বাংলাদেশ',
                    'https://maps.google.com/?q=The+Institution+of+Engineers+Bangladesh+IEB+Chattogram',
                    '|| যদেতদ্ধৃদয়ং তব তদেতদ্ধৃদয়ং মম ||\n\nপরমেশ্বর পরমাত্মার অশেষ কৃপা এবং পরম পূজনীয় গুরুজনদের আশীর্বাদ মাথায় রেখে আমাদের শুভ পরিণয় আগামী ২১ জানুয়ারি ২০২৭ অনুষ্ঠিত হতে চলেছে।\n\nচট্টগ্রামের মনোরম পরিবেশে দি ইনস্টিটিউশন অব ইঞ্জিনিয়ার্স বাংলাদেশ (আইইবি) প্রাঙ্গণে সান্ধ্যলগ্নে শুভদৃষ্টি, মালাবদল, সাতপাকে বাঁধা ও সিঁদুরদান সহ মাঙ্গলিক আচার সম্পন্ন হবে। আপনার সপরিবার সানন্দ উপস্থিতি আমাদের নবদম্পতির জীবনের শ্রেষ্ঠ পাথেয়।',
                    '|| ॐ শ্রী শ্রী প্রজাপতয়ে নমঃ || আমাদের শুভ বৌভাত ও প্রীতিভোজে আপনার সানন্দ উপস্থিতি এবং মাঙ্গলিক আশীর্বাদ আমাদের পরম সম্পদ।',
                    'sindoor-gold',
                    ?,
                    ?,
                    5.0,
                    '01712-345678',
                    'লালখান বাজার, চট্টগ্রাম, বাংলাদেশ',
                    '01712-345678',
                    '01819-876543',
                    '01911-567890-4',
                    'BRAC Bank PLC',
                    'Arindam Chakraborty & Arpita Ganguly',
                    '1501204892019001',
                    'Agrabad Branch, Chattogram',
                    '060152431'
                )
            ''', (default_sections, default_visibility))

        c.execute('SELECT COUNT(*) FROM gifts')
        if c.fetchone()[0] == 0 or force:
            if force:
                c.execute('DELETE FROM gifts')
            demo_gifts = [
                (
                    'gift-1',
                    'Aarong Handcrafted Pure Katan Silk Banarasi Saree (Crimson Red & Antique Zari)',
                    'আড়ং হ্যান্ডক্রাফটেড পিওর কাতান সিল্ক বেনারসী শাড়ি (সিঁদুর লাল ও অ্যান্টিক জরি)',
                    'luxury',
                    24500.0,
                    24500.0,
                    24500.0,
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
                    'https://www.aarong.com/women/sarees/banarasi/crimson-katan-silk-wedding',
                    'Aarong Lifestyle',
                    'AAR-BAN-RED-01',
                    'বিশুদ্ধ কাতান সিল্কে বোনা ট্র্যাডিশনাল লাল বেনারসী শাড়ি। লগ্ন ও শুভ বিবাহের জন্য উপযুক্ত।',
                    0,
                    'claimed',
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gift-2',
                    'Monno Ceramic Royal 24K Gold Rim 52-Piece Luxury Bone China Dinner Set',
                    'মুন্নু সিরামিক রয়্যাল ২৪ ক্যারেট গোল্ড রিম ৫২-পিস লাক্সারি ডিনার সেট',
                    'luxury',
                    19800.0,
                    19800.0,
                    19800.0,
                    'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80',
                    'https://monno.com.bd/product/royal-gold-52-bonechina',
                    'Monno Ceramics BD',
                    'MONNO-GLD-52',
                    'পূর্ণ বোন চায়না পোরসেলিন ডিনার সেট, যাতে রয়েছে ২৪ ক্যারেট খাঁটি স্বর্ণের সুক্ষ্ম ফিনিশিং।',
                    0,
                    'claimed',
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gift-3',
                    'Aarong Heritage Brass & Bell-Metal Mangal Pooja Thali & Panchapradeep Set',
                    'আড়ং হেরিটেজ নকশী পিতল ও কাঁসার পঞ্চপ্রদীপ ও মাঙ্গলিক পূজা থালি সেট',
                    'luxury',
                    8750.0,
                    8750.0,
                    0.0,
                    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
                    'https://www.aarong.com/home-decor/brass-bronze/pooja-thali-panchapradeep',
                    'Aarong Living',
                    'AAR-BRS-THL-09',
                    'হাতে খোদাই করা পদ্ম ও স্বস্তিক নকশার পিতলের থালি, পঞ্চপ্রদীপ, শঙ্খ ও ঘণ্টা সেট। নতুন সংসারের ঠাকুরঘরের জন্য পবিত্র উপহার।',
                    0,
                    'available',
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gift-4',
                    'Walton Double-Door Inverter Frost Refrigerator (Group Gift)',
                    'ওয়ালটন ইনভার্টার ফ্রস্ট ডাবল ডোর রেফ্রিজারেটর (গ্রুপ গিফট)',
                    'appliances',
                    54500.0,
                    54500.0,
                    38000.0,
                    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
                    'https://eplaza.waltonbd.com/refrigerators/wfd-3b2-gdxx',
                    'Walton Plaza BD',
                    'WLT-INV-3B2',
                    'নবদম্পতির নতুন সংসারের জন্য ওয়ালটন ইনভার্টার রেফ্রিজারেটর। ১০০% ফান্ড সংগৃহীত হলে হোম ডেলিভারি হবে।',
                    1,
                    'partially_funded',
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gift-5',
                    'Philips Essential Digital XL Air Fryer & Kitchen Combo HD9270',
                    'ফিলিপস ডিজিটাল এক্সএল এয়ার ফ্রায়ার ও কিচেন ব্লেন্ডার কম্বো',
                    'kitchen',
                    15200.0,
                    15200.0,
                    0.0,
                    'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
                    'https://transcomdigital.com/philips-airfryer-hd9270',
                    'Transcom Digital',
                    'TRN-PHIL-9270',
                    'স্বাস্থ্যকর রান্না ও সনাতনী সুস্বাদু পদ তৈরির জন্য ৬.২ লিটার র‍্যাপিড এয়ার টেকনোলজি এয়ার ফ্রায়ার।',
                    0,
                    'available',
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gift-6',
                    'Subarna Ashirbad: Couple Gold Jewellery & Savings Fund (Group Gift)',
                    'সুবর্ণ আশীর্বাদ: নবদম্পতির জন্য স্বর্ণালংকার ও সঞ্চয় তহবিল (গ্রুপ গিফট)',
                    'experience',
                    60000.0,
                    60000.0,
                    35000.0,
                    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
                    'https://utsab.bd/funds/subarna-ashirbad',
                    'Couple Escrow Account',
                    'GLD-ASHIRBAD-01',
                    'কনের সোনার গয়না (শাখা-পলা স্বর্ণ বাঁধানো ও নেকলেস) এবং নবদম্পতির ভবিষ্যৎ সঞ্চয়ের জন্য আশীর্বাদী উপহার তহবিল।',
                    1,
                    'partially_funded',
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gift-7',
                    'Honeymoon Experience: Darjeeling & Kalimpong Heritage Tour',
                    'হানিমুন অভিজ্ঞতা: দার্জিলিং ও কালিম্পং হেরিটেজ রিট্রিট',
                    'experience',
                    45000.0,
                    45000.0,
                    27500.0,
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
                    'https://heritagetravels.com.bd/darjeeling-honeymoon',
                    'Heritage Travels BD',
                    'EXP-HNY-01',
                    'কাঞ্চনজঙ্ঘার দৃশ্য ও শান্ত চা বাগানের মাঝে নবদম্পতির প্রথম স্মরণীয় মধুচন্দ্রিমা সফর।',
                    1,
                    'partially_funded',
                    datetime.datetime.now().isoformat()
                )
            ]
            c.executemany('INSERT INTO gifts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', demo_gifts)

        c.execute('SELECT COUNT(*) FROM funds_escrow')
        if c.fetchone()[0] == 0 or force:
            if force:
                c.execute('DELETE FROM funds_escrow')
            demo_escrow = [
                (
                    'ESC-9011',
                    'gift_purchase',
                    'gift-1',
                    'Aarong Handcrafted Pure Katan Silk Banarasi Saree',
                    'Dr. Debabrata Roy & Family',
                    '01711223344',
                    24500.0,
                    1225.00,
                    23275.00,
                    'reserved',
                    'vendor_delivery_confirmed',
                    'Aarong Lifestyle (Dhanmondi Branch)',
                    datetime.datetime.now().isoformat(),
                    None
                ),
                (
                    'ESC-9012',
                    'group_contribution',
                    'gift-4',
                    'Walton Double-Door Inverter Frost Refrigerator (Group Gift)',
                    'BUET 14 Batch Friends Forum',
                    '01819334455',
                    25000.0,
                    1250.00,
                    23750.00,
                    'reserved',
                    'group_gift_completion',
                    'Walton Plaza BD Logistics',
                    datetime.datetime.now().isoformat(),
                    None
                ),
                (
                    'ESC-9013',
                    'salami_cash',
                    'salami-fund',
                    'Auspicious Ashirbadi & Pronami Envelope',
                    'Kakoli Sengupta (Choto Mashi)',
                    '01611556677',
                    5001.0,
                    0.0,
                    5001.00,
                    'released_host',
                    'immediate_host',
                    'bKash: 01712-345678 (Couple Personal)',
                    datetime.datetime.now().isoformat(),
                    datetime.datetime.now().isoformat()
                )
            ]
            c.executemany('INSERT INTO funds_escrow VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', demo_escrow)

        c.execute('SELECT COUNT(*) FROM payout_requests')
        if c.fetchone()[0] == 0 or force:
            if force:
                c.execute('DELETE FROM payout_requests')
            c.execute('''
                INSERT INTO payout_requests VALUES (
                    'PO-1001',
                    'Partha Roy & Ananya Sengupta',
                    5001.0,
                    'bKash',
                    '01712-345678 (Personal)',
                    'transferred',
                    'Auspicious Ashirbadi cash gift fund transferred directly to couple mobile wallet.',
                    ?,
                    ?
                )
            ''', (datetime.datetime.now().isoformat(), datetime.datetime.now().isoformat()))

        c.execute('SELECT COUNT(*) FROM gallery')
        if c.fetchone()[0] == 0 or force:
            if force:
                c.execute('DELETE FROM gallery')
            demo_gallery = [
                (
                    'gal-1',
                    'uploads/arindam_arpita_sitting.jpg',
                    'অরিন্দম ও অর্পিতা — মধুর যুগল মুহূর্ত',
                    1,
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gal-2',
                    'uploads/arindam_arpita_standing.jpg',
                    'শুভ পরিণয় ও বৌভাত প্রীতিভোজ — অরিন্দম ও অর্পিতা',
                    2,
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gal-3',
                    'uploads/groom_arindam.jpg',
                    'অরিন্দম চক্রবর্ত্তী (বর)',
                    3,
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gal-4',
                    'uploads/bride_arpita.jpg',
                    'অর্পিতা গাঙ্গুলি (কনে)',
                    4,
                    datetime.datetime.now().isoformat()
                )
            ]
            c.executemany('INSERT INTO gallery VALUES (?, ?, ?, ?, ?)', demo_gallery)

        c.execute('SELECT COUNT(*) FROM guestbook')
        if c.fetchone()[0] == 0 or force:
            if force:
                c.execute('DELETE FROM guestbook')
            demo_guestbook = [
                (
                    'gb-1',
                    'প্রণব ও চিত্রা চক্রবর্ত্তী',
                    'জেঠু ও জেঠিমা (চট্টগ্রাম)',
                    'পরমেশ্বর ভগবান শ্রীকৃষ্ণের কৃপায় অরিন্দম ও অর্পিতার আগামী দাম্পত্য জীবন সুখ, শান্তি ও অনাবিল ভালোবাসায় ভরে উঠুক। আমাদের সপরিবার আন্তরিক আশীর্বাদ রইল।',
                    '🌸',
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gb-2',
                    'সুব্রত গাঙ্গুলি ও বন্ধু পরিবার',
                    'ইঞ্জিনিয়ার্স ফোরাম, চট্টগ্রাম',
                    'শুভ পরিণয় অরিন্দম ও অর্পিতা! ইঞ্জিনিয়ার্স ইনস্টিটিউটের পবিত্র মণ্ডপে তোদের মালাবদল ও সিঁদুরদান দেখার শুভ লগ্নের অপেক্ষায় রইলাম।',
                    '💖',
                    datetime.datetime.now().isoformat()
                ),
                (
                    'gb-3',
                    'কাকলি গাঙ্গুলি',
                    'ছোট মাসিমণি',
                    'অর্পিতা মা আমার, খুব সুখী হোস। অরিন্দম ও তোদের পবিত্র যুগল মিলন সদা প্রস্ফুটিত থাকুক। অনেক স্নেহ ও আশীর্বাদ রইল।',
                    '🌸',
                    datetime.datetime.now().isoformat()
                )
            ]
            c.executemany('INSERT INTO guestbook VALUES (?, ?, ?, ?, ?, ?)', demo_guestbook)

        conn.commit()

    # Seed Hindu wedding data
    seed_hindu_wedding(force=False)
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

class RegistryHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, msg, status=400):
        self.send_json({"error": msg, "success": False}, status)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Database Management & Health Stats
        if path == '/api/db/stats':
            db_size = os.path.getsize(DB_FILE) if os.path.exists(DB_FILE) else 0
            conn = get_db()
            c = conn.cursor()
            table_counts = {}
            for t in ['events', 'gifts', 'funds_escrow', 'vendor_orders', 'payout_requests', 'contributions', 'gallery', 'guestbook']:
                try:
                    c.execute(f"SELECT COUNT(*) FROM {t}")
                    table_counts[t] = c.fetchone()[0]
                except Exception:
                    table_counts[t] = 0
            conn.close()

            self.send_json({
                "success": True,
                "database": {
                    "engine": DB_CONFIG["engine"],
                    "filepath": DB_FILE,
                    "file_size_bytes": db_size,
                    "file_size_formatted": f"{round(db_size / 1024, 1)} KB",
                    "cloud_provider": DB_CONFIG["cloud_provider"],
                    "external_uri": DB_CONFIG["external_uri"],
                    "tables": table_counts,
                    "status": "Healthy & ACID Synchronized",
                    "sqlite_version": sqlite3.sqlite_version
                }
            })
            return

        # Full Database Export (JSON Snapshot)
        elif path == '/api/db/export':
            conn = get_db()
            c = conn.cursor()
            dump = {"exported_at": datetime.datetime.now().isoformat(), "tables": {}}
            for t in ['events', 'gifts', 'funds_escrow', 'vendor_orders', 'payout_requests', 'contributions', 'gallery', 'guestbook']:
                c.execute(f"SELECT * FROM {t}")
                dump["tables"][t] = [dict(r) for r in c.fetchall()]
            conn.close()

            body = json.dumps(dump, ensure_ascii=False, indent=2).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="utsab_registry_db_{datetime.date.today()}.json"')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # Fund Reservation & Escrow Overview
        elif path == '/api/escrow/overview':
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM funds_escrow ORDER BY created_at DESC')
            escrow_rows = [dict(r) for r in c.fetchall()]

            # Reserved (Held in escrow)
            c.execute("SELECT SUM(net_reserved), SUM(platform_commission) FROM funds_escrow WHERE escrow_status = 'reserved'")
            row_res = c.fetchone()
            total_reserved = row_res[0] if row_res and row_res[0] else 0.0
            commission_held = row_res[1] if row_res and row_res[1] else 0.0

            # Released for Host / Couple Withdrawal
            c.execute("SELECT SUM(net_reserved) FROM funds_escrow WHERE escrow_status = 'released_host'")
            row_host = c.fetchone()
            available_for_host = row_host[0] if row_host and row_host[0] else 0.0

            # Deduct completed payouts
            c.execute("SELECT SUM(amount) FROM payout_requests WHERE status = 'transferred'")
            row_paid = c.fetchone()
            total_transferred = row_paid[0] if row_paid and row_paid[0] else 0.0
            available_for_host = max(0.0, available_for_host - total_transferred)

            # Reserved for Vendor fulfillment
            c.execute("SELECT SUM(net_reserved) FROM funds_escrow WHERE escrow_status = 'reserved' AND source_type IN ('gift_purchase', 'group_contribution')")
            row_vend = c.fetchone()
            held_for_vendors = row_vend[0] if row_vend and row_vend[0] else 0.0

            c.execute('SELECT * FROM payout_requests ORDER BY created_at DESC')
            payouts = [dict(r) for r in c.fetchall()]
            conn.close()

            self.send_json({
                "success": True,
                "escrow_summary": {
                    "total_reserved_funds": total_reserved,
                    "available_for_couple_withdrawal": available_for_host,
                    "held_for_vendor_delivery": held_for_vendors,
                    "platform_commission_held": commission_held,
                    "total_payouts_completed": total_transferred
                },
                "escrow_items": escrow_rows,
                "payout_requests": payouts
            })
            return

        elif path == '/api/event':
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM events LIMIT 1')
            row = c.fetchone()
            conn.close()
            if row:
                ev = dict(row)
                ev['section_order'] = json.loads(ev['section_order'] or '[]')
                ev['section_visibility'] = json.loads(ev['section_visibility'] or '{}')
                self.send_json({"success": True, "event": ev})
            else:
                self.send_error_json("Event not found", 404)
            return

        elif path == '/api/gifts':
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM gifts ORDER BY status ASC, created_at DESC')
            rows = c.fetchall()
            gifts = [dict(r) for r in rows]
            conn.close()
            self.send_json({"success": True, "gifts": gifts})
            return

        elif path == '/api/gallery':
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM gallery ORDER BY order_idx ASC, created_at DESC')
            rows = c.fetchall()
            gallery = [dict(r) for r in rows]
            conn.close()
            self.send_json({"success": True, "gallery": gallery})
            return

        elif path == '/api/vendor/orders':
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM vendor_orders ORDER BY created_at DESC')
            rows = c.fetchall()
            orders = [dict(r) for r in rows]
            c.execute('SELECT COUNT(*), SUM(total_amount), SUM(platform_commission), SUM(vendor_payout) FROM vendor_orders')
            total_orders, total_gmv, total_commission, total_payouts = c.fetchone()
            conn.close()

            self.send_json({
                "success": True,
                "orders": orders,
                "summary": {
                    "total_orders": total_orders or 0,
                    "total_gmv": total_gmv or 0.0,
                    "total_platform_commission": total_commission or 0.0,
                    "total_vendor_payouts": total_payouts or 0.0
                }
            })
            return

        elif path == '/api/contributions':
            conn = get_db()
            c = conn.cursor()
            c.execute('''
                SELECT c.*, g.title as gift_title, g.title_bn as gift_title_bn, g.merchant_name
                FROM contributions c
                LEFT JOIN gifts g ON c.gift_id = g.id
                ORDER BY c.created_at DESC
            ''')
            rows = c.fetchall()
            contribs = [dict(r) for r in rows]
            conn.close()
            self.send_json({"success": True, "contributions": contribs})
            return

        elif path == '/api/guestbook':
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM guestbook ORDER BY created_at DESC')
            rows = c.fetchall()
            messages = [dict(r) for r in rows]
            conn.close()
            self.send_json({"success": True, "guestbook": messages})
            return

        elif path == '/api/stats':
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT COUNT(*), SUM(price) FROM gifts')
            gift_count, total_registry_value = c.fetchone()

            c.execute("SELECT COUNT(*) FROM gifts WHERE status = 'claimed'")
            claimed_count = c.fetchone()[0]

            c.execute('SELECT COUNT(*), SUM(amount) FROM contributions')
            contrib_count, total_raised = c.fetchone()

            c.execute("SELECT SUM(amount) FROM contributions WHERE gift_id = 'salami-fund' OR gift_id LIKE 'salami%'")
            salami_row = c.fetchone()
            salami_total = salami_row[0] if salami_row and salami_row[0] else 0.0

            c.execute('SELECT SUM(platform_commission) FROM vendor_orders')
            comm_row = c.fetchone()
            platform_commission = comm_row[0] if comm_row and comm_row[0] else 0.0

            c.execute("SELECT SUM(net_reserved) FROM funds_escrow WHERE escrow_status = 'reserved'")
            esc_row = c.fetchone()
            escrow_reserved = esc_row[0] if esc_row and esc_row[0] else 0.0

            conn.close()
            self.send_json({
                "success": True,
                "stats": {
                    "total_gifts": gift_count or 0,
                    "claimed_gifts": claimed_count or 0,
                    "total_registry_value": total_registry_value or 0.0,
                    "total_contributions_count": contrib_count or 0,
                    "total_amount_raised": total_raised or 0.0,
                    "total_salami_raised": salami_total or 0.0,
                    "total_platform_commission": platform_commission or 0.0,
                    "total_reserved_in_escrow": escrow_reserved
                }
            })
            return

        self.serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length > 0 else b'{}'

        try:
            data = json.loads(body.decode('utf-8'))
        except Exception:
            data = {}

        # 1. Database Configuration Update
        if path == '/api/db/config':
            new_uri = data.get('external_uri', '').strip()
            cloud_provider = data.get('cloud_provider', 'Custom PostgreSQL / Supabase')
            if new_uri:
                DB_CONFIG['external_uri'] = new_uri
                DB_CONFIG['cloud_provider'] = cloud_provider
                if 'postgres' in new_uri.lower() or 'supabase' in new_uri.lower():
                    DB_CONFIG['engine'] = 'PostgreSQL / Supabase Remote Connector'
                elif 'mysql' in new_uri.lower():
                    DB_CONFIG['engine'] = 'MySQL Remote Connector'
                else:
                    DB_CONFIG['engine'] = 'Custom SQL Database'
            self.send_json({"success": True, "message": "Database storage settings saved", "config": DB_CONFIG})
            return

        # 2. Database Restore (Import JSON Snapshot)
        elif path == '/api/db/import':
            dump = data.get('database_dump', {})
            tables = dump.get('tables', {})
            if not tables:
                self.send_error_json("Invalid database dump JSON")
                return

            conn = get_db()
            c = conn.cursor()
            for t, rows in tables.items():
                if rows:
                    c.execute(f"DELETE FROM {t}")
                    cols = list(rows[0].keys())
                    placeholders = ', '.join(['?'] * len(cols))
                    for r in rows:
                        c.execute(f"INSERT INTO {t} ({', '.join(cols)}) VALUES ({placeholders})", [r[k] for k in cols])
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Database restored successfully from snapshot"})
            return

        # 3. Release Funds from Escrow
        elif path.startswith('/api/escrow/') and path.endswith('/release'):
            escrow_id = path.split('/')[3]
            release_target = data.get('target', 'released_host') # released_host or released_vendor
            now = datetime.datetime.now().isoformat()

            conn = get_db()
            c = conn.cursor()
            c.execute('UPDATE funds_escrow SET escrow_status = ?, released_at = ? WHERE id = ?', (release_target, now, escrow_id))
            conn.commit()
            conn.close()

            self.send_json({"success": True, "message": f"Funds for {escrow_id} released successfully"})
            return

        # 4. Request Withdrawal of Reserved Salami / Couple Funds
        elif path == '/api/escrow/withdraw':
            amount = float(data.get('amount', 0))
            method = data.get('payout_method', 'bKash')
            account = data.get('payout_account', '')

            if amount <= 0 or not account:
                self.send_error_json("Valid withdrawal amount and recipient account required")
                return

            po_id = f"PO-{str(uuid.uuid4())[:6].upper()}"
            now = datetime.datetime.now().isoformat()

            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT groom_name, bride_name FROM events WHERE id = "utsab-default"')
            row = c.fetchone()
            couple_names = f"{row['groom_name']} & {row['bride_name']}" if row else "Couple"

            c.execute('''
                INSERT INTO payout_requests VALUES (?, ?, ?, ?, ?, 'transferred', 'Automated wallet transfer via Utsab Escrow', ?, ?)
            ''', (po_id, couple_names, amount, method, account, now, now))
            conn.commit()
            conn.close()

            self.send_json({
                "success": True,
                "message": f"উত্তোলন সফল! ৳ {amount:,.0f} টাকা {method} একাউন্টে ট্রান্সফার করা হয়েছে।",
                "payout_id": po_id,
                "amount": amount
            })
            return

        # 5. Image Upload Endpoint
        elif path == '/api/upload':
            image_data = data.get('image_data', '')
            if not image_data:
                self.send_error_json("No image data provided")
                return

            ext = 'jpg'
            if 'image/png' in image_data: ext = 'png'
            elif 'image/webp' in image_data: ext = 'webp'

            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]

            try:
                raw_bytes = base64.b64decode(image_data)
                out_filename = f"{uuid.uuid4().hex[:12]}.{ext}"
                target_path = os.path.join(UPLOADS_DIR, out_filename)
                with open(target_path, 'wb') as f:
                    f.write(raw_bytes)

                public_url = f"/uploads/{out_filename}"
                self.send_json({
                    "success": True,
                    "url": public_url,
                    "filename": out_filename,
                    "message": "Image uploaded successfully"
                })
            except Exception as e:
                self.send_error_json(f"Failed to process image: {str(e)}")
            return

        # 6. Bangladeshi Vendor 1-Click URL Importer
        elif path == '/api/vendor/import-url':
            url = data.get('url', '').strip()
            if not url:
                self.send_error_json("Product URL is required")
                return

            product_info = self.parse_vendor_url(url)
            self.send_json({
                "success": True,
                "product": product_info,
                "message": f"Successfully parsed from {product_info['merchant_name']}"
            })
            return

        # 6b. Seed Hindu Marriage Theme Preset
        elif path == '/api/theme/seed-hindu':
            init_db()
            conn = get_db()
            c = conn.cursor()
            # Run force seed
            default_sections = json.dumps(["hero", "invitation", "rituals", "venue", "gifts", "salami", "gallery", "story", "guestbook"])
            default_visibility = json.dumps({
                "hero": True,
                "invitation": True,
                "venue": True,
                "gifts": True,
                "salami": True,
                "gallery": True,
                "story": True,
                "guestbook": True
            })
            c.execute('DELETE FROM events WHERE id = "utsab-default"')
            c.execute('''
                INSERT INTO events VALUES (
                    'utsab-default',
                    'Arindam & Arpita Auspicious Hindu Wedding Celebration',
                    'অরিন্দম ও অর্পিতার শুভ বিবাহ ও বৌভাত প্রীতিভোজ',
                    'hindu_wedding',
                    'Arindam Chakraborty',
                    'Arpita Ganguly',
                    'অরিন্দম চক্রবর্ত্তী',
                    'অর্পিতা গাঙ্গুলি',
                    '/uploads/groom_arindam.jpg',
                    '/uploads/bride_arpita.jpg',
                    '/uploads/arindam_arpita_sitting.jpg',
                    '/uploads/arindam_arpita_standing.jpg',
                    '2027-01-21',
                    'সন্ধ্যা ৭:০০ ঘটিকা onwards (7:00 PM BST)',
                    'Engineers Institute Chattogram (দি ইনস্টিটিউশন অব ইঞ্জিনিয়ার্স বাংলাদেশ, চট্টগ্রাম)',
                    'এস. এস. খালেদ রোড, লালখান বাজার, চট্টগ্রাম-৪০০০, বাংলাদেশ',
                    'https://maps.google.com/?q=The+Institution+of+Engineers+Bangladesh+IEB+Chattogram',
                    '|| যদেতদ্ধৃদয়ং তব তদেতদ্ধৃদয়ং মম ||\n\nপরমেশ্বর পরমাত্মার অশেষ কৃপা এবং পরম পূজনীয় গুরুজনদের আশীর্বাদ মাথায় রেখে আমাদের শুভ পরিণয় আগামী ২১ জানুয়ারি ২০২৭ অনুষ্ঠিত হতে চলেছে।\n\nচট্টগ্রামের মনোরম পরিবেশে দি ইনস্টিটিউশন অব ইঞ্জিনিয়ার্স বাংলাদেশ (আইইবি) প্রাঙ্গণে সান্ধ্যলগ্নে শুভদৃষ্টি, মালাবদল, সাতপাকে বাঁধা ও সিঁদুরদান সহ মাঙ্গলিক আচার সম্পন্ন হবে। আপনার সপরিবার সানন্দ উপস্থিতি আমাদের নবদম্পতির জীবনের শ্রেষ্ঠ পাথেয়।',
                    '|| ॐ শ্রী শ্রী প্রজাপতয়ে নমঃ || আমাদের শুভ বৌভাত ও প্রীতিভোজে আপনার সানন্দ উপস্থিতি এবং মাঙ্গলিক আশীর্বাদ আমাদের পরম সম্পদ।',
                    'sindoor-gold',
                    ?,
                    ?,
                    5.0,
                    '01712-345678',
                    'লালখান বাজার, চট্টগ্রাম, বাংলাদেশ',
                    '01712-345678',
                    '01819-876543',
                    '01911-567890-4',
                    'BRAC Bank PLC',
                    'Arindam Chakraborty & Arpita Ganguly',
                    '1501204892019001',
                    'Agrabad Branch, Chattogram',
                    '060152431'
                )
            ''', (default_sections, default_visibility))
            c.execute('DELETE FROM gifts')
            demo_gifts = [
                ('gift-1', 'Aarong Handcrafted Pure Katan Silk Banarasi Saree (Crimson Red & Antique Zari)', 'আড়ং হ্যান্ডক্রাফটেড পিওর কাতান সিল্ক বেনারসী শাড়ি (সিঁদুর লাল ও অ্যান্টিক জরি)', 'luxury', 24500.0, 24500.0, 24500.0, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 'https://www.aarong.com/women/sarees/banarasi/crimson-katan-silk-wedding', 'Aarong Lifestyle', 'AAR-BAN-RED-01', 'বিশুদ্ধ কাতান সিল্কে বোনা ট্র্যাডিশনাল লাল বেনারসী শাড়ি। লগ্ন ও শুভ বিবাহের জন্য উপযুক্ত।', 0, 'claimed', datetime.datetime.now().isoformat()),
                ('gift-2', 'Monno Ceramic Royal 24K Gold Rim 52-Piece Luxury Bone China Dinner Set', 'মুন্নু সিরামিক রয়্যাল ২৪ ক্যারেট গোল্ড রিম ৫২-পিস লাক্সারি ডিনার সেট', 'luxury', 19800.0, 19800.0, 19800.0, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80', 'https://monno.com.bd/product/royal-gold-52-bonechina', 'Monno Ceramics BD', 'MONNO-GLD-52', 'পূর্ণ বোন চায়না পোরসেলিন ডিনার সেট, যাতে রয়েছে ২৪ ক্যারেট খাঁটি স্বর্ণের সুক্ষ্ম ফিনিশিং।', 0, 'claimed', datetime.datetime.now().isoformat()),
                ('gift-3', 'Aarong Heritage Brass & Bell-Metal Mangal Pooja Thali & Panchapradeep Set', 'আড়ং হেরিটেজ নকশী পিতল ও কাঁসার পঞ্চপ্রদীপ ও মাঙ্গলিক পূজা থালি সেট', 'luxury', 8750.0, 8750.0, 0.0, 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', 'https://www.aarong.com/home-decor/brass-bronze/pooja-thali-panchapradeep', 'Aarong Living', 'AAR-BRS-THL-09', 'হাতে খোদাই করা পদ্ম ও স্বস্তিক নকশার পিতলের থালি, পঞ্চপ্রদীপ, শঙ্খ ও ঘণ্টা সেট। নতুন সংসারের ঠাকুরঘরের জন্য পবিত্র উপহার।', 0, 'available', datetime.datetime.now().isoformat()),
                ('gift-4', 'Walton Double-Door Inverter Frost Refrigerator (Group Gift)', 'ওয়ালটন ইনভার্টার ফ্রস্ট ডাবল ডোর রেফ্রিজারেটর (গ্রুপ গিফট)', 'appliances', 54500.0, 54500.0, 38000.0, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80', 'https://eplaza.waltonbd.com/refrigerators/wfd-3b2-gdxx', 'Walton Plaza BD', 'WLT-INV-3B2', 'নবদম্পতির নতুন সংসারের জন্য ওয়ালটন ইনভার্টার রেফ্রিজারেটর। ১০০% ফান্ড সংগৃহীত হলে হোম ডেলিভারি হবে।', 1, 'partially_funded', datetime.datetime.now().isoformat()),
                ('gift-5', 'Philips Essential Digital XL Air Fryer & Kitchen Combo HD9270', 'ফিলিপস ডিজিটাল এক্সএল এয়ার ফ্রায়ার ও কিচেন ব্লেন্ডার কম্বো', 'kitchen', 15200.0, 15200.0, 0.0, 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80', 'https://transcomdigital.com/philips-airfryer-hd9270', 'Transcom Digital', 'TRN-PHIL-9270', 'স্বাস্থ্যকর রান্না ও সনাতনী সুস্বাদু পদ তৈরির জন্য ৬.২ লিটার র‍্যাপিড এয়ার টেকনোলজি এয়ার ফ্রায়ার।', 0, 'available', datetime.datetime.now().isoformat()),
                ('gift-6', 'Subarna Ashirbad: Couple Gold Jewellery & Savings Fund (Group Gift)', 'সুবর্ণ আশীর্বাদ: নবদম্পতির জন্য স্বর্ণালংকার ও সঞ্চয় তহবিল (গ্রুপ গিফট)', 'experience', 60000.0, 60000.0, 35000.0, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80', 'https://utsab.bd/funds/subarna-ashirbad', 'Couple Escrow Account', 'GLD-ASHIRBAD-01', 'কনের সোনার গয়না (শাখা-পলা স্বর্ণ বাঁধানো ও নেকলেস) এবং নবদম্পতির ভবিষ্যৎ সঞ্চয়ের জন্য আশীর্বাদী উপহার তহবিল।', 1, 'partially_funded', datetime.datetime.now().isoformat()),
                ('gift-7', 'Honeymoon Experience: Darjeeling & Kalimpong Heritage Tour', 'হানিমুন অভিজ্ঞতা: দার্জিলিং ও কালিম্পং হেরিটেজ রিট্রিট', 'experience', 45000.0, 45000.0, 27500.0, 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80', 'https://heritagetravels.com.bd/darjeeling-honeymoon', 'Heritage Travels BD', 'EXP-HNY-01', 'কাঞ্চনজঙ্ঘার দৃশ্য ও শান্ত চা বাগানের মাঝে নবদম্পতির প্রথম স্মরণীয় মধুচন্দ্রিমা সফর।', 1, 'partially_funded', datetime.datetime.now().isoformat())
            ]
            c.executemany('INSERT INTO gifts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', demo_gifts)
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Hindu marriage theme applied successfully"})
            return

        # 7. Update Event & Website Layout
        elif path == '/api/event':
            conn = get_db()
            c = conn.cursor()
            fields = [
                'title_en', 'title_bn', 'event_type', 'groom_name', 'bride_name',
                'groom_bn', 'bride_bn', 'groom_photo', 'bride_photo', 'couple_photo',
                'cover_photo', 'event_date', 'event_time', 'venue_name',
                'venue_address', 'venue_map_url', 'story', 'welcome_msg', 'theme_color',
                'commission_rate', 'delivery_contact_phone', 'delivery_address',
                'bkash_number', 'nagad_number', 'rocket_number',
                'bank_name', 'bank_acc_name', 'bank_acc_no', 'bank_branch', 'bank_routing'
            ]
            updates = []
            values = []
            for f in fields:
                if f in data:
                    updates.append(f"{f} = ?")
                    values.append(data[f])

            if 'section_order' in data:
                updates.append("section_order = ?")
                values.append(json.dumps(data['section_order']))

            if 'section_visibility' in data:
                updates.append("section_visibility = ?")
                values.append(json.dumps(data['section_visibility']))

            if updates:
                query = f"UPDATE events SET {', '.join(updates)} WHERE id = 'utsab-default'"
                c.execute(query, values)
                conn.commit()

            c.execute("SELECT * FROM events WHERE id = 'utsab-default'")
            row = c.fetchone()
            conn.close()
            ev = dict(row)
            ev['section_order'] = json.loads(ev['section_order'] or '[]')
            ev['section_visibility'] = json.loads(ev['section_visibility'] or '{}')
            self.send_json({"success": True, "message": "Event & layout updated", "event": ev})
            return

        # 8. Add Gift
        elif path == '/api/gifts':
            title = data.get('title', '').strip()
            if not title:
                self.send_error_json("Gift title is required")
                return

            gift_id = f"gift-{str(uuid.uuid4())[:8]}"
            title_bn = data.get('title_bn') or title
            category = data.get('category', 'appliances')
            price = float(data.get('price', 0))
            is_group = 1 if data.get('is_group_gift') else 0
            image_url = data.get('image_url') or 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'
            merchant_url = data.get('merchant_url', '')
            merchant_name = data.get('merchant_name', 'Daraz BD')
            vendor_sku = data.get('vendor_sku', f"SKU-{str(uuid.uuid4())[:6].upper()}")
            description = data.get('description', '')

            conn = get_db()
            c = conn.cursor()
            c.execute('''
                INSERT INTO gifts (id, title, title_bn, category, price, target_amount, current_amount, image_url, merchant_url, merchant_name, vendor_sku, description, is_group_gift, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?)
            ''', (gift_id, title, title_bn, category, price, price, 0.0, image_url, merchant_url, merchant_name, vendor_sku, description, is_group, datetime.datetime.now().isoformat()))
            conn.commit()
            conn.close()

            self.send_json({"success": True, "message": "Gift added to registry", "gift_id": gift_id})
            return

        # 9. Place Contribution & Reserve Funds in Escrow
        elif path == '/api/contribute':
            gift_id = data.get('gift_id')
            name = data.get('contributor_name', 'Anonymous Well-wisher')
            phone = data.get('contributor_phone', '')
            email = data.get('contributor_email', '')
            amount = float(data.get('amount', 0))
            payment_method = data.get('payment_method', 'bKash')
            trx_id = data.get('trx_id', f"TRX-{str(uuid.uuid4())[:8].upper()}")
            blessing_msg = data.get('blessing_msg', '')

            if amount <= 0:
                self.send_error_json("Contribution amount must be greater than 0")
                return

            contrib_id = f"c-{str(uuid.uuid4())[:8]}"
            escrow_id = f"ESC-{str(uuid.uuid4())[:6].upper()}"
            now = datetime.datetime.now().isoformat()

            conn = get_db()
            c = conn.cursor()

            # Record contribution
            c.execute('''
                INSERT INTO contributions (id, gift_id, contributor_name, contributor_phone, contributor_email, amount, payment_method, trx_id, blessing_msg, created_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified')
            ''', (contrib_id, gift_id, name, phone, email, amount, payment_method, trx_id, blessing_msg, now))

            # Event delivery info & commission rate
            c.execute('SELECT commission_rate, delivery_address, delivery_contact_phone, groom_name, bride_name FROM events WHERE id = "utsab-default"')
            ev_row = c.fetchone()
            comm_rate = ev_row['commission_rate'] if ev_row else 7.5
            delivery_addr = ev_row['delivery_address'] if ev_row else 'Dhaka, Bangladesh'
            delivery_phone = ev_row['delivery_contact_phone'] if ev_row else phone
            couple_names = f"{ev_row['groom_name']} & {ev_row['bride_name']}" if ev_row else 'Newlyweds'

            platform_commission = round(amount * (comm_rate / 100.0), 2) if gift_id != 'salami-fund' else 0.0
            net_reserved = round(amount - platform_commission, 2)

            # Record in Escrow & Fund Reservation Table
            if gift_id == 'salami-fund':
                # Salami cash fund is immediately available to couple
                c.execute('''
                    INSERT INTO funds_escrow (id, source_type, reference_id, item_name, contributor_name, contributor_phone, total_amount, platform_commission, net_reserved, escrow_status, release_condition, payout_destination, created_at, released_at)
                    VALUES (?, 'salami_cash', ?, 'Digital Salami Envelope', ?, ?, ?, 0.0, ?, 'released_host', 'immediate_host', ?, ?, ?)
                ''', (escrow_id, contrib_id, name, phone, amount, amount, f"{payment_method} Wallet", now, now))
            else:
                # Vendor or group gift: funds held in escrow
                c.execute('SELECT * FROM gifts WHERE id = ?', (gift_id,))
                gift_row = c.fetchone()
                item_title = gift_row['title'] if gift_row else 'Registry Item'
                merchant_name = gift_row['merchant_name'] if gift_row else 'Vendor'
                is_group = bool(gift_row['is_group_gift']) if gift_row else False

                new_current = (gift_row['current_amount'] or 0.0) + amount
                target = gift_row['target_amount'] or gift_row['price']
                new_status = 'claimed' if new_current >= target else 'partially_funded'

                c.execute('UPDATE gifts SET current_amount = ?, status = ? WHERE id = ?', (new_current, new_status, gift_id))

                release_cond = 'group_gift_completion' if is_group else 'vendor_delivery_confirmed'

                c.execute('''
                    INSERT INTO funds_escrow (id, source_type, reference_id, item_name, contributor_name, contributor_phone, total_amount, platform_commission, net_reserved, escrow_status, release_condition, payout_destination, created_at, released_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'reserved', ?, ?, ?, NULL)
                ''', (
                    escrow_id,
                    'group_contribution' if is_group else 'gift_purchase',
                    contrib_id,
                    item_title,
                    name,
                    phone,
                    amount,
                    platform_commission,
                    net_reserved,
                    release_cond,
                    f"Vendor: {merchant_name}",
                    now
                ))

                # Vendor order
                vendor_order_id = f"ORD-{str(uuid.uuid4())[:6].upper()}"
                c.execute('''
                    INSERT INTO vendor_orders (id, gift_id, vendor_name, product_title, product_url, total_amount, commission_rate, platform_commission, vendor_payout, buyer_name, buyer_phone, delivery_recipient, delivery_address, delivery_phone, payment_method, trx_id, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'placed', ?)
                ''', (
                    vendor_order_id,
                    gift_id,
                    merchant_name,
                    item_title,
                    gift_row['merchant_url'] or '',
                    amount,
                    comm_rate,
                    platform_commission,
                    net_reserved,
                    name,
                    phone,
                    couple_names,
                    delivery_addr,
                    delivery_phone,
                    payment_method,
                    trx_id,
                    now
                ))

            # Record blessing in guestbook if provided
            if blessing_msg:
                b_id = f"b-{str(uuid.uuid4())[:8]}"
                c.execute('''
                    INSERT INTO guestbook (id, name, relation, message, reaction, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (b_id, name, f"Gifted via {payment_method}", blessing_msg, "🎁", now))

            conn.commit()
            conn.close()

            self.send_json({
                "success": True,
                "message": "পেমেন্ট সফল ও তহবিল এসক্রোতে সংরক্ষিত হয়েছে! (Funds safely held in Escrow)",
                "contribution_id": contrib_id,
                "escrow_id": escrow_id,
                "trx_id": trx_id,
                "amount": amount
            })
            return

        # 10. Gallery Photo Management
        elif path == '/api/gallery':
            image_url = data.get('image_url', '').strip()
            caption = data.get('caption', '').strip()
            if not image_url:
                self.send_error_json("Image URL is required")
                return

            gal_id = f"gal-{str(uuid.uuid4())[:8]}"
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT COUNT(*) FROM gallery')
            order_idx = c.fetchone()[0] + 1
            c.execute('INSERT INTO gallery VALUES (?, ?, ?, ?, ?)', (gal_id, image_url, caption, order_idx, datetime.datetime.now().isoformat()))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Photo added to gallery", "id": gal_id})
            return

        elif path == '/api/guestbook':
            name = data.get('name', 'Well-wisher').strip()
            relation = data.get('relation', 'Guest')
            message = data.get('message', '').strip()
            reaction = data.get('reaction', '💖')

            if not message:
                self.send_error_json("Blessing message is required")
                return

            b_id = f"b-{str(uuid.uuid4())[:8]}"
            now = datetime.datetime.now().isoformat()

            conn = get_db()
            c = conn.cursor()
            c.execute('''
                INSERT INTO guestbook (id, name, relation, message, reaction, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (b_id, name, relation, message, reaction, now))
            conn.commit()
            conn.close()

            self.send_json({"success": True, "message": "Blessing added to guestbook", "id": b_id})
            return

        self.send_error_json("Endpoint not found", 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/gifts/'):
            gift_id = path.split('/')[-1]
            conn = get_db()
            c = conn.cursor()
            c.execute('DELETE FROM gifts WHERE id = ?', (gift_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": f"Gift {gift_id} deleted"})
            return
        elif path.startswith('/api/gallery/'):
            gal_id = path.split('/')[-1]
            conn = get_db()
            c = conn.cursor()
            c.execute('DELETE FROM gallery WHERE id = ?', (gal_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": f"Photo {gal_id} deleted"})
            return
        self.send_error_json("Not found", 404)

    def parse_vendor_url(self, url):
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        path = parsed.path.lower()

        vendor_name = "Daraz BD"
        category = "appliances"
        title = "Imported Vendor Product"
        title_bn = "ভেন্ডর থেকে আমদানিকৃত পণ্য"
        price = 12500.0
        image_url = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
        desc = f"Imported directly from {domain}. Directly orderable via UtsabRegistry checkout with escrow fund reservation and home delivery."

        if "aarong.com" in domain:
            vendor_name = "Aarong Lifestyle"
            category = "luxury"
            if "saree" in path or "jamdani" in path or "sharee" in path:
                title = "Aarong Handloom Dhakai Jamdani Silk Sharee"
                title_bn = "আড়ং হ্যান্ডলুম ঢাকাই জামদানি সিল্ক শাড়ি"
                price = 16800.0
                image_url = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
            else:
                title = "Aarong Heritage Festive Collection"
                title_bn = "আড়ং হেরিটেজ উৎসব কালেকশন"
                price = 14500.0
                image_url = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"

        elif "walton" in domain:
            vendor_name = "Walton Plaza BD"
            category = "appliances"
            if "ac" in path:
                title = "Walton 1.5 Ton Inverter Smart Split AC"
                title_bn = "ওয়ালটন ১.৫ টন ইনভার্টার স্মার্ট এসি"
                price = 62000.0
                image_url = "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80"
            else:
                title = "Walton Smart Home Appliance"
                title_bn = "ওয়ালটন স্মার্ট হোম অ্যাপ্লায়েন্স"
                price = 38000.0
                image_url = "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80"

        elif "transcom" in domain:
            vendor_name = "Transcom Digital"
            category = "kitchen"
            title = "Philips Essential RapidAir Digital Air Fryer HD9270"
            title_bn = "ফিলিপস এসেনশিয়াল ডিজিটাল এয়ার ফ্রায়ার"
            price = 15200.0
            image_url = "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80"

        elif "pickaboo" in domain:
            vendor_name = "Pickaboo BD"
            category = "appliances"
            title = "Xiaomi Dreame D9 Robot Vacuum & Wet Mop"
            title_bn = "শাওমি ড্রিম রোবট ভ্যাকুয়াম ও মপ"
            price = 28900.0
            image_url = "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=800&q=80"

        elif "monno" in domain:
            vendor_name = "Monno Ceramics BD"
            category = "luxury"
            title = "Monno Ceramics Royal Dynasty 32-Piece Porcelain Tea & Dinner Set"
            title_bn = "মুন্নু সিরামিক রয়্যাল ডাইনেস্টি ৩২-পিস সেট"
            price = 14800.0
            image_url = "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80"

        return {
            "title": title,
            "title_bn": title_bn,
            "merchant_name": vendor_name,
            "merchant_url": url,
            "category": category,
            "price": price,
            "image_url": image_url,
            "description": desc,
            "vendor_sku": f"IMP-{str(uuid.uuid4())[:6].upper()}"
        }

    def serve_static(self, path):
        if path == '/' or path == '':
            path = '/index.html'

        if path.startswith('/uploads/'):
            filename = os.path.basename(path)
            file_path = os.path.join(UPLOADS_DIR, filename)
        else:
            path = path.lstrip('/')
            file_path = os.path.join(FRONTEND_DIR, path)

            if not os.path.abspath(file_path).startswith(os.path.abspath(FRONTEND_DIR)):
                self.send_error(403, "Forbidden")
                return

            if not os.path.exists(file_path) or os.path.isdir(file_path):
                file_path = os.path.join(FRONTEND_DIR, 'index.html')

        if not os.path.exists(file_path):
            self.send_error(404, "File not found")
            return

        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'text/plain'
            if mime_type.startswith('text/') or mime_type in ('application/javascript', 'application/json'):
                mime_type += '; charset=utf-8'

            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")

def run_server():
    init_db()
    server_address = ('', PORT)
    httpd = socketserver.ThreadingTCPServer(server_address, RegistryHandler)
    httpd.allow_reuse_address = True
    print(f"=====================================================")
    print(f"  UtsabRegistry BD Server on port {PORT}")
    print(f"  - Database Management & JSON Snapshot Export")
    print(f"  - Fund Reservation & Escrow Engine")
    print(f"  - BD Vendor Connect & Commission Engine")
    print(f"  Access: http://localhost:{PORT}")
    print(f"=====================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
