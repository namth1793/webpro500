require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db/database');
const { listPublished, allForSitemap } = require('./lib/posts');
const blogViews = require('./views/blog');

const app  = express();
const PORT = process.env.PORT || 5017;
const FE   = path.join(__dirname, '..', 'frontend');

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

// Webhook Ryze: đặt trước express.json() vì route tự parse body với giới hạn lớn hơn.
// Chỉ xác thực bằng Bearer token, không redirect, không qua auth admin.
app.use('/api/articles', require('./routes/articles'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FE));

// ── API routes ────────────────────────────────────────────────────
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/blog',     require('./routes/blog'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/comments', require('./routes/comments'));

// ── Sitemap ───────────────────────────────────────────────────────
function siteUrl(req) {
  return (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

app.get('/sitemap.xml', (req, res) => {
  const base  = siteUrl(req);
  const today = new Date().toISOString().split('T')[0];

  const staticPages = ['', '/blog', '/services', '/contact'].map(p => `
  <url>
    <loc>${base}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

  const blogPages = allForSitemap().map(p => `
  <url>
    <loc>${base}/blog/${p.slug}</loc>
    <lastmod>${blogViews.isoDate(p.updated_at || p.created_at) || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

  res.set('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages}
${blogPages}
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Allow: /blog
Disallow: /admin
Disallow: /api/

Sitemap: ${siteUrl(req)}/sitemap.xml
`);
});

// ── Blog (render phía server cho SEO) ─────────────────────────────
const findArticle = db.prepare(`SELECT *, 'ryze' AS source FROM articles WHERE slug = ? AND status = 'published'`);
const findPost = db.prepare(`
  SELECT p.*, 'post' AS source,
         c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon
  FROM blog_posts p
  LEFT JOIN blog_categories c ON c.id = p.category_id
  WHERE p.slug = ? AND p.is_published = 1
`);
const relatedByCategory = db.prepare(`
  SELECT p.id, p.title, p.slug, p.excerpt, p.image_url, p.read_time, p.views, p.created_at,
         c.name AS category_name, c.icon AS category_icon
  FROM blog_posts p
  LEFT JOIN blog_categories c ON c.id = p.category_id
  WHERE p.is_published = 1 AND p.category_id = ? AND p.id != ?
  ORDER BY p.views DESC LIMIT 3
`);

app.get('/blog', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const data = listPublished({ page, limit: 9 });
  res.set('Cache-Control', 'public, max-age=60');
  res.send(blogViews.renderList({ siteUrl: siteUrl(req), data }));
});

app.get('/blog/:slug', (req, res) => {
  const slug = req.params.slug;
  let post = findArticle.get(slug);
  if (!post) {
    post = findPost.get(slug);
    if (post) {
      db.prepare('UPDATE blog_posts SET views = views + 1 WHERE id = ?').run(post.id);
      post.views += 1;
      Object.assign(post, {
        published_at:     post.created_at,
        meta_title:       post.seo_title,
        meta_description: post.seo_description,
      });
    }
  }
  if (!post) return res.status(404).send(blogViews.renderNotFound());

  let related = post.source === 'post' && post.category_id ? relatedByCategory.all(post.category_id, post.id) : [];
  if (related.length < 3) {
    const latest = listPublished({ page: 1, limit: 6 }).posts
      .filter(p => p.slug !== post.slug && !related.some(r => r.slug === p.slug));
    related = related.concat(latest).slice(0, 3);
  }

  res.set('Cache-Control', 'public, max-age=60');
  res.send(blogViews.renderPost({ siteUrl: siteUrl(req), post, related }));
});

// ── Clean URL routing ─────────────────────────────────────────────
const sendPage = file => (req, res) =>
  res.sendFile(path.join(FE, file));

app.get('/services', sendPage('services.html'));
app.get('/contact',  sendPage('contact.html'));
app.get('/admin*',   sendPage('admin.html'));
app.get('*',         sendPage('index.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  WebPro server : http://localhost:${PORT}`);
  console.log(`  Blog          : http://localhost:${PORT}/blog`);
  console.log(`  Services      : http://localhost:${PORT}/services`);
  console.log(`  Admin         : http://localhost:${PORT}/admin`);
  console.log(`  Sitemap       : http://localhost:${PORT}/sitemap.xml`);
  console.log(`  Login         : admin / admin123\n`);
});
