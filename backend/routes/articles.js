const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const db      = require('../db/database');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Body bài viết có thể lớn hơn giới hạn 100kb mặc định của express.json
router.use(express.json({ limit: '10mb' }));

// So sánh token kiểu timing-safe (băm trước để 2 buffer luôn cùng độ dài)
function tokenMatches(given, expected) {
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

function str(v) {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function readTime(article) {
  const text = (article.body_markdown || article.body_html || '').replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const upsert = db.prepare(`
  INSERT INTO articles
    (slug, title, body_markdown, body_html, blocks, meta_title, meta_description,
     excerpt, primary_keyword, image_url, image_alt, published_at, updated_at, status, read_time)
  VALUES
    (@slug, @title, @body_markdown, @body_html, @blocks, @meta_title, @meta_description,
     @excerpt, @primary_keyword, @image_url, @image_alt, @published_at, @updated_at, @status, @read_time)
  ON CONFLICT(slug) DO UPDATE SET
    title            = excluded.title,
    body_markdown    = excluded.body_markdown,
    body_html        = excluded.body_html,
    blocks           = excluded.blocks,
    meta_title       = excluded.meta_title,
    meta_description = excluded.meta_description,
    excerpt          = excluded.excerpt,
    primary_keyword  = excluded.primary_keyword,
    image_url        = excluded.image_url,
    image_alt        = excluded.image_alt,
    published_at     = excluded.published_at,
    updated_at       = excluded.updated_at,
    status           = excluded.status,
    read_time        = excluded.read_time,
    received_at      = CURRENT_TIMESTAMP
`);

// POST /api/articles/webhook — Ryze Custom Webhook
// Chỉ xác thực bằng Bearer token, không qua middleware auth của admin.
router.post('/webhook', (req, res) => {
  const expected = process.env.RYZE_WEBHOOK_TOKEN;
  if (!expected) {
    console.error('[ryze] RYZE_WEBHOOK_TOKEN chưa được cấu hình');
    return res.status(503).json({ ok: false, error: 'Webhook not configured' });
  }

  const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
  if (!match || !tokenMatches(match[1].trim(), expected)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const slug = typeof b.slug === 'string' ? b.slug : '';
  if (!SLUG_RE.test(slug)) {
    return res.status(400).json({ ok: false, error: 'Invalid slug' });
  }
  if (!str(b.title)) {
    return res.status(400).json({ ok: false, error: 'Missing title' });
  }
  if (!str(b.body_html) && !str(b.body_markdown)) {
    return res.status(400).json({ ok: false, error: 'Missing body_html and body_markdown' });
  }

  const now = new Date().toISOString();
  const article = {
    slug,
    title:            b.title.trim(),
    body_markdown:    str(b.body_markdown),
    body_html:        str(b.body_html),
    blocks:           Array.isArray(b.blocks) ? JSON.stringify(b.blocks) : null,
    meta_title:       str(b.meta_title),
    meta_description: str(b.meta_description),
    excerpt:          str(b.excerpt),
    primary_keyword:  str(b.primary_keyword),
    image_url:        b.image && str(b.image.url),
    image_alt:        b.image && str(b.image.alt),
    published_at:     str(b.published_at) || now,
    updated_at:       str(b.updated_at) || str(b.published_at) || now,
    status:           str(b.status) || 'published',
  };
  article.read_time = readTime(article);

  try {
    upsert.run(article);
  } catch (err) {
    console.error('[ryze] Lỗi lưu bài:', err);
    return res.status(500).json({ ok: false, error: 'Database error' });
  }

  res.status(200).json({ ok: true, slug });
});

// JSON hỏng / quá lớn → trả JSON thay vì trang lỗi HTML mặc định
router.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  if (err.type === 'entity.too.large')   return res.status(413).json({ ok: false, error: 'Payload too large' });
  next(err);
});

module.exports = router;
