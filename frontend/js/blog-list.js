/* WebPro — Trang danh sách blog (dùng cho blog.html và trang /blog render từ server) */

let currentPage = 1;
let currentCat  = '';
let currentSearch = '';
const LIMIT = 9;

// Load categories
fetch('/api/blog/categories')
  .then(r => r.json())
  .then(cats => {
    // Category filter buttons
    const filterEl = document.getElementById('catFilter');
    cats.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'cat-filter__btn';
      btn.dataset.cat = c.slug;
      btn.textContent = `${c.icon} ${c.name}`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-filter__btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCat = c.slug;
        currentPage = 1;
        loadPosts();
      });
      filterEl.appendChild(btn);
    });

    // Sidebar categories
    const sidebarEl = document.getElementById('sidebarCats');
    sidebarEl.innerHTML = cats.map(c => `
      <a href="#" class="sidebar-cat" data-cat="${c.slug}">
        <span>${c.icon} ${c.name}</span>
        <span class="badge">${c.post_count}</span>
      </a>`).join('');

    sidebarEl.querySelectorAll('a[data-cat]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.cat-filter__btn').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === a.dataset.cat);
        });
        currentCat = a.dataset.cat;
        currentPage = 1;
        loadPosts();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      });
    });
  });

// Load popular posts for sidebar
fetch('/api/blog/posts?limit=5')
  .then(r => r.json())
  .then(data => {
    const el = document.getElementById('popularPosts');
    if (!data.posts?.length) { el.innerHTML = ''; return; }
    const sorted = [...data.posts].sort((a, b) => b.views - a.views).slice(0, 5);
    el.innerHTML = sorted.map(p => `
      <div class="sidebar-post">
        <img src="${p.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=150&q=60'}" alt="${p.title}" loading="lazy">
        <div>
          <div class="sidebar-post__title"><a href="/blog/${p.slug}">${p.title}</a></div>
          <div class="sidebar-post__meta">${formatNumber(p.views)} lượt xem</div>
        </div>
      </div>`).join('');
  });

// Load posts from URL params
const urlParams = new URLSearchParams(window.location.search);
if (parseInt(urlParams.get('page')) > 1) {
  currentPage = parseInt(urlParams.get('page'));
}
if (urlParams.get('category')) {
  currentCat = urlParams.get('category');
}
if (urlParams.get('search')) {
  currentSearch = urlParams.get('search');
  document.getElementById('searchInput').value = currentSearch;
}

function loadPosts() {
  const grid = document.getElementById('postsGrid');
  const info = document.getElementById('postInfo');
  if (grid.dataset.ssr) delete grid.dataset.ssr;
  else grid.innerHTML = '<div class="spinner" style="grid-column:1/-1"></div>';

  const params = new URLSearchParams({
    page: currentPage, limit: LIMIT,
    ...(currentCat && { category: currentCat }),
    ...(currentSearch && { search: currentSearch })
  });

  fetch(`/api/blog/posts?${params}`)
    .then(r => r.json())
    .then(data => {
      if (!data.posts?.length) {
        grid.innerHTML = `<div class="empty-state">
          <svg width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8.5 11h5"/></svg>
          <p>Không tìm thấy bài viết nào.</p>
        </div>`;
        info.textContent = '';
        renderPagination(0, 1);
        return;
      }
      info.textContent = `Hiển thị ${data.posts.length} / ${data.total} bài viết`;
      grid.innerHTML = data.posts.map(renderBlogCard).join('');
      renderPagination(data.pages, data.page);
    })
    .catch(() => {
      grid.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1">Không thể tải bài viết.</p>';
    });
}

function renderPagination(totalPages, currentP) {
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  let html = `<button class="pagination__btn" ${currentP <= 1 ? 'disabled' : ''} onclick="goPage(${currentP - 1})">← Trước</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && Math.abs(i - currentP) > 2 && i !== 1 && i !== totalPages) {
      if (i === currentP - 3 || i === currentP + 3) html += '<span style="padding:0 .3rem">…</span>';
      continue;
    }
    html += `<button class="pagination__btn ${i === currentP ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="pagination__btn" ${currentP >= totalPages ? 'disabled' : ''} onclick="goPage(${currentP + 1})">Sau →</button>`;
  el.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  loadPosts();
  window.scrollTo({ top: 200, behavior: 'smooth' });
}

// Search
document.getElementById('searchBtn').addEventListener('click', () => {
  currentSearch = document.getElementById('searchInput').value.trim();
  currentPage = 1;
  loadPosts();
});
document.getElementById('searchInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') document.getElementById('searchBtn').click();
});

loadPosts();
