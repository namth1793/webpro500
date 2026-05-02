const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// GET /api/blog/categories
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM blog_categories ORDER BY name ASC').all();
  res.json(rows);
});

// GET /api/blog/posts  — list published posts
// Query: page, limit, category (slug), search, featured
router.get('/posts', (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page)  || 1);
  const limit    = Math.min(20, parseInt(req.query.limit) || 9);
  const offset   = (page - 1) * limit;
  const catSlug  = req.query.category || '';
  const search   = req.query.search   || '';
  const featured = req.query.featured === '1';

  let where = 'p.is_published = 1';
  const params = [];

  if (catSlug) {
    where += ' AND c.slug = ?';
    params.push(catSlug);
  }
  if (search) {
    where += ' AND (p.title LIKE ? OR p.excerpt LIKE ? OR p.tags LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (featured) {
    where += ' AND p.is_featured = 1';
  }

  const total = db.prepare(`
    SELECT COUNT(*) as n FROM blog_posts p
    LEFT JOIN blog_categories c ON c.id = p.category_id
    WHERE ${where}
  `).get(...params).n;

  const rows = db.prepare(`
    SELECT p.id, p.title, p.slug, p.excerpt, p.image_url,
           p.read_time, p.views, p.tags, p.is_featured,
           p.created_at, p.updated_at,
           c.name  AS category_name,
           c.slug  AS category_slug,
           c.color AS category_color,
           c.icon  AS category_icon
    FROM blog_posts p
    LEFT JOIN blog_categories c ON c.id = p.category_id
    WHERE ${where}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ posts: rows, total, page, limit, pages: Math.ceil(total / limit) });
});

// GET /api/blog/posts/related/:id — related posts (same category, exclude self)
router.get('/posts/related/:id', (req, res) => {
  const post = db.prepare('SELECT category_id FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.json([]);

  const rows = db.prepare(`
    SELECT p.id, p.title, p.slug, p.excerpt, p.image_url, p.read_time, p.views, p.created_at,
           c.name AS category_name, c.slug AS category_slug, c.color AS category_color
    FROM blog_posts p
    LEFT JOIN blog_categories c ON c.id = p.category_id
    WHERE p.is_published = 1 AND p.category_id = ? AND p.id != ?
    ORDER BY p.views DESC
    LIMIT 3
  `).all(post.category_id, req.params.id);

  res.json(rows);
});

// GET /api/blog/posts/:slug — single post (increments view count)
router.get('/posts/:slug', (req, res) => {
  const row = db.prepare(`
    SELECT p.*,
           c.name  AS category_name,
           c.slug  AS category_slug,
           c.color AS category_color,
           c.icon  AS category_icon
    FROM blog_posts p
    LEFT JOIN blog_categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.is_published = 1
  `).get(req.params.slug);

  if (!row) return res.status(404).json({ error: 'Bài viết không tìm thấy.' });

  // Increment views (fire-and-forget)
  db.prepare('UPDATE blog_posts SET views = views + 1 WHERE id = ?').run(row.id);
  row.views += 1;

  res.json(row);
});

module.exports = router;
