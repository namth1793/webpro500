// Trang blog render phía server (SSR) — dùng lại layout, CSS và JS của frontend hiện tại.
// Navbar/footer vẫn do /js/common.js vẽ như mọi trang khác; nội dung bài nằm sẵn trong HTML cho Google đọc.
const sanitizeHtml = require('sanitize-html');
const { marked }   = require('marked');

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=70';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toDate(s) {
  if (!s) return null;
  // blog_posts lưu "YYYY-MM-DD HH:MM:SS" (UTC, CURRENT_TIMESTAMP); articles lưu ISO 8601
  const d = new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s) ? s.replace(' ', 'T') + 'Z' : s);
  return isNaN(d) ? null : d;
}

function formatDate(s) {
  const d = toDate(s);
  return d ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }) : '';
}

function isoDate(s) {
  const d = toDate(s);
  return d ? d.toISOString() : undefined;
}

function formatNumber(n) {
  n = Number(n) || 0;
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
}

function truncate(text, len = 140) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len).trim() + '…' : text;
}

// Lọc HTML từ Ryze: giữ các thẻ nội dung, bỏ script/style/event handler
const SANITIZE = {
  allowedTags: [
    'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'img', 'figure', 'figcaption', 'a', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark',
    'blockquote', 'pre', 'code', 'span', 'div',
  ],
  allowedAttributes: {
    a:   ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    th:  ['colspan', 'rowspan', 'scope'],
    td:  ['colspan', 'rowspan'],
    code: ['class'],
    pre:  ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    // h1 trong bài → h2 (trang đã có h1 là tiêu đề bài)
    h1: 'h2',
    a: (tag, attribs) => {
      if (/^https?:\/\//i.test(attribs.href || '') && attribs.target === '_blank') attribs.rel = 'noopener noreferrer';
      return { tagName: 'a', attribs };
    },
    img: (tag, attribs) => ({ tagName: 'img', attribs: { loading: 'lazy', ...attribs } }),
  },
};

function articleBodyHtml(article) {
  const raw = article.body_html || marked.parse(article.body_markdown || '');
  // Bọc bảng để cuộn ngang trên điện thoại
  return sanitizeHtml(raw, SANITIZE)
    .replace(/<table/g, '<div class="table-wrap"><table')
    .replace(/<\/table>/g, '</table></div>');
}

/* ── Layout chung ─────────────────────────────────────────────────── */
function layout({ title, description, canonical, image, ogType = 'website', jsonLd, active = 'blog', body, scripts = '', robots = 'index, follow' }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${robots}">
  ${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="WebPro">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  ${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
  ${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1872384049448380" crossorigin="anonymous"></script>
</head>
<body>

<nav id="navbar"></nav>

${body}

<footer id="footer"></footer>
<div class="float-cta" id="floatCta"></div>

<script src="/js/env.js"></script>
<script src="/js/common.js"></script>
<script>
renderNavbar('${active}');
renderFooter();
</script>
${scripts}
</body>
</html>`;
}

/* ── Thẻ bài (giống renderBlogCard trong common.js) ──────────────── */
function card(p) {
  const badge = p.category_name ? `<span class="badge">${esc(p.category_icon || '')} ${esc(p.category_name)}</span>` : '';
  return `
    <article class="blog-card spot">
      <div class="blog-card__media">
        <img class="blog-card__img" src="${esc(p.image_url || FALLBACK_IMG)}" alt="${esc(p.image_alt || p.title)}" loading="lazy">
      </div>
      <div class="blog-card__body">
        <div class="blog-card__meta">
          ${badge}
          <span class="blog-card__readtime">${esc(p.read_time || 5)} phút đọc</span>
        </div>
        <h3 class="blog-card__title"><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></h3>
        <p class="blog-card__excerpt">${esc(truncate(p.excerpt, 140))}</p>
        <div class="blog-card__footer">
          <span class="blog-card__date"><time datetime="${esc(isoDate(p.created_at) || '')}">${formatDate(p.created_at)}</time> · ${formatNumber(p.views)} lượt xem</span>
          <span class="blog-card__more">Đọc tiếp <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
      </div>
    </article>`;
}

const CTA_SECTION = (title, text) => `
<section class="cta-banner" style="padding:4rem 0">
  <div class="container">
    <h2>${title}</h2>
    <p>${text}</p>
    <div class="cta-banner__actions">
      <a href="/contact" class="btn btn--primary btn--lg">Tư Vấn Miễn Phí</a>
      <a href="/services" class="btn btn--outline-white btn--lg">Xem Bảng Giá</a>
    </div>
  </div>
</section>`;

/* ── GET /blog ────────────────────────────────────────────────────── */
function renderList({ siteUrl, data }) {
  const grid = data.posts.length
    ? data.posts.map(card).join('')
    : `<div class="empty-state"><p>Chưa có bài viết nào.</p></div>`;
  const cur = data.page;
  const link = (n, label, cls = '') => `<a class="pagination__btn ${cls}" href="/blog${n > 1 ? `?page=${n}` : ''}">${label}</a>`;
  const pages = data.pages > 1
    ? (cur > 1 ? link(cur - 1, '← Trước') : '') +
      Array.from({ length: data.pages }, (_, i) => link(i + 1, i + 1, i + 1 === cur ? 'active' : '')).join('') +
      (cur < data.pages ? link(cur + 1, 'Sau →') : '')
    : '';

  const body = `
<div class="page-hero">
  <div class="container">
    <h1>Blog WebPro</h1>
    <p>Kiến thức thiết kế web, kiếm tiền online, SEO và review công cụ cho doanh nghiệp Việt Nam</p>
  </div>
</div>

<section class="section" style="padding-top:2.5rem">
  <div class="container">
    <div class="blog-layout">
      <div>
        <div style="margin-bottom:1.5rem">
          <div class="search-box">
            <svg class="search-box__icon" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input type="text" id="searchInput" placeholder="Tìm kiếm bài viết..." class="form-input">
            <button class="btn btn--blue" id="searchBtn">Tìm</button>
          </div>
          <div class="cat-filter" id="catFilter">
            <button class="cat-filter__btn active" data-cat="">Tất Cả</button>
          </div>
        </div>
        <p class="text-muted text-sm mb-2" id="postInfo">Hiển thị ${data.posts.length} / ${data.total} bài viết</p>
        <div class="grid-3" id="postsGrid" data-ssr="1">${grid}
        </div>
        <div class="pagination" id="pagination">${pages}</div>
      </div>

      <aside class="blog-sidebar">
        <div class="sidebar-cta">
          <h3>Cần Website Giá Rẻ?</h3>
          <p>Từ 500K — bàn giao trong 24–48 giờ, tối ưu SEO sẵn.</p>
          <a href="/contact" class="btn btn--primary btn--full btn--sm">Tư Vấn Miễn Phí</a>
        </div>
        <div class="sidebar-widget">
          <h3>Danh Mục</h3>
          <div id="sidebarCats"><div class="spinner"></div></div>
        </div>
        <div class="sidebar-widget">
          <h3>Bài Viết Nổi Bật</h3>
          <div id="popularPosts"><div class="spinner"></div></div>
        </div>
      </aside>
    </div>
  </div>
</section>
${CTA_SECTION('Cần Website Để Chạy AdSense &amp; Affiliate?', 'WebPro thiết kế website chuẩn SEO, tích hợp sẵn vị trí đặt quảng cáo và affiliate links.')}`;

  return layout({
    title: 'Blog — Thiết Kế Web, Kiếm Tiền Online, SEO | WebPro',
    description: 'Blog kiến thức về thiết kế website, kiếm tiền online với AdSense và affiliate marketing, hướng dẫn SEO, review công cụ làm web.',
    canonical: `${siteUrl}/blog`,
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog WebPro',
      url: `${siteUrl}/blog`,
      blogPost: data.posts.map(p => ({
        '@type': 'BlogPosting',
        headline: p.title,
        url: `${siteUrl}/blog/${p.slug}`,
        datePublished: isoDate(p.created_at),
      })),
    },
    scripts: '<script src="/js/blog-list.js"></script>',
  });
}

/* ── GET /blog/:slug ──────────────────────────────────────────────── */
function relatedSidebar(related) {
  if (!related.length) return '<p class="text-muted text-sm">Chưa có bài liên quan.</p>';
  return related.map(p => `
    <div class="sidebar-post">
      <img src="${esc(p.image_url || FALLBACK_IMG)}" alt="${esc(p.title)}" loading="lazy">
      <div>
        <div class="sidebar-post__title"><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></div>
        <div class="sidebar-post__meta">${formatDate(p.created_at)}</div>
      </div>
    </div>`).join('');
}

// post: bản ghi đã chuẩn hoá (xem server.js) — source 'ryze' | 'post'
function renderPost({ siteUrl, post, related }) {
  const url   = `${siteUrl}/blog/${post.slug}`;
  const title = post.meta_title || post.title;
  const desc  = post.meta_description || post.excerpt || '';
  const isRyze = post.source === 'ryze';
  const content = isRyze ? articleBodyHtml(post) : (post.content || '');
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(post.title);

  const tags = (post.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    .map(t => `<a href="/blog?search=${encodeURIComponent(t)}" class="tag">${esc(t)}</a>`).join('');

  const comments = isRyze ? '' : `
          <div class="comments-section" id="commentsSection">
            <h2 class="comments-title">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Bình Luận (<span id="commentCount">0</span>)
            </h2>
            <div id="commentsList"></div>
            <div class="comment-form-wrap">
              <h3>Để lại bình luận của bạn</h3>
              <form id="commentForm" onsubmit="submitComment(event)">
                <div class="grid-2" style="gap:1rem;margin-bottom:1rem">
                  <div>
                    <label class="form-label">Tên của bạn *</label>
                    <input class="form-input" id="cmtName" placeholder="Nguyễn Văn A" maxlength="60" required>
                  </div>
                  <div>
                    <label class="form-label">Email <span style="color:var(--muted);font-weight:400">(không bắt buộc)</span></label>
                    <input class="form-input" id="cmtEmail" type="email" placeholder="email@gmail.com" maxlength="100">
                  </div>
                </div>
                <div style="margin-bottom:1rem">
                  <label class="form-label">Nội dung bình luận *</label>
                  <textarea class="form-textarea" id="cmtContent" rows="4" placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..." maxlength="1000" required
                    oninput="document.getElementById('cmtCharCount').textContent=this.value.length"></textarea>
                  <div class="comment-char"><span id="cmtCharCount">0</span>/1000 ký tự</div>
                </div>
                <button type="submit" class="btn btn--primary" id="cmtSubmitBtn">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Gửi Bình Luận
                </button>
              </form>
            </div>
          </div>`;

  const body = `
<section class="section" style="padding-top:2rem">
  <div class="container">
    <div class="blog-layout">
      <article${isRyze ? '' : ` data-post-id="${post.id}"`}>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Trang Chủ</a><span class="breadcrumb__sep">›</span>
          <a href="/blog">Blog</a><span class="breadcrumb__sep">›</span>
          <span>${esc(post.category_name || 'Blog')}</span>
        </nav>

        <header class="article-header">
          ${post.category_name ? `<div style="margin-bottom:.75rem"><span class="badge">${esc(post.category_icon || '')} ${esc(post.category_name)}</span></div>` : ''}
          <h1 class="article-header__title">${esc(post.title)}</h1>
          <div class="article-meta">
            <span>${esc(post.author || 'WebPro Team')}</span>
            <span class="article-meta__sep">·</span>
            <time datetime="${esc(isoDate(post.published_at) || '')}">${formatDate(post.published_at)}</time>
            <span class="article-meta__sep">·</span>
            <span>${esc(post.read_time || 5)} phút đọc</span>
            ${isRyze ? '' : `<span class="article-meta__sep">·</span><span>${formatNumber(post.views)} lượt xem</span>`}
          </div>
        </header>

        ${post.image_url ? `<img class="article-hero-img" src="${esc(post.image_url)}" alt="${esc(post.image_alt || post.title)}">` : ''}

        ${isRyze ? '' : `<div class="article-notice"><em>Bài viết có thể chứa affiliate links. Nếu bạn mua qua link, chúng tôi nhận được hoa hồng mà không tốn thêm chi phí của bạn.</em></div>`}

        <div class="article-content">${content}</div>

        <div class="article-cta-box">
          <h3>Cần Website Để Áp Dụng Những Kiến Thức Này?</h3>
          <p>WebPro thiết kế website chuyên nghiệp — chuẩn SEO, tối ưu AdSense, mobile-first.</p>
          <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">
            <a href="/contact" class="btn btn--primary">Tư Vấn Miễn Phí</a>
            <a href="/services" class="btn btn--outline">Xem Bảng Giá</a>
          </div>
        </div>

        ${tags ? `<div style="margin:1.5rem 0"><strong class="text-sm" style="color:var(--muted)">Tags: </strong><span class="tag-list">${tags}</span></div>` : ''}

        <div class="share-box">
          <p>Bài viết hữu ích? Chia sẻ cho bạn bè nhé!</p>
          <div class="share-box__actions">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener" class="btn btn--sm btn--primary">Facebook</a>
            <a href="https://twitter.com/intent/tweet?url=${shareUrl}&amp;text=${shareTitle}" target="_blank" rel="noopener" class="btn btn--sm btn--primary">Twitter</a>
            <button onclick="copyLink()" class="btn btn--sm btn--outline">Copy Link</button>
          </div>
        </div>
        ${comments}
      </article>

      <aside class="blog-sidebar">
        <div class="sidebar-cta">
          <h3>Làm Website Từ 1.000.000đ</h3>
          <p>Bàn giao 48h, chuẩn SEO, hỗ trợ 24/7.</p>
          <a href="/contact" class="btn btn--primary btn--full btn--sm">Tư Vấn Ngay</a>
        </div>
        <div class="sidebar-widget">
          <h3>Bài Viết Liên Quan</h3>
          ${relatedSidebar(related)}
        </div>
      </aside>
    </div>

    ${related.length >= 2 ? `
    <div style="margin-top:4rem">
      <div class="section-header section-header--left"><span class="eyebrow">Đọc thêm</span><h2>Bài Viết Liên Quan</h2></div>
      <div class="grid-3">${related.map(card).join('')}</div>
    </div>` : ''}
  </div>
</section>
${CTA_SECTION('Bạn Muốn Website Như Thế Này?', 'WebPro thiết kế website đẹp, nhanh, chuẩn SEO cho doanh nghiệp của bạn.')}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: desc || undefined,
    image: post.image_url ? [post.image_url] : undefined,
    datePublished: isoDate(post.published_at),
    dateModified: isoDate(post.updated_at) || isoDate(post.published_at),
    author: { '@type': 'Organization', name: post.author || 'WebPro' },
    publisher: { '@type': 'Organization', name: 'WebPro', url: siteUrl },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: post.primary_keyword || post.tags || undefined,
  };

  return layout({
    title: `${title}${isRyze ? '' : ' | WebPro Blog'}`,
    description: desc,
    canonical: url,
    image: post.image_url,
    ogType: 'article',
    jsonLd,
    body,
    scripts: '<script src="/js/post-page.js"></script>',
  });
}

/* ── 404 ──────────────────────────────────────────────────────────── */
function renderNotFound() {
  return layout({
    title: 'Không tìm thấy bài viết | WebPro',
    description: 'Bài viết không tồn tại hoặc đã bị xoá.',
    robots: 'noindex, follow',
    body: `
<section class="section">
  <div class="container" style="text-align:center;padding:3rem 0">
    <svg width="56" height="56" fill="none" stroke="var(--navy)" stroke-width="1.6" viewBox="0 0 24 24" style="margin:0 auto 1rem"><circle cx="12" cy="12" r="9"/><path d="M9 9h.01M15 9h.01M8 16c1.2-1.3 2.5-2 4-2s2.8.7 4 2"/></svg>
    <h1 style="font-size:2rem">Bài viết không tìm thấy</h1>
    <p class="text-muted mt-2">Bài viết này có thể đã bị xóa hoặc URL không đúng.</p>
    <a href="/blog" class="btn btn--blue mt-4">← Về Trang Blog</a>
  </div>
</section>`,
  });
}

module.exports = { renderList, renderPost, renderNotFound, isoDate };
