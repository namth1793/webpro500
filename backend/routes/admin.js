const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const db         = require('../db/database');

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

const upload     = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const JWT_SECRET = process.env.JWT_SECRET || 'webpro_secret_2025';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Chưa đăng nhập.' });
  try {
    req.admin = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

// ── Auth ──────────────────────────────────────────────────────────

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin.' });
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash))
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ success: true, token, username: admin.username });
});

router.get('/me', auth, (req, res) => {
  res.json({ username: req.admin.username });
});

router.post('/change-password', auth, (req, res) => {
  const { current, newPassword } = req.body;
  if (!current || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin.' });
  if (newPassword.length < 6)   return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 6 ký tự.' });
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(current, admin.password_hash))
    return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng.' });
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), req.admin.id);
  res.json({ success: true });
});

// ── Stats ─────────────────────────────────────────────────────────

router.get('/stats', auth, (req, res) => {
  const posts      = db.prepare('SELECT COUNT(*) as n FROM blog_posts WHERE is_published = 1').get().n;
  const drafts     = db.prepare('SELECT COUNT(*) as n FROM blog_posts WHERE is_published = 0').get().n;
  const contacts   = db.prepare('SELECT COUNT(*) as n FROM contacts').get().n;
  const newLeads   = db.prepare("SELECT COUNT(*) as n FROM contacts WHERE status = 'new'").get().n;
  const totalViews = db.prepare('SELECT COALESCE(SUM(views),0) as n FROM blog_posts').get().n;
  const demos      = db.prepare('SELECT COUNT(*) as n FROM demo_sites WHERE is_active = 1').get().n;
  const recentContacts = db.prepare(
    "SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5"
  ).all();
  res.json({ posts, drafts, contacts, newLeads, totalViews, demos, recentContacts });
});

// ── Contacts ──────────────────────────────────────────────────────

router.get('/contacts', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all());
});

router.patch('/contacts/:id/status', auth, (req, res) => {
  const allowed = ['new', 'contacted', 'done'];
  if (!allowed.includes(req.body.status))
    return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json({ success: true });
});

router.delete('/contacts/:id', auth, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Image Upload ──────────────────────────────────────────────────

router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file ảnh.' });
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'webpro', resource_type: 'image' },
        (err, r) => err ? reject(err) : resolve(r)
      );
      stream.end(req.file.buffer);
    });
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Upload thất bại: ' + err.message });
  }
});

// ── Demo Sites ────────────────────────────────────────────────────

router.get('/demo-sites/public', (req, res) => {
  res.json(db.prepare('SELECT * FROM demo_sites WHERE is_active = 1 ORDER BY sort_order ASC').all());
});

router.get('/demo-sites', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM demo_sites ORDER BY sort_order ASC').all());
});

router.post('/demo-sites', auth, (req, res) => {
  const { title, category, description, image_url, demo_url, tech_stack, is_active, sort_order } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Tiêu đề và danh mục là bắt buộc.' });
  const r = db.prepare(`
    INSERT INTO demo_sites (title, category, description, image_url, demo_url, tech_stack, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, category, description || '', image_url || '', demo_url || '', tech_stack || '', is_active !== false ? 1 : 0, sort_order || 0);
  res.json({ success: true, id: r.lastInsertRowid });
});

router.put('/demo-sites/:id', auth, (req, res) => {
  const { title, category, description, image_url, demo_url, tech_stack, is_active, sort_order } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Tiêu đề và danh mục là bắt buộc.' });
  db.prepare(`
    UPDATE demo_sites SET title=?, category=?, description=?, image_url=?, demo_url=?, tech_stack=?, is_active=?, sort_order=? WHERE id=?
  `).run(title, category, description || '', image_url || '', demo_url || '', tech_stack || '', is_active !== false ? 1 : 0, sort_order || 0, req.params.id);
  res.json({ success: true });
});

router.delete('/demo-sites/:id', auth, (req, res) => {
  db.prepare('DELETE FROM demo_sites WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Blog Categories ───────────────────────────────────────────────

router.get('/blog/categories', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM blog_categories ORDER BY name ASC').all());
});

router.post('/blog/categories', auth, (req, res) => {
  const { name, slug, description, color, icon } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Tên và slug là bắt buộc.' });
  try {
    const r = db.prepare('INSERT INTO blog_categories (name, slug, description, color, icon) VALUES (?, ?, ?, ?, ?)')
      .run(name, slug, description || '', color || '#2563eb', icon || '📝');
    res.json({ success: true, id: r.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'Slug đã tồn tại.' });
  }
});

router.delete('/blog/categories/:id', auth, (req, res) => {
  db.prepare('DELETE FROM blog_categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Blog Posts ────────────────────────────────────────────────────

router.get('/blog/posts', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.title, p.slug, p.excerpt, p.image_url,
           p.is_published, p.is_featured, p.views, p.read_time,
           p.created_at, p.updated_at,
           c.name AS category_name, c.slug AS category_slug
    FROM blog_posts p
    LEFT JOIN blog_categories c ON c.id = p.category_id
    ORDER BY p.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/blog/posts/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy.' });
  res.json(row);
});

router.post('/blog/posts', auth, (req, res) => {
  const {
    title, slug, excerpt, content, category_id, image_url,
    seo_title, seo_description, seo_keywords,
    is_published, is_featured, read_time, tags
  } = req.body;
  if (!title || !slug) return res.status(400).json({ error: 'Tiêu đề và slug là bắt buộc.' });
  try {
    const r = db.prepare(`
      INSERT INTO blog_posts
        (title, slug, excerpt, content, category_id, image_url,
         seo_title, seo_description, seo_keywords,
         is_published, is_featured, read_time, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, slug, excerpt || '', content || '', category_id || null, image_url || '',
      seo_title || title, seo_description || excerpt || '', seo_keywords || '',
      is_published ? 1 : 0, is_featured ? 1 : 0, read_time || 5, tags || ''
    );
    // Update category count
    if (category_id) db.prepare(`
      UPDATE blog_categories SET post_count = (SELECT COUNT(*) FROM blog_posts WHERE category_id = ? AND is_published = 1) WHERE id = ?
    `).run(category_id, category_id);
    res.json({ success: true, id: r.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'Slug đã tồn tại.' });
  }
});

router.put('/blog/posts/:id', auth, (req, res) => {
  const {
    title, slug, excerpt, content, category_id, image_url,
    seo_title, seo_description, seo_keywords,
    is_published, is_featured, read_time, tags
  } = req.body;
  if (!title || !slug) return res.status(400).json({ error: 'Tiêu đề và slug là bắt buộc.' });
  try {
    db.prepare(`
      UPDATE blog_posts SET
        title=?, slug=?, excerpt=?, content=?, category_id=?, image_url=?,
        seo_title=?, seo_description=?, seo_keywords=?,
        is_published=?, is_featured=?, read_time=?, tags=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      title, slug, excerpt || '', content || '', category_id || null, image_url || '',
      seo_title || title, seo_description || excerpt || '', seo_keywords || '',
      is_published ? 1 : 0, is_featured ? 1 : 0, read_time || 5, tags || '',
      req.params.id
    );
    if (category_id) db.prepare(`
      UPDATE blog_categories SET post_count = (SELECT COUNT(*) FROM blog_posts WHERE category_id = ? AND is_published = 1) WHERE id = ?
    `).run(category_id, category_id);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Slug đã tồn tại.' });
  }
});

router.delete('/blog/posts/:id', auth, (req, res) => {
  const post = db.prepare('SELECT category_id FROM blog_posts WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  if (post && post.category_id) db.prepare(`
    UPDATE blog_categories SET post_count = (SELECT COUNT(*) FROM blog_posts WHERE category_id = ? AND is_published = 1) WHERE id = ?
  `).run(post.category_id, post.category_id);
  res.json({ success: true });
});

module.exports = router;
