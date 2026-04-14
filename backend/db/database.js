const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'webpro.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    service_type TEXT,
    message     TEXT,
    status      TEXT DEFAULT 'new',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS demo_sites (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT,
    theme       TEXT DEFAULT 'blue',
    hero_text   TEXT,
    is_active   INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    image_url   TEXT,
    demo_url    TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed admin account (admin / admin123) — chỉ tạo nếu chưa có
const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
if (!existing) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', hash);
}

// Seed demo sites nếu chưa có
const demoCount = db.prepare('SELECT COUNT(*) as c FROM demo_sites').get();
if (demoCount.c === 0) {
  const insert = db.prepare(`
    INSERT INTO demo_sites (title, category, description, theme, hero_text, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insert.run('Website shop thời trang online',  'Shop bán hàng',    'Landing page 1 trang, form đặt hàng, nút liên hệ nổi bật, tối ưu chuyển đổi.', 'blue',  'Shop thời trang\nLanding page chuyển đổi cao', 1);
  insert.run('Website spa đặt lịch online',     'Spa / Nail / Salon','Giới thiệu dịch vụ, bảng giá rõ ràng, form đặt lịch, tích hợp bản đồ.',   'green', 'Spa & làm đẹp\nĐặt lịch online, giới thiệu dịch vụ', 2);
  insert.run('Website giới thiệu công ty',      'Công ty / Dịch vụ','5 trang đầy đủ, portfolio dự án, blog tin tức, form liên hệ chuyên nghiệp.', 'dark',  'Doanh nghiệp nhỏ\nGiới thiệu công ty chuyên nghiệp', 3);
}

// Migration: add image_url and demo_url if missing
const cols = db.pragma('table_info(demo_sites)').map(c => c.name);
if (!cols.includes('image_url')) db.exec('ALTER TABLE demo_sites ADD COLUMN image_url TEXT');
if (!cols.includes('demo_url'))  db.exec('ALTER TABLE demo_sites ADD COLUMN demo_url TEXT');

module.exports = db;
