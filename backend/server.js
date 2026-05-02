require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 5017;
const FE   = path.join(__dirname, '..', 'frontend');

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FE));

// ── API routes ────────────────────────────────────────────────────
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/blog',     require('./routes/blog'));
app.use('/api/admin',    require('./routes/admin'));

// ── Sitemap ───────────────────────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  const base  = process.env.SITE_URL || `http://localhost:${PORT}`;
  const posts = db.prepare("SELECT slug, updated_at FROM blog_posts WHERE is_published = 1").all();
  const today = new Date().toISOString().split('T')[0];

  const staticPages = ['', '/blog', '/services', '/contact'].map(p => `
  <url>
    <loc>${base}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

  const blogPages = posts.map(p => `
  <url>
    <loc>${base}/blog/${p.slug}</loc>
    <lastmod>${(p.updated_at || today).split('T')[0]}</lastmod>
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

// ── Clean URL routing ─────────────────────────────────────────────
const sendPage = file => (req, res) =>
  res.sendFile(path.join(FE, file));

app.get('/blog',     sendPage('blog.html'));
app.get('/blog/:slug', sendPage('blog-post.html'));
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
