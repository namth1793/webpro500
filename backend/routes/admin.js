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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || 'webpro_secret_2025';

// ── Auth middleware ────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập.' });
  }
  try {
    req.admin = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

// ── POST /api/admin/login ──────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin.' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ success: true, token, username: admin.username });
});

// ── GET /api/admin/me ──────────────────────────────────────────
router.get('/me', auth, (req, res) => {
  res.json({ username: req.admin.username });
});

// ── POST /api/admin/change-password ───────────────────────────
router.post('/change-password', auth, (req, res) => {
  const { current, newPassword } = req.body;
  if (!current || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin.' });
  if (newPassword.length < 6)   return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 6 ký tự.' });
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(current, admin.password_hash)) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng.' });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, req.admin.id);
  res.json({ success: true });
});

// ══ CONTACTS ══════════════════════════════════════════════════

// GET all contacts
router.get('/contacts', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.json(rows);
});

// PATCH status (new → contacted → done)
router.patch('/contacts/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'contacted', 'done'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// DELETE contact
router.delete('/contacts/:id', auth, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── POST /api/admin/upload-image ──────────────────────────────
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file ảnh.' });
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'webpro/demos', resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Upload thất bại: ' + err.message });
  }
});

// ══ DEMO SITES ═════════════════════════════════════════════════

// GET all (public endpoint used by landing page)
router.get('/demo-sites/public', (req, res) => {
  const rows = db.prepare('SELECT * FROM demo_sites WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
  res.json(rows);
});

// GET all (admin)
router.get('/demo-sites', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM demo_sites ORDER BY sort_order ASC, id ASC').all();
  res.json(rows);
});

// POST create
router.post('/demo-sites', auth, (req, res) => {
  const { title, category, description, image_url, demo_url, is_active, sort_order } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Tiêu đề và danh mục là bắt buộc.' });
  const result = db.prepare(`
    INSERT INTO demo_sites (title, category, description, image_url, demo_url, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, category, description || '', image_url || '', demo_url || '', is_active !== false ? 1 : 0, sort_order || 0);
  res.json({ success: true, id: result.lastInsertRowid });
});

// PUT update
router.put('/demo-sites/:id', auth, (req, res) => {
  const { title, category, description, image_url, demo_url, is_active, sort_order } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Tiêu đề và danh mục là bắt buộc.' });
  db.prepare(`
    UPDATE demo_sites SET title=?, category=?, description=?, image_url=?, demo_url=?, is_active=?, sort_order=? WHERE id=?
  `).run(title, category, description || '', image_url || '', demo_url || '', is_active !== false ? 1 : 0, sort_order || 0, req.params.id);
  res.json({ success: true });
});

// DELETE
router.delete('/demo-sites/:id', auth, (req, res) => {
  db.prepare('DELETE FROM demo_sites WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
