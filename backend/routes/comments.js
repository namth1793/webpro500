const express = require('express');
const router  = express.Router();
const db      = require('../db/database');
const jwt     = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'webpro_secret_2024';

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
}

// GET /api/comments/post/:postId — public
router.get('/post/:postId', (req, res) => {
  const rows = db.prepare(
    'SELECT id, name, content, created_at FROM comments WHERE post_id = ? AND is_approved = 1 ORDER BY created_at ASC'
  ).all(req.params.postId);
  res.json(rows);
});

// POST /api/comments — public, submit
router.post('/', (req, res) => {
  const { post_id, name, content } = req.body;
  if (!post_id || !name?.trim() || !content?.trim())
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ tên và nội dung bình luận.' });
  if (content.trim().length < 10)
    return res.status(400).json({ error: 'Bình luận quá ngắn (tối thiểu 10 ký tự).' });
  if (content.trim().length > 1000)
    return res.status(400).json({ error: 'Bình luận quá dài (tối đa 1000 ký tự).' });
  if (name.trim().length > 60)
    return res.status(400).json({ error: 'Tên quá dài.' });

  const post = db.prepare('SELECT id FROM blog_posts WHERE id = ? AND is_published = 1').get(post_id);
  if (!post) return res.status(404).json({ error: 'Bài viết không tồn tại.' });

  const result = db.prepare(
    'INSERT INTO comments (post_id, name, content) VALUES (?, ?, ?)'
  ).run(post_id, name.trim(), content.trim());

  const comment = db.prepare(
    'SELECT id, name, content, created_at FROM comments WHERE id = ?'
  ).get(result.lastInsertRowid);

  res.json({ success: true, comment });
});

// GET /api/comments — admin: all comments
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.content, c.is_approved, c.created_at,
           p.title AS post_title, p.slug AS post_slug
    FROM comments c
    LEFT JOIN blog_posts p ON c.post_id = p.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

// DELETE /api/comments/:id — admin
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
