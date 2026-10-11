// Danh sách bài blog đã xuất bản: gộp bài viết nội bộ (blog_posts) và bài từ Ryze (articles)
const db = require('../db/database');

const MERGED = `
  SELECT p.id, 'post' AS source, p.title, p.slug, p.excerpt, p.image_url, NULL AS image_alt,
         p.read_time, p.views, p.tags, p.is_featured,
         p.created_at, p.updated_at,
         c.name AS category_name, c.slug AS category_slug,
         c.color AS category_color, c.icon AS category_icon
  FROM blog_posts p
  LEFT JOIN blog_categories c ON c.id = p.category_id
  WHERE p.is_published = 1
  UNION ALL
  SELECT a.id, 'ryze' AS source, a.title, a.slug, a.excerpt, a.image_url, a.image_alt,
         a.read_time, 0 AS views, a.primary_keyword AS tags, 0 AS is_featured,
         a.published_at AS created_at, a.updated_at,
         NULL, NULL, NULL, NULL
  FROM articles a
  WHERE a.status = 'published'
`;

function listPublished({ page = 1, limit = 9, category = '', search = '', featured = false } = {}) {
  const where = ['1 = 1'];
  const params = [];
  if (category) { where.push('m.category_slug = ?'); params.push(category); }
  if (search) {
    where.push('(m.title LIKE ? OR m.excerpt LIKE ? OR m.tags LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (featured) where.push('m.is_featured = 1');
  const w = where.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) AS n FROM (${MERGED}) m WHERE ${w}`).get(...params).n;
  const offset = (page - 1) * limit;
  const posts = db.prepare(`
    SELECT * FROM (${MERGED}) m WHERE ${w}
    ORDER BY datetime(m.created_at) DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return { posts, total, page, limit, pages: Math.ceil(total / limit) };
}

function allForSitemap() {
  return db.prepare(`SELECT slug, updated_at, created_at FROM (${MERGED}) ORDER BY datetime(created_at) DESC`).all();
}

module.exports = { listPublished, allForSitemap };
