/* ─────────────────────────────────────────────────────────────────
   WebPro — Shared JS: Navbar, Footer, Utilities
   ───────────────────────────────────────────────────────────────── */

const PHONE     = '0852 297 684';
const PHONE_RAW = '0852297684';
const ZALO_URL  = 'https://zalo.me/0852297684';
const FB_URL    = '#';
const YT_URL    = '#';

/* == Navbar ======================================================== */
function renderNavbar(activePage = '') {
  const links = [
    { href: '/',        label: 'Trang Chủ', key: 'home'     },
    { href: '/blog',    label: 'Blog',       key: 'blog'     },
    { href: '/services',label: 'Dịch Vụ',   key: 'services' },
    { href: '/contact', label: 'Liên Hệ',   key: 'contact'  },
  ];

  const navHtml = links.map(l => `
    <li><a href="${l.href}" class="${activePage === l.key ? 'active' : ''}">${l.label}</a></li>
  `).join('');

  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  navbar.innerHTML = `
    <div class="container">
      <div class="navbar__inner">
        <a href="/" class="navbar__logo">Web<span>Pro</span><em>.</em></a>
        <ul class="navbar__nav" id="navMenu">
          ${navHtml}
        </ul>
        <a href="/contact" class="btn btn--primary btn--sm navbar__cta">Tư Vấn Miễn Phí</a>
        <button class="navbar__toggle" id="navToggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('navToggle').addEventListener('click', function() {
    document.getElementById('navMenu').classList.toggle('open');
    this.classList.toggle('open');
  });
}

/* == Footer ======================================================== */
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="/" class="footer__logo">Web<span>Pro</span>.</a>
          <p class="footer__tagline">Dịch vụ thiết kế website chuyên nghiệp, giá rẻ<br>Bàn giao nhanh trong 24–48h.</p>
        </div>

        <div class="footer__col">
          <h4>Dịch Vụ</h4>
          <ul class="footer__links">
            <li><a href="/services">Landing Page</a></li>
            <li><a href="/services">Website Doanh Nghiệp</a></li>
            <li><a href="/services">Website Thương Mại Điện Tử</a></li>
            <li><a href="/services">SEO &amp; Content Marketing</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>Tài Nguyên</h4>
          <ul class="footer__links">
            <li><a href="/blog">Blog Thiết Kế Web</a></li>
            <li><a href="/blog?category=kiem-tien-online">Kiếm Tiền Online</a></li>
            <li><a href="/blog?category=review-cong-cu">Review Công Cụ</a></li>
            <li><a href="/sitemap.xml" target="_blank">Sitemap</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>Liên Hệ</h4>
          <div class="footer__contact-item">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.32A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <a href="tel:${PHONE_RAW}" style="color:rgba(255,255,255,.65)">${PHONE}</a>
          </div>
          <div class="footer__contact-item">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <a href="mailto:namtranhoai179.3@gmail.com" style="color:rgba(255,255,255,.65)">namtranhoai179.3@gmail.com</a>
          </div>
          <div class="footer__contact-item">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>T2–CN: 8:00–23:00</span>
          </div>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copyright">© ${new Date().getFullYear()} WebPro. Thiết kế website chuyên nghiệp, giá rẻ.</p>
        <div class="footer__legal">
          <a href="#">Chính Sách Bảo Mật</a>
          <a href="#">Điều Khoản Dịch Vụ</a>
          <a href="/admin" style="opacity:.3">Admin</a>
        </div>
      </div>
    </div>
  `;
}

/* == Float CTA ===================================================== */
function renderFloatCTA() {
  const el = document.getElementById('floatCta');
  if (!el) return;
  el.innerHTML = `
    <a href="tel:${PHONE_RAW}" class="float-btn float-btn--phone">
      <div class="float-btn__tip">${PHONE}</div>
      <svg width="21" height="21" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.32A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    </a>
    <a href="${ZALO_URL}" class="float-btn float-btn--zalo" target="_blank" rel="noopener">
      <div class="float-btn__tip">Chat Zalo</div>
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 5h16L4 19h16"/>
      </svg>
    </a>
    <div class="float-chat-wrap">
      <div class="chat-popup" id="chatPopup">
        <div class="chat-popup__head">
          <div class="chat-popup__avatar">W</div>
          <div>
            <div class="chat-popup__name">WebPro Tư Vấn</div>
            <div class="chat-popup__status"><span class="chat-popup__sdot"></span> Đang trực tuyến</div>
          </div>
          <button class="chat-popup__close" onclick="toggleChat()">×</button>
        </div>
        <div class="chat-popup__body">
          <div class="chat-popup__bubble">Xin chào! 👋 Bạn cần tư vấn gói website nào? Mình hỗ trợ ngay.</div>
          <div class="chat-popup__chips">
            <a href="/services" class="chat-popup__chip">📋 Xem bảng giá dịch vụ</a>
            <a href="${ZALO_URL}" target="_blank" rel="noopener" class="chat-popup__chip">💬 Chat Zalo ngay</a>
            <a href="tel:${PHONE_RAW}" class="chat-popup__chip">📞 Gọi ${PHONE}</a>
            <a href="/contact" class="chat-popup__chip">✉️ Để lại thông tin</a>
          </div>
        </div>
      </div>
      <button class="float-btn float-btn--chat" onclick="toggleChat()" id="chatBtn">
        <div class="float-btn__tip">Tư vấn ngay</div>
        <svg width="21" height="21" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="9" cy="10" r="1" fill="white" stroke="none"/>
          <circle cx="12" cy="10" r="1" fill="white" stroke="none"/>
          <circle cx="15" cy="10" r="1" fill="white" stroke="none"/>
        </svg>
      </button>
    </div>
  `;
}

function toggleChat() {
  const popup = document.getElementById('chatPopup');
  if (popup) popup.classList.toggle('open');
}

/* == Utilities ===================================================== */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function truncate(text, len = 160) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len).trim() + '…' : text;
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

function getCategoryColor(slug) {
  const map = {
    'thiet-ke-website': 'badge',
    'kiem-tien-online': 'badge--green',
    'wordpress':        'badge--purple',
    'review-cong-cu':   'badge--red',
  };
  return map[slug] || 'badge';
}

/* == Toast ========================================================= */
let toastContainer;
function showToast(message, type = 'default', duration = 3500) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = message;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

/* == Blog Card ===================================================== */
function renderBlogCard(post) {
  const badgeClass = getCategoryColor(post.category_slug);
  return `
    <article class="blog-card">
      <img class="blog-card__img" src="${post.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=70'}" alt="${post.title}" loading="lazy">
      <div class="blog-card__body">
        <div class="blog-card__meta">
          <span class="${badgeClass}">${post.category_icon || ''} ${post.category_name || ''}</span>
          <span class="blog-card__readtime">⏱ ${post.read_time} phút đọc</span>
        </div>
        <h3 class="blog-card__title"><a href="/blog/${post.slug}">${post.title}</a></h3>
        <p class="blog-card__excerpt">${truncate(post.excerpt, 140)}</p>
        <div class="blog-card__footer">
          <span class="blog-card__date">${formatDate(post.created_at)}</span>
          <span class="blog-card__views">👁 ${formatNumber(post.views)}</span>
        </div>
      </div>
    </article>
  `;
}

/* == Contact Form Submit =========================================== */
async function submitContactForm(formEl, buttonEl) {
  const data = {
    name:         formEl.querySelector('[name=name]')?.value?.trim(),
    phone:        formEl.querySelector('[name=phone]')?.value?.trim(),
    service_type: formEl.querySelector('[name=service_type]')?.value,
    message:      formEl.querySelector('[name=message]')?.value?.trim(),
  };

  if (!data.name || !data.phone) {
    showToast('Vui lòng nhập họ tên và số điện thoại.', 'error');
    return false;
  }

  const origText = buttonEl.textContent;
  buttonEl.disabled = true;
  buttonEl.textContent = 'Đang gửi…';

  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    showToast('✅ ' + json.message, 'success');
    formEl.reset();
    return true;
  } catch (err) {
    showToast('❌ ' + (err.message || 'Gửi thất bại, thử lại sau.'), 'error');
    return false;
  } finally {
    buttonEl.disabled = false;
    buttonEl.textContent = origText;
  }
}

/* == FAQ Toggle ==================================================== */
function initFAQ(container = document) {
  container.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      container.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* == Scroll Reveal ================================================= */
function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(el => io.observe(el));
}

/* == Navbar Scroll ================================================= */
function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* == Number Counter =============================================== */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const dur = 1600;
    const start = performance.now();
    const update = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const val = target * ease;
      el.textContent = prefix + (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

function initCounters() {
  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { animateCounters(); io.disconnect(); }
  }, { threshold: 0.5 });
  io.observe(statsBar);
}

/* == Init ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  renderFloatCTA();
  initScrollReveal();
  initNavbarScroll();
  initCounters();
  document.addEventListener('click', e => {
    const popup = document.getElementById('chatPopup');
    const wrap  = document.querySelector('.float-chat-wrap');
    if (popup && popup.classList.contains('open') && wrap && !wrap.contains(e.target)) {
      popup.classList.remove('open');
    }
  });
});
