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
          <p class="footer__tagline">Dịch vụ thiết kế website chuyên nghiệp, giá rẻ từ 500K.<br>Bàn giao nhanh trong 24–48h.</p>
          <div class="footer__social">
            <a href="${FB_URL}" aria-label="Facebook" target="_blank" rel="noopener">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="${YT_URL}" aria-label="YouTube" target="_blank" rel="noopener">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
            </a>
            <a href="${ZALO_URL}" aria-label="Zalo" target="_blank" rel="noopener">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 16.612a.672.672 0 0 1-.848.084l-2.761-1.892a.672.672 0 0 0-.74-.016l-3.133 1.985a.672.672 0 0 1-.94-.835l1.097-2.838a.672.672 0 0 0-.148-.713L7.69 10.476a.672.672 0 0 1 .475-1.147h2.981a.672.672 0 0 0 .627-.432l1.097-2.838a.672.672 0 0 1 1.258 0l1.097 2.838a.672.672 0 0 0 .627.432h2.981a.672.672 0 0 1 .475 1.147l-2.46 1.91a.672.672 0 0 0-.208.73l.922 2.836a.672.672 0 0 1-.2.66z"/></svg>
            </a>
          </div>
        </div>

        <div class="footer__col">
          <h4>Dịch Vụ</h4>
          <ul class="footer__links">
            <li><a href="/services">Landing Page từ 500K</a></li>
            <li><a href="/services">Website Doanh Nghiệp</a></li>
            <li><a href="/services">Website WordPress</a></li>
            <li><a href="/services">Website Thương Mại Điện Tử</a></li>
            <li><a href="/services">SEO &amp; Content Marketing</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>Tài Nguyên</h4>
          <ul class="footer__links">
            <li><a href="/blog">Blog Thiết Kế Web</a></li>
            <li><a href="/blog?category=kiem-tien-online">Kiếm Tiền Online</a></li>
            <li><a href="/blog?category=wordpress">WordPress Tutorial</a></li>
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
            <span>T2–T7: 8:00–20:00</span>
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
    <a href="${ZALO_URL}" class="float-cta__btn float-cta__zalo" target="_blank" rel="noopener" data-event="zalo_float">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/></svg>
      <span class="float-cta__label">Zalo ngay</span>
    </a>
    <a href="tel:${PHONE_RAW}" class="float-cta__btn float-cta__phone" data-event="call_float">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.32A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span class="float-cta__label">${PHONE}</span>
    </a>
  `;
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
});
