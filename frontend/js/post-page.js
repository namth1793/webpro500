/* WebPro — Trang chi tiết bài viết: copy link + bình luận */

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => showToast('✅ Đã copy link!', 'success'))
    .catch(() => showToast('Copy thất bại.', 'error'));
}

// ── Comments ───────────────────────────────────────────────────────
let currentPostId = null;

const AVATAR_COLORS = ['#0C3A76', '#082a57', '#1d4f8f', '#061d3d'];

function avatarColor(name) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'Vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' ngày trước';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function renderComments(comments) {
  const el = document.getElementById('commentsList');
  document.getElementById('commentCount').textContent = comments.length;
  if (!comments.length) {
    el.innerHTML = '<div class="comment-empty">Chưa có bình luận nào. Hãy là người đầu tiên!</div>';
    return;
  }
  el.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-avatar" style="background:${avatarColor(c.name)}">${c.name.charAt(0).toUpperCase()}</div>
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-name">${escHtml(c.name)}</span>
          <span class="comment-date">${timeAgo(c.created_at)}</span>
        </div>
        <div class="comment-content">${escHtml(c.content)}</div>
      </div>
    </div>`).join('');
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loadComments(postId) {
  fetch(`/api/comments/post/${postId}`)
    .then(r => r.json())
    .then(renderComments)
    .catch(() => {});
}

async function submitComment(e) {
  e.preventDefault();
  const btn  = document.getElementById('cmtSubmitBtn');
  const name = document.getElementById('cmtName').value.trim();
  const content = document.getElementById('cmtContent').value.trim();

  btn.disabled = true;
  btn.textContent = 'Đang gửi...';

  try {
    const res  = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: currentPostId, name, content }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('❌ ' + (data.error || 'Lỗi gửi bình luận.'), 'error'); return; }

    document.getElementById('commentForm').reset();
    document.getElementById('cmtCharCount').textContent = '0';
    showToast('✅ Bình luận đã được đăng!', 'success');
    loadComments(currentPostId);
  } catch {
    showToast('❌ Không thể gửi bình luận, thử lại sau.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Gửi Bình Luận';
  }
}

// Trang bài viết render từ server: <article data-post-id="..."> bật phần bình luận
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('[data-post-id]');
  if (!el) return;
  currentPostId = Number(el.dataset.postId);
  loadComments(currentPostId);
});
