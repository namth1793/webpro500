const express = require('express');
const router  = express.Router();
const db      = require('../db/database');
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SERVICE_LABELS = {
  landing:    'Landing Page (1 trang)',
  standard:   'Website Chuẩn (1.000.000đ)',
  premium:    'Website Premium (2.000.000đ)',
  custom:     'Tùy Chỉnh / Hỏi giá',
  '':         'Chưa chọn',
};

function sendNotification(contact) {
  if (!resend) return;
  const { name, phone, service_type, message, id } = contact;
  const label = SERVICE_LABELS[service_type] || service_type || 'Chưa chọn';
  const time  = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const to    = process.env.NOTIFY_EMAIL || 'namtranhoai179.3@gmail.com';

  resend.emails.send({
    from: 'WebPro <onboarding@resend.dev>',
    to,
    subject: `[WebPro] Khách hàng mới #${id} — ${name}`,
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px">
            <p style="margin:0;color:rgba(255,255,255,.75);font-size:13px;letter-spacing:.05em;text-transform:uppercase">WebPro — Thông báo mới</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:700">Khách hàng mới điền form!</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0">
                  <span style="color:#64748b;font-size:13px;display:block;margin-bottom:3px">Họ và tên</span>
                  <strong style="color:#0f172a;font-size:16px">${name}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0">
                  <span style="color:#64748b;font-size:13px;display:block;margin-bottom:3px">Số điện thoại</span>
                  <a href="tel:${phone}" style="color:#2563eb;font-size:16px;font-weight:700;text-decoration:none">${phone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0">
                  <span style="color:#64748b;font-size:13px;display:block;margin-bottom:3px">Dịch vụ quan tâm</span>
                  <span style="color:#0f172a;font-size:15px">${label}</span>
                </td>
              </tr>
              ${message ? `
              <tr>
                <td style="padding:10px 0">
                  <span style="color:#64748b;font-size:13px;display:block;margin-bottom:6px">Tin nhắn</span>
                  <div style="background:#f8fafc;border-left:3px solid #2563eb;border-radius:4px;padding:12px 16px;color:#1e293b;font-size:14px;line-height:1.6">${message.replace(/\n/g, '<br>')}</div>
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 28px">
            <a href="tel:${phone}"
               style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#fff;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;text-decoration:none">
              📞 Gọi ngay cho ${name}
            </a>
            <a href="https://zalo.me/${phone.replace(/\D/g,'')}"
               style="display:inline-block;margin-left:10px;background:#0068FF;color:#fff;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;text-decoration:none">
              💬 Chat Zalo
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px">
            <p style="margin:0;color:#94a3b8;font-size:12px">
              Nhận lúc ${time} · WebPro Admin #${id} ·
              <a href="https://webpro500.io.vn/admin" style="color:#2563eb">Xem trong admin →</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }).catch(err => console.error('[Resend] Email error:', err.message));
}

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

  const stmt   = db.prepare('INSERT INTO contacts (name, phone, service_type, message) VALUES (?, ?, ?, ?)');
  const result = stmt.run(name, phone, service_type || '', message || '');

  sendNotification({ id: result.lastInsertRowid, name, phone, service_type, message });

  res.json({ success: true, id: result.lastInsertRowid, message: 'Đã nhận thông tin! Chúng tôi sẽ liên hệ bạn trong 30 phút.' });
});

// GET /api/contacts — xem danh sách (admin)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.json(rows);
});

module.exports = router;
