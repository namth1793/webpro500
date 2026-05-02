const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'webpro.db'));
db.pragma('journal_mode = WAL');

// ── Core tables ────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    phone        TEXT NOT NULL,
    service_type TEXT,
    message      TEXT,
    status       TEXT DEFAULT 'new',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS demo_sites (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT,
    theme       TEXT DEFAULT 'blue',
    hero_text   TEXT,
    is_active   INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    image_url   TEXT,
    demo_url    TEXT,
    tech_stack  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blog_categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    color       TEXT DEFAULT '#2563eb',
    icon        TEXT DEFAULT '📝',
    post_count  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    excerpt         TEXT,
    content         TEXT,
    category_id     INTEGER,
    author          TEXT DEFAULT 'WebPro Team',
    image_url       TEXT,
    seo_title       TEXT,
    seo_description TEXT,
    seo_keywords    TEXT,
    is_published    INTEGER DEFAULT 1,
    is_featured     INTEGER DEFAULT 0,
    views           INTEGER DEFAULT 0,
    read_time       INTEGER DEFAULT 5,
    tags            TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES blog_categories(id)
  );
`);

// ── Migrations for existing databases ─────────────────────────────
const demoCols = db.pragma('table_info(demo_sites)').map(c => c.name);
if (!demoCols.includes('image_url'))  db.exec('ALTER TABLE demo_sites ADD COLUMN image_url TEXT');
if (!demoCols.includes('demo_url'))   db.exec('ALTER TABLE demo_sites ADD COLUMN demo_url TEXT');
if (!demoCols.includes('tech_stack')) db.exec('ALTER TABLE demo_sites ADD COLUMN tech_stack TEXT');

// ── Seed admin ─────────────────────────────────────────────────────
if (!db.prepare('SELECT id FROM admins WHERE username = ?').get('admin')) {
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
    .run('admin', bcrypt.hashSync('admin123', 10));
}

// ── Seed demo sites ────────────────────────────────────────────────
if (db.prepare('SELECT COUNT(*) as c FROM demo_sites').get().c === 0) {
  const ins = db.prepare(`
    INSERT INTO demo_sites (title, category, description, image_url, demo_url, tech_stack, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['Website Spa & Beauty', 'Spa / Salon', 'Giao diện sang trọng, đặt lịch online, gallery dịch vụ, mobile-first.', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80', '#', 'HTML/CSS/JS', 1],
    ['Landing Page Bán Hàng', 'E-commerce', 'Trang bán sản phẩm chuyển đổi cao, form đặt hàng, SEO tối ưu.', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80', '#', 'WordPress + WooCommerce', 2],
    ['Website Doanh Nghiệp', 'Corporate', 'Website chuyên nghiệp 5 trang, blog tin tức, form liên hệ.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', '#', 'React + Node.js', 3],
    ['Website Nhà Hàng', 'Food & Beverage', 'Menu online, đặt bàn, gallery món ăn, Google Maps tích hợp.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80', '#', 'HTML/CSS/JS', 4],
    ['Blog & Portfolio Cá Nhân', 'Blog / Portfolio', 'Showcase tác phẩm, blog cá nhân, CV online chuyên nghiệp.', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80', '#', 'WordPress', 5],
    ['Website Bất Động Sản', 'Real Estate', 'Đăng tin BĐS, tìm kiếm nâng cao, bản đồ tích hợp, CRM.', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80', '#', 'React + Node.js', 6],
  ].forEach(row => ins.run(...row));
}

// ── Seed blog categories ───────────────────────────────────────────
if (db.prepare('SELECT COUNT(*) as c FROM blog_categories').get().c === 0) {
  const ins = db.prepare('INSERT INTO blog_categories (name, slug, description, color, icon) VALUES (?, ?, ?, ?, ?)');
  [
    ['Thiết Kế Website', 'thiet-ke-website', 'Hướng dẫn làm website, landing page, thiết kế web chuyên nghiệp', '#2563eb', '🌐'],
    ['Kiếm Tiền Online', 'kiem-tien-online', 'AdSense, affiliate marketing, blog monetization, thu nhập thụ động', '#059669', '💰'],
    ['WordPress', 'wordpress', 'Tutorial WordPress, plugin, theme, tối ưu tốc độ và SEO', '#7c3aed', '📝'],
    ['Review Công Cụ', 'review-cong-cu', 'Đánh giá hosting, theme, plugin, công cụ thiết kế và marketing', '#dc2626', '🔧'],
  ].forEach(row => ins.run(...row));
}

// ── Seed blog posts ────────────────────────────────────────────────
if (db.prepare('SELECT COUNT(*) as c FROM blog_posts').get().c === 0) {
  const getcat = db.prepare('SELECT id FROM blog_categories WHERE slug = ?');
  const ins = db.prepare(`
    INSERT INTO blog_posts
      (title, slug, excerpt, content, category_id, image_url,
       seo_title, seo_description, seo_keywords,
       is_featured, read_time, tags, views)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const posts = [
    {
      title: 'Làm Website Giá Rẻ Cho Doanh Nghiệp Nhỏ: Tất Cả Những Gì Bạn Cần Biết',
      slug: 'lam-website-gia-re-cho-doanh-nghiep-nho',
      excerpt: 'Muốn có website cho shop, salon hoặc doanh nghiệp nhỏ nhưng lo ngại chi phí? Bài viết này giải đáp toàn bộ câu hỏi về làm website giá rẻ, từ chi phí thực tế đến lựa chọn đúng đắn nhất.',
      cat: 'thiet-ke-website',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
      seo_title: 'Làm Website Giá Rẻ Từ 500K — Giải Pháp Tốt Nhất Cho Doanh Nghiệp Nhỏ 2024',
      seo_desc: 'Làm website giá rẻ chuyên nghiệp từ 500.000đ cho shop online, spa, salon. So sánh chi phí, lựa chọn nền tảng và những điều cần tránh khi thuê làm web.',
      seo_kw: 'làm website giá rẻ, thiết kế website giá rẻ, website doanh nghiệp nhỏ',
      featured: 1, read_time: 7, tags: 'website,giá rẻ,doanh nghiệp nhỏ,thiết kế web', views: 1243,
      content: `<h2>Tại Sao Doanh Nghiệp Nhỏ Cần Website Ngay Hôm Nay?</h2>
<p>Theo thống kê, <strong>97% người tiêu dùng</strong> tìm kiếm thông tin doanh nghiệp trên Google trước khi quyết định mua hàng. Không có website, bạn đang vô hình với phần lớn khách hàng tiềm năng.</p>
<p>Tin tốt là: <strong>làm website giá rẻ không còn là điều xa xỉ</strong>. Với ngân sách từ 500.000đ, bạn đã có thể sở hữu một website chuyên nghiệp, chạy tốt trên điện thoại và được tối ưu SEO cơ bản.</p>

<h2>Chi Phí Làm Website Thực Tế 2024</h2>
<p>Giá làm website phụ thuộc vào loại website và đơn vị thiết kế:</p>
<table>
  <thead><tr><th>Loại Website</th><th>Chi Phí Từ</th><th>Phù Hợp Với</th></tr></thead>
  <tbody>
    <tr><td>Landing Page đơn giản</td><td>500.000đ</td><td>Shop online nhỏ, dịch vụ cá nhân</td></tr>
    <tr><td>Website cơ bản 5–10 trang</td><td>1.000.000đ</td><td>Salon, spa, doanh nghiệp nhỏ</td></tr>
    <tr><td>WordPress đầy đủ + Blog</td><td>2.000.000đ</td><td>Doanh nghiệp vừa, affiliate blog</td></tr>
    <tr><td>Website thương mại điện tử</td><td>5.000.000đ+</td><td>Shop online chuyên nghiệp</td></tr>
  </tbody>
</table>

<div class="affiliate-box">
  <h3>🔧 Công Cụ Làm Web Được Khuyến Nghị</h3>
  <p>Nếu bạn muốn tự làm hoặc tiết kiệm chi phí hosting:</p>
  <ul>
    <li><a href="#" rel="nofollow sponsored"><strong>Hostinger</strong></a> — Hosting giá rẻ nhất, từ 29.000đ/tháng, tốc độ tốt</li>
    <li><a href="#" rel="nofollow sponsored"><strong>WordPress.org</strong></a> — Nền tảng website phổ biến nhất thế giới, miễn phí</li>
    <li><a href="#" rel="nofollow sponsored"><strong>Elementor</strong></a> — Page builder kéo thả dễ dùng, có bản miễn phí</li>
  </ul>
</div>

<h2>5 Loại Website Phổ Biến Cho Doanh Nghiệp Nhỏ</h2>

<h3>1. Landing Page — Tiết Kiệm Nhất</h3>
<p>Chỉ 1 trang duy nhất, tập trung vào một mục tiêu. Landing page tốt cần: giới thiệu dịch vụ, social proof, form liên hệ và nút call-to-action nổi bật. Phù hợp cho shop, dịch vụ tư nhân, chạy quảng cáo.</p>

<h3>2. Website Giới Thiệu Doanh Nghiệp</h3>
<p>5–10 trang: Trang chủ, Giới thiệu, Dịch vụ, Dự án, Liên hệ. Xây dựng uy tín thương hiệu và giúp khách hàng tìm thấy bạn trên Google.</p>

<h3>3. Website Bán Hàng Online</h3>
<p>Tích hợp giỏ hàng, thanh toán online. WordPress + WooCommerce là giải pháp cost-effective nhất, chi phí hàng năm thấp, tính năng đầy đủ.</p>

<h3>4. Blog Doanh Nghiệp</h3>
<p>Xây dựng authority SEO dài hạn. Mỗi bài viết tốt là một cơ hội tìm kiếm khách hàng miễn phí từ Google. ROI rất cao về dài hạn.</p>

<h3>5. Portfolio / CV Online</h3>
<p>Cho freelancer, creative, photographer muốn showcase tác phẩm một cách chuyên nghiệp.</p>

<h2>Những Điều Cần Kiểm Tra Khi Thuê Làm Website</h2>
<ol>
  <li><strong>Xem portfolio thực tế</strong> — Website đã làm có đẹp và load nhanh không?</li>
  <li><strong>Chi phí hosting + domain hàng năm</strong> — Có thay đổi sau bàn giao không?</li>
  <li><strong>Responsive mobile</strong> — 80% traffic từ điện thoại, phải hiển thị tốt</li>
  <li><strong>Tốc độ tải trang</strong> — Mục tiêu &lt;3 giây, ảnh hưởng trực tiếp đến SEO</li>
  <li><strong>Bảo hành sửa lỗi</strong> — Có hỗ trợ kỹ thuật sau bàn giao không?</li>
  <li><strong>Quyền sở hữu code</strong> — Bạn có toàn quyền sở hữu không?</li>
</ol>

<h2>Kết Luận</h2>
<p>Làm website giá rẻ là hoàn toàn khả thi với ngân sách từ 500.000đ. Điều quan trọng là <strong>chọn đúng loại website phù hợp với mục tiêu kinh doanh</strong>, không phải cái đắt tiền nhất.</p>
<p>Bạn cần tư vấn website phù hợp với ngân sách? <a href="/contact">Liên hệ WebPro</a> để được tư vấn miễn phí trong 30 phút!</p>`
    },
    {
      title: 'Google AdSense Là Gì? Cách Kiếm Tiền Thụ Động Từ Website 2024',
      slug: 'google-adsense-la-gi-cach-kiem-tien',
      excerpt: 'Google AdSense là cách kiếm tiền thụ động phổ biến nhất từ website. Tìm hiểu cách đăng ký, điều kiện phê duyệt, vị trí đặt quảng cáo tối ưu và chiến lược tăng doanh thu.',
      cat: 'kiem-tien-online',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80',
      seo_title: 'Google AdSense Là Gì? Hướng Dẫn Đăng Ký & Kiếm Tiền Từ Website 2024',
      seo_desc: 'Hướng dẫn đầy đủ về Google AdSense: cách đăng ký, điều kiện phê duyệt, vị trí đặt quảng cáo tối ưu và bí quyết tăng doanh thu AdSense cho người Việt.',
      seo_kw: 'google adsense là gì, kiếm tiền adsense, đăng ký adsense việt nam',
      featured: 1, read_time: 8, tags: 'adsense,kiếm tiền online,quảng cáo,monetization', views: 2156,
      content: `<h2>Google AdSense Là Gì?</h2>
<p><strong>Google AdSense</strong> là chương trình quảng cáo của Google, cho phép chủ website kiếm tiền bằng cách hiển thị quảng cáo. Mỗi khi người dùng xem hoặc click vào quảng cáo, bạn nhận được một khoản tiền.</p>
<p>Đây là hình thức kiếm tiền thụ động phổ biến nhất — bạn không cần bán sản phẩm, chỉ cần tạo ra nội dung thu hút người đọc.</p>

<h2>AdSense Hoạt Động Như Thế Nào?</h2>
<ol>
  <li>Đăng ký tài khoản AdSense và nhúng code vào website</li>
  <li>Google phân tích nội dung trang và hiển thị quảng cáo phù hợp</li>
  <li>Bạn kiếm tiền mỗi khi có impression (CPM) hoặc click (CPC)</li>
  <li>Google thanh toán hàng tháng khi số dư đạt $100</li>
</ol>

<h2>Điều Kiện Để Được Duyệt AdSense</h2>

<h3>Về Nội Dung</h3>
<ul>
  <li>Ít nhất <strong>20–30 bài viết</strong> chất lượng, không sao chép</li>
  <li>Mỗi bài tối thiểu 500 từ, có giá trị thực sự cho người đọc</li>
  <li>Không vi phạm chính sách Google: không spam, không người lớn</li>
</ul>

<h3>Về Kỹ Thuật</h3>
<ul>
  <li>Domain riêng (.com, .vn, .net...)</li>
  <li>Có trang <em>Privacy Policy</em>, <em>About</em>, <em>Contact</em></li>
  <li>Website load nhanh, giao diện thân thiện người dùng</li>
  <li>Hoạt động ít nhất 3–6 tháng (khuyến nghị)</li>
</ul>

<h2>Thu Nhập Thực Tế Từ AdSense</h2>

<div class="affiliate-box">
  <h3>💡 Ước Tính Thu Nhập</h3>
  <p>Công thức: <strong>Thu nhập = Pageviews × RPM / 1.000</strong></p>
  <ul>
    <li>10.000 views/tháng × RPM $2 = <strong>$20/tháng</strong></li>
    <li>50.000 views/tháng × RPM $2 = <strong>$100/tháng</strong></li>
    <li>200.000 views/tháng × RPM $3 = <strong>$600/tháng</strong></li>
  </ul>
  <p>RPM phụ thuộc niche: Tài chính/luật/bảo hiểm = $5–15. Giải trí/tin tức = $0.5–2.</p>
</div>

<h2>Vị Trí Đặt Quảng Cáo AdSense Tối Ưu</h2>

<h3>1. Trên Nội Dung (Above the Fold)</h3>
<p>Ngay sau tiêu đề bài viết — vị trí có <strong>CTR cao nhất</strong>, người dùng thấy ngay khi vào trang.</p>

<h3>2. Trong Bài Viết (In-Article)</h3>
<p>Xen kẽ sau đoạn 2–3. Google có loại quảng cáo "In-article" native, hoà vào nội dung tự nhiên hơn.</p>

<h3>3. Cuối Bài Viết</h3>
<p>Sau khi người đọc xong bài, đây là thời điểm họ sẵn sàng tương tác với quảng cáo nhất.</p>

<h3>4. Sidebar</h3>
<p>Cột bên phải, kích thước 300×250 hoặc 300×600. Hiệu quả trên desktop.</p>

<h2>Bí Quyết Tăng Thu Nhập AdSense</h2>
<ol>
  <li><strong>Chọn niche có CPC cao</strong> — Tài chính, bảo hiểm, bất động sản, phần mềm</li>
  <li><strong>Dùng Auto Ads</strong> — Google tự tìm vị trí tốt nhất cho từng trang</li>
  <li><strong>Tăng traffic organic</strong> — SEO đúng cách, content dài và có chiều sâu</li>
  <li><strong>A/B test vị trí quảng cáo</strong> — Thử nghiệm để tìm layout tối ưu</li>
  <li><strong>Mobile optimization</strong> — 70% traffic từ điện thoại, responsive là bắt buộc</li>
</ol>

<h2>Lỗi Phổ Biến Cần Tránh</h2>
<ul>
  <li>❌ Click vào quảng cáo của chính mình → bị ban vĩnh viễn</li>
  <li>❌ Đặt quá nhiều quảng cáo → Google penalize, UX kém</li>
  <li>❌ Dùng pop-up che nội dung → vi phạm policy</li>
  <li>❌ Traffic từ bot hoặc click farm → tài khoản bị xóa</li>
</ul>

<h2>Kết Luận</h2>
<p>AdSense là nền tảng kiếm tiền thụ động tuyệt vời nhưng cần thời gian xây dựng. Hãy tập trung vào <strong>nội dung chất lượng + SEO tốt</strong>, doanh thu sẽ tăng theo traffic.</p>
<p>Cần website chuẩn SEO để chạy AdSense? <a href="/services">Xem gói thiết kế web của WebPro</a> — bàn giao trong 48 giờ!</p>`
    },
    {
      title: 'Affiliate Marketing Là Gì? Hướng Dẫn Kiếm Tiền Tiếp Thị Liên Kết Từ Zero',
      slug: 'affiliate-marketing-la-gi-huong-dan-tu-zero',
      excerpt: 'Affiliate marketing là cách kiếm tiền thụ động bền vững nhất online. Tìm hiểu cách bắt đầu từ zero, chọn niche đúng, platform phù hợp và xây dựng thu nhập ổn định.',
      cat: 'kiem-tien-online',
      image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&q=80',
      seo_title: 'Affiliate Marketing Là Gì? Hướng Dẫn Toàn Diện Cho Người Mới 2024',
      seo_desc: 'Affiliate marketing là gì, cách bắt đầu từ zero, chọn nền tảng affiliate tốt nhất cho người Việt và xây dựng thu nhập thụ động bền vững từ tiếp thị liên kết.',
      seo_kw: 'affiliate marketing là gì, tiếp thị liên kết, kiếm tiền affiliate',
      featured: 1, read_time: 10, tags: 'affiliate marketing,kiếm tiền online,thu nhập thụ động', views: 3421,
      content: `<h2>Affiliate Marketing Là Gì?</h2>
<p><strong>Affiliate marketing (tiếp thị liên kết)</strong> là hình thức bạn giới thiệu sản phẩm/dịch vụ của người khác và nhận hoa hồng khi có người mua thông qua link của bạn.</p>
<p>Đây là mô hình kinh doanh Win-Win: công ty có thêm khách hàng, bạn có thu nhập mà không cần tạo sản phẩm, không cần vốn, không cần kho hàng.</p>

<h2>Cơ Chế Hoạt Động</h2>
<ol>
  <li>Đăng ký làm affiliate của một công ty/nền tảng</li>
  <li>Nhận affiliate link cá nhân hóa</li>
  <li>Chia sẻ link qua blog, YouTube, mạng xã hội...</li>
  <li>Khi ai click link và mua hàng → bạn nhận hoa hồng</li>
  <li>Thanh toán định kỳ theo tháng hoặc khi đạt ngưỡng tối thiểu</li>
</ol>

<h2>Các Nền Tảng Affiliate Tốt Nhất Cho Người Việt</h2>

<div class="affiliate-box">
  <h3>🔗 Top Affiliate Programs Đang Hoạt Động Tốt</h3>
  <ul>
    <li><a href="#" rel="nofollow sponsored"><strong>Accesstrade Vietnam</strong></a> — Lớn nhất VN, Shopee/Lazada/Tiki, hoa hồng 2–15%</li>
    <li><a href="#" rel="nofollow sponsored"><strong>Hostinger Affiliate</strong></a> — Hosting, hoa hồng 60%, EPC cao, cookie 30 ngày</li>
    <li><a href="#" rel="nofollow sponsored"><strong>Amazon Associates</strong></a> — Uy tín số 1 thế giới, 1–10%, phù hợp blog tiếng Anh</li>
    <li><a href="#" rel="nofollow sponsored"><strong>ClickBank</strong></a> — Digital products, hoa hồng 40–75%</li>
    <li><a href="#" rel="nofollow sponsored"><strong>ShareASale</strong></a> — Hàng nghìn merchant, đa dạng ngành</li>
  </ul>
</div>

<h2>5 Bước Bắt Đầu Affiliate Marketing Từ Zero</h2>

<h3>Bước 1: Chọn Niche Có Hoa Hồng Cao</h3>
<p>Các niche có ROI tốt nhất:</p>
<ul>
  <li>💻 <strong>Phần mềm / Hosting / SaaS</strong> — Hoa hồng recurring, cao nhất</li>
  <li>💰 <strong>Tài chính / Đầu tư</strong> — CPC và hoa hồng rất cao</li>
  <li>❤️ <strong>Sức khỏe / Làm đẹp</strong> — Thị trường lớn, sản phẩm liên tục</li>
  <li>✈️ <strong>Du lịch</strong> — Commission cao, booking lớn</li>
  <li>📚 <strong>Giáo dục / Khóa học</strong> — Digital product, hoa hồng 30–50%</li>
</ul>

<h3>Bước 2: Xây Dựng Kênh Content</h3>
<ul>
  <li><strong>Blog/Website</strong> — Bền vững nhất, SEO tốt, traffic organic miễn phí</li>
  <li><strong>YouTube</strong> — Review sản phẩm, tutorial, hiệu quả cao</li>
  <li><strong>Facebook</strong> — Group/Page, tiếp cận nhanh thị trường Việt</li>
  <li><strong>TikTok</strong> — Viral nhanh, phù hợp sản phẩm visual</li>
</ul>

<h3>Bước 3: Tạo Nội Dung Giá Trị Thực</h3>
<p>Các dạng content affiliate hiệu quả nhất:</p>
<ol>
  <li>Review chi tiết + trung thực (đã dùng thực tế)</li>
  <li>So sánh A vs B (ví dụ: "Hostinger vs Bluehost")</li>
  <li>Best-of list ("Top 10 hosting giá rẻ...")</li>
  <li>Tutorial có dùng sản phẩm affiliate</li>
  <li>Case study + kết quả thực tế</li>
</ol>

<h3>Bước 4: Đặt Link Đúng Cách</h3>
<p>Rule vàng: <strong>đặt link tự nhiên, hữu ích, đúng context</strong>. Không spam link, không review sản phẩm chưa dùng chỉ để kiếm hoa hồng — mất trust lâu dài.</p>
<p>Luôn có disclosure: "Bài viết này chứa affiliate links. Nếu bạn mua qua link, chúng tôi nhận được hoa hồng mà không tốn thêm chi phí của bạn."</p>

<h3>Bước 5: Track và Tối Ưu</h3>
<p>Theo dõi link nào có CTR cao, conversion tốt. Tập trung vào content và sản phẩm đang hoạt động, loại bỏ cái không hiệu quả.</p>

<h2>Thu Nhập Thực Tế Từ Affiliate</h2>
<table>
  <thead><tr><th>Cấp Độ</th><th>Thời Gian</th><th>Thu Nhập/Tháng</th></tr></thead>
  <tbody>
    <tr><td>Mới bắt đầu</td><td>0–12 tháng</td><td>0–5 triệu VND</td></tr>
    <tr><td>Trung cấp</td><td>1–3 năm</td><td>5–50 triệu VND</td></tr>
    <tr><td>Chuyên nghiệp</td><td>3–5 năm</td><td>50–200 triệu VND</td></tr>
    <tr><td>Full-time</td><td>5+ năm</td><td>200 triệu VND+</td></tr>
  </tbody>
</table>

<h2>Kết Luận</h2>
<p>Affiliate marketing là hành trình dài hạn. Kiên nhẫn 6–12 tháng đầu xây content chất lượng, sau đó thu nhập sẽ <strong>tự động tăng theo traffic</strong>.</p>
<p>Bước đầu tiên quan trọng nhất: có một website chuẩn SEO. <a href="/services">WebPro giúp bạn làm điều đó</a> từ 1 triệu đồng!</p>`
    },
    {
      title: 'WordPress vs Wix vs Custom Code: Nên Chọn Gì Cho Website Của Bạn?',
      slug: 'wordpress-vs-wix-vs-custom-code',
      excerpt: 'So sánh chi tiết WordPress, Wix và custom code để giúp bạn chọn nền tảng website phù hợp nhất. Phân tích chi phí, ưu nhược điểm và use case cụ thể cho từng loại.',
      cat: 'wordpress',
      image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1200&q=80',
      seo_title: 'WordPress vs Wix vs Custom Code: So Sánh Chi Tiết Cho Người Mới 2024',
      seo_desc: 'So sánh WordPress, Wix và custom code: chi phí, SEO, linh hoạt, bảo mật. Hướng dẫn chọn nền tảng website phù hợp với nhu cầu doanh nghiệp.',
      seo_kw: 'wordpress vs wix, nên dùng wordpress hay wix, chọn nền tảng website',
      featured: 0, read_time: 9, tags: 'wordpress,wix,so sánh,nền tảng website', views: 987,
      content: `<h2>Tổng Quan: 3 Hướng Làm Website Phổ Biến Nhất</h2>
<p>Khi bắt đầu làm website, câu hỏi đầu tiên luôn là: <strong>Dùng nền tảng nào?</strong> Ba lựa chọn phổ biến nhất — WordPress, Wix và custom code — đều có những điểm mạnh và yếu riêng.</p>

<h2>WordPress — Lựa Chọn #1 Cho 43% Website Toàn Cầu</h2>
<p>WordPress (self-hosted tại WordPress.org) là CMS mã nguồn mở, chiếm hơn 43% tổng số website trên internet, từ blog cá nhân đến trang tin tức lớn như BBC, TechCrunch.</p>

<h3>Ưu Điểm</h3>
<ul>
  <li>✅ 60.000+ plugin — mở rộng tính năng không giới hạn</li>
  <li>✅ SEO tối ưu với Yoast/Rank Math</li>
  <li>✅ Cộng đồng khổng lồ, tài liệu phong phú</li>
  <li>✅ Full control — code, database, hosting</li>
  <li>✅ Chi phí thấp: hosting ~$3–10/tháng</li>
</ul>

<h3>Nhược Điểm</h3>
<ul>
  <li>❌ Learning curve — cần thời gian học</li>
  <li>❌ Cần cập nhật thường xuyên để tránh bị hack</li>
  <li>❌ Chậm nếu cài quá nhiều plugin không tối ưu</li>
</ul>

<div class="affiliate-box">
  <h3>🛒 Bắt Đầu WordPress Ngay</h3>
  <ul>
    <li><a href="#" rel="nofollow sponsored"><strong>Hostinger WordPress Hosting</strong></a> — $1.99/tháng, cài 1 click, tốc độ tốt</li>
    <li><a href="#" rel="nofollow sponsored"><strong>Elementor Pro</strong></a> — Page builder tốt nhất, $59/năm</li>
    <li><a href="#" rel="nofollow sponsored"><strong>GeneratePress Premium</strong></a> — Theme nhẹ, SEO tốt, $59/năm</li>
  </ul>
</div>

<h2>Wix — Dễ Dùng Nhất Cho Người Không Biết Code</h2>
<p>Wix là website builder kéo thả với 900+ template, hiện có 230 triệu người dùng. Không cần kiến thức kỹ thuật, tạo website trong vài giờ.</p>

<h3>Ưu Điểm</h3>
<ul>
  <li>✅ Cực dễ — kéo thả, không cần code</li>
  <li>✅ 900+ template đẹp</li>
  <li>✅ All-in-one: hosting, SSL, domain tích hợp</li>
  <li>✅ Hỗ trợ 24/7</li>
</ul>

<h3>Nhược Điểm</h3>
<ul>
  <li>❌ Không thể chuyển sang nền tảng khác (lock-in)</li>
  <li>❌ SEO kém hơn WordPress đáng kể</li>
  <li>❌ Chi phí cao: $17–$36/tháng</li>
  <li>❌ Hạn chế tùy chỉnh sâu</li>
</ul>

<h2>Custom Code — Tự Do Tối Đa</h2>
<p>Dùng React, Next.js, Vue, Laravel... để xây website từ đầu. Tốt nhất về hiệu suất và flexibility, nhưng đòi hỏi developer giỏi.</p>

<h2>Bảng So Sánh Tổng Hợp</h2>
<table>
  <thead><tr><th>Tiêu Chí</th><th>WordPress</th><th>Wix</th><th>Custom Code</th></tr></thead>
  <tbody>
    <tr><td>Độ dễ dùng</td><td>⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐</td></tr>
    <tr><td>SEO</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td></tr>
    <tr><td>Linh hoạt</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td></tr>
    <tr><td>Chi phí/tháng</td><td>$3–10</td><td>$17–36</td><td>$5–20</td></tr>
    <tr><td>Thời gian ra mắt</td><td>Vài ngày</td><td>Vài giờ</td><td>Vài tuần–tháng</td></tr>
    <tr><td>Tốc độ tải trang</td><td>Tốt (nếu tối ưu)</td><td>Trung bình</td><td>Rất tốt</td></tr>
  </tbody>
</table>

<h2>Nên Chọn Gì?</h2>
<ul>
  <li><strong>Blogger, affiliate marketer, doanh nghiệp nhỏ</strong> → WordPress</li>
  <li><strong>Người không biết code, cần nhanh</strong> → Wix (ngắn hạn)</li>
  <li><strong>Startup, web app phức tạp</strong> → Custom code (React/Next.js)</li>
  <li><strong>Shop online có ngân sách hạn chế</strong> → WordPress + WooCommerce</li>
</ul>

<h2>Kết Luận</h2>
<p>Với 90% doanh nghiệp nhỏ và blog kiếm tiền, <strong>WordPress là lựa chọn tối ưu nhất</strong> — balance giữa tính năng, SEO, chi phí và flexibility.</p>
<p>Không muốn tự cài đặt? <a href="/services">WebPro setup WordPress cho bạn</a> với giá chỉ từ 1 triệu đồng, tối ưu SEO ngay từ đầu!</p>`
    },
    {
      title: 'Landing Page Là Gì? 7 Yếu Tố Tạo Nên Landing Page Chuyển Đổi Cao',
      slug: 'landing-page-la-gi-7-yeu-to-chuyen-doi-cao',
      excerpt: 'Landing page là công cụ chuyển đổi mạnh mẽ nhất trong marketing số. Tìm hiểu landing page là gì, 7 yếu tố không thể thiếu và cách thiết kế trang đích có tỷ lệ chuyển đổi 20–30%.',
      cat: 'thiet-ke-website',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&q=80',
      seo_title: 'Landing Page Là Gì? 7 Yếu Tố Thiết Kế Landing Page Chuyển Đổi Cao 2024',
      seo_desc: 'Landing page là gì, sự khác biệt với website thông thường, 7 yếu tố không thể thiếu và cách thiết kế trang đích đạt tỷ lệ chuyển đổi 20–30%.',
      seo_kw: 'landing page là gì, thiết kế landing page, trang đích chuyển đổi cao',
      featured: 0, read_time: 6, tags: 'landing page,chuyển đổi,marketing,thiết kế', views: 765,
      content: `<h2>Landing Page Là Gì?</h2>
<p>Trong digital marketing, <strong>landing page (trang đích)</strong> là trang web độc lập được thiết kế với <em>một mục tiêu chuyển đổi duy nhất</em>: mua hàng, để lại thông tin, đăng ký dùng thử, đặt lịch tư vấn...</p>
<p>Khác với website nhiều trang có nhiều menu và đường dẫn, landing page loại bỏ mọi yếu tố gây phân tâm, <strong>dẫn người dùng thẳng đến hành động mong muốn</strong>.</p>

<h2>Landing Page vs Website — Sự Khác Biệt Quan Trọng</h2>
<table>
  <thead><tr><th>Tiêu Chí</th><th>Website Thông Thường</th><th>Landing Page</th></tr></thead>
  <tbody>
    <tr><td>Mục tiêu</td><td>Nhiều mục tiêu</td><td>Một mục tiêu duy nhất</td></tr>
    <tr><td>Navigation menu</td><td>Đầy đủ</td><td>Tối giản hoặc không có</td></tr>
    <tr><td>Tỷ lệ chuyển đổi</td><td>1–3%</td><td>10–30%</td></tr>
    <tr><td>Phù hợp với</td><td>Branding, SEO dài hạn</td><td>Quảng cáo paid, campaign</td></tr>
    <tr><td>Traffic source</td><td>Organic, direct</td><td>Facebook Ads, Google Ads</td></tr>
  </tbody>
</table>

<h2>7 Yếu Tố Không Thể Thiếu Trong Landing Page Hiệu Quả</h2>

<h3>1. Headline Mạnh — 5 Giây Đầu Là Sống Còn</h3>
<p>80% người đọc chỉ đọc tiêu đề. Headline phải trả lời ngay: <em>"Tôi được gì?"</em></p>
<p><strong>Tệ:</strong> "Dịch vụ thiết kế website chuyên nghiệp"<br>
<strong>Tốt:</strong> "Có Website Bán Hàng Trong 48 Giờ — Chỉ Từ 500.000đ"</p>

<h3>2. Hero Section Rõ Ràng</h3>
<p>Hình ảnh/video chất lượng cao minh hoạ trực quan sản phẩm/dịch vụ. Video tăng chuyển đổi lên 80% theo nghiên cứu của Unbounce.</p>

<h3>3. Value Proposition — Lợi Ích, Không Phải Tính Năng</h3>
<p>Đừng nói <em>"Website responsive"</em>. Hãy nói <em>"Khách hàng đặt hàng dễ dàng trên điện thoại, tăng 50% đơn hàng mobile"</em>.</p>

<h3>4. Social Proof Mạnh</h3>
<p>Testimonials thực tế (có ảnh, tên, chức danh), số liệu cụ thể (500+ khách hàng, 4.9⭐), logo công ty đã dùng dịch vụ.</p>

<h3>5. CTA Nổi Bật và Cụ Thể</h3>
<p>Màu sắc tương phản cao, text cụ thể hành động:</p>
<ul>
  <li>"Nhận Tư Vấn Miễn Phí" tốt hơn "Liên Hệ"</li>
  <li>"Xem Demo Ngay" tốt hơn "Tìm Hiểu Thêm"</li>
  <li>"Đặt Hàng Ngay — Giảm 20% Hôm Nay" tốt hơn "Mua Ngay"</li>
</ul>

<h3>6. Urgency và Scarcity</h3>
<p>Tạo cảm giác cấp bách hợp lý: giới hạn số lượng, ưu đãi có thời hạn, đồng hồ đếm ngược. Tăng conversion 10–20% nếu dùng đúng cách.</p>

<h3>7. Form Ngắn Gọn</h3>
<p>Mỗi trường thêm vào giảm conversion 10%. Chỉ hỏi thông tin thực sự cần thiết. Cho landing page B2B: tên + SĐT + email là đủ.</p>

<div class="affiliate-box">
  <h3>🛠 Công Cụ Làm Landing Page</h3>
  <ul>
    <li><a href="#" rel="nofollow sponsored"><strong>Elementor</strong></a> — Landing page builder tốt nhất trên WordPress</li>
    <li><a href="#" rel="nofollow sponsored"><strong>Unbounce</strong></a> — Chuyên landing page + A/B testing, $74/tháng</li>
    <li><a href="#" rel="nofollow sponsored"><strong>Carrd</strong></a> — Landing page đơn giản cực rẻ, $19/năm</li>
  </ul>
</div>

<h2>Khi Nào Nên Dùng Landing Page?</h2>
<ul>
  <li>Chạy Facebook Ads / Google Ads</li>
  <li>Ra mắt sản phẩm/dịch vụ mới</li>
  <li>Chương trình khuyến mãi có thời hạn</li>
  <li>Thu thập email list (lead magnet)</li>
  <li>Đăng ký sự kiện / webinar</li>
</ul>

<h2>Kết Luận</h2>
<p>Landing page tốt có thể tăng ROI quảng cáo lên 5–10 lần so với website thông thường. Đây là đầu tư bắt buộc cho mọi doanh nghiệp chạy paid traffic.</p>
<p>Cần landing page chuyển đổi cao? <a href="/contact">Liên hệ WebPro</a> — tư vấn miễn phí, bàn giao trong 24–48h!</p>`
    },
    {
      title: 'Top 10 Công Cụ Thiết Kế Website Miễn Phí Tốt Nhất 2024',
      slug: 'top-10-cong-cu-thiet-ke-website-mien-phi-2024',
      excerpt: 'Tổng hợp 10 công cụ thiết kế website miễn phí tốt nhất: Figma, VS Code, Canva, Tailwind, Netlify và nhiều hơn nữa. Đủ để làm website đẹp chuyên nghiệp mà không tốn đồng nào cho công cụ.',
      cat: 'review-cong-cu',
      image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&q=80',
      seo_title: 'Top 10 Công Cụ Thiết Kế Website Miễn Phí Tốt Nhất Năm 2024',
      seo_desc: 'Danh sách 10 công cụ thiết kế website miễn phí tốt nhất: Figma, VS Code, Canva, Unsplash, Font Awesome, Google Fonts, Tailwind CSS, GSAP, Netlify, ChatGPT.',
      seo_kw: 'công cụ thiết kế website miễn phí, tool làm web, figma miễn phí',
      featured: 0, read_time: 7, tags: 'công cụ,miễn phí,thiết kế,figma,canva,tailwind', views: 1567,
      content: `<h2>Làm Website Đẹp Không Cần Tốn Tiền Công Cụ</h2>
<p>Một trong những hiểu lầm phổ biến là làm website chuyên nghiệp cần nhiều phần mềm đắt tiền. Sự thật là: <strong>bộ công cụ miễn phí hiện tại đủ mạnh để làm bất kỳ loại website nào</strong>.</p>
<p>Dưới đây là 10 công cụ tôi dùng hàng ngày — tất cả đều miễn phí.</p>

<h2>1. Figma — Thiết Kế UI/UX Số 1</h2>
<p>Figma thay thế hoàn toàn Adobe XD và Sketch với gói miễn phí mạnh mẽ:</p>
<ul>
  <li>3 project miễn phí, unlimited collaborators</li>
  <li>Auto-layout, component variants, prototype</li>
  <li>Dev Mode — inspect code CSS tự động</li>
  <li>Figma Community: hàng nghìn UI kit miễn phí</li>
</ul>
<p><strong>Phù hợp với:</strong> Designer cần mockup, developer cần spec design.</p>

<h2>2. VS Code — Code Editor Số 1 Thế Giới</h2>
<p>Visual Studio Code của Microsoft — miễn phí, mã nguồn mở, hơn 30.000 extension:</p>
<ul>
  <li>IntelliSense + AI code completion (GitHub Copilot)</li>
  <li>Live Server: xem thay đổi realtime</li>
  <li>Git tích hợp sẵn</li>
  <li>Extension Prettier + ESLint để code đẹp chuẩn</li>
</ul>

<h2>3. Canva — Đồ Họa Nhanh Cho Non-Designer</h2>
<p>Canva free có đủ mọi thứ cho web designer:</p>
<ul>
  <li>250.000+ template banner, thumbnail, social post</li>
  <li>Remove background miễn phí (giới hạn)</li>
  <li>Brand kit cơ bản, xuất PNG/JPG/SVG</li>
</ul>

<h2>4. Unsplash + Pexels — Ảnh Stock Miễn Phí Thương Mại</h2>
<p>Hai kho ảnh chất lượng cao, license hoàn toàn miễn phí:</p>
<ul>
  <li><strong>Unsplash:</strong> 3M+ ảnh, chất lượng nghệ thuật cao nhất</li>
  <li><strong>Pexels:</strong> Có thêm video, đa dạng phong cách Châu Á</li>
</ul>

<div class="affiliate-box">
  <h3>💎 Muốn Ảnh Cao Cấp Hơn?</h3>
  <ul>
    <li><a href="#" rel="nofollow sponsored"><strong>Envato Elements</strong></a> — Hơn 12M assets (ảnh, video, template, font), $16.50/tháng</li>
    <li><a href="#" rel="nofollow sponsored"><strong>Shutterstock</strong></a> — 400M+ ảnh chuyên nghiệp, có gói theo nhu cầu</li>
  </ul>
</div>

<h2>5. Font Awesome + Heroicons — Icon Miễn Phí</h2>
<p><strong>Font Awesome</strong> có 2.000+ icon miễn phí, nhúng qua CDN:</p>
<pre><code>&lt;link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"&gt;</code></pre>
<p><strong>Heroicons</strong> (từ Tailwind Labs) — 300 icon SVG cực đẹp, phù hợp web design hiện đại.</p>

<h2>6. Google Fonts — 1.400+ Font Chữ Miễn Phí</h2>
<p>Font tốt nhất cho website tiếng Việt:</p>
<ul>
  <li><strong>Be Vietnam Pro</strong> — Tốt nhất cho content tiếng Việt</li>
  <li><strong>Inter</strong> — UI chuẩn, dễ đọc trên màn hình</li>
  <li><strong>Playfair Display</strong> — Sang trọng cho luxury brands</li>
</ul>

<h2>7. Tailwind CSS — Framework CSS Hiện Đại Nhất</h2>
<p>Utility-first CSS framework giúp style nhanh gấp 3–5 lần. CDN version miễn phí để prototype:</p>
<pre><code>&lt;script src="https://cdn.tailwindcss.com"&gt;&lt;/script&gt;</code></pre>

<h2>8. GSAP Free — Animation Đẹp Dễ Dàng</h2>
<p>GreenSock Animation Platform — thư viện animation JavaScript mạnh nhất. Gói free đủ cho scroll animations, hover effects, entrance animations.</p>

<h2>9. Netlify / Vercel — Hosting Miễn Phí</h2>
<ul>
  <li><strong>Netlify Free:</strong> 100GB bandwidth, SSL, custom domain, CI/CD</li>
  <li><strong>Vercel Free:</strong> Tốt nhất cho Next.js, deploy từ GitHub tự động</li>
  <li><strong>GitHub Pages:</strong> Static site miễn phí, tích hợp Actions</li>
</ul>

<h2>10. Claude / ChatGPT — AI Coding Assistant</h2>
<p>AI đang thay đổi hoàn toàn quy trình làm web:</p>
<ul>
  <li>Generate code từ mô tả ngôn ngữ tự nhiên</li>
  <li>Debug lỗi phức tạp trong giây</li>
  <li>Viết content, SEO description, meta tags</li>
  <li>Review code, gợi ý tối ưu</li>
</ul>

<h2>Kết Luận</h2>
<p>Với 10 công cụ này, bạn có đủ mọi thứ để làm website chuyên nghiệp mà <strong>không tốn đồng nào cho phần mềm</strong>. Thời gian học và thực hành mới là investment thực sự.</p>
<p>Không muốn tự học? <a href="/services">WebPro làm website cho bạn</a> — nhanh hơn, rẻ hơn, chuyên nghiệp hơn tự làm!</p>`
    },
  ];

  posts.forEach(p => {
    const cat = getcat.get(p.cat);
    if (cat) ins.run(p.title, p.slug, p.excerpt, p.content, cat.id, p.image, p.seo_title, p.seo_desc, p.seo_kw, p.featured, p.read_time, p.tags, p.views);
  });

  // Update category post counts
  db.prepare(`
    UPDATE blog_categories
    SET post_count = (SELECT COUNT(*) FROM blog_posts WHERE category_id = blog_categories.id AND is_published = 1)
  `).run();
}

module.exports = db;
