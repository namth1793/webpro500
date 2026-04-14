const express = require('express');
const router = express.Router();
const db = require('../db/database');

// POST /api/contacts — nhận form tư vấn
router.post('/', (req, res) => {
  const { name, phone, service_type, message } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Vui lòng nhập đủ họ tên và số điện thoại.' });
  }

  const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Số điện thoại không hợp lệ.' });
  }

  const stmt = db.prepare(`
    INSERT INTO contacts (name, phone, service_type, message)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(name, phone, service_type || '', message || '');

  res.json({ success: true, id: result.lastInsertRowid, message: 'Đã nhận thông tin! Chúng tôi sẽ liên hệ bạn trong 30 phút.' });
});

// GET /api/contacts — xem danh sách (admin)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.json(rows);
});

module.exports = router;
