#!/bin/sh
# Netlify build script — injects Railway API URL into frontend/js/env.js
# Set the API_BASE environment variable in Netlify to your Railway backend URL
cat > frontend/js/env.js << 'ENVEOF'
(function(){
  var base='__API_BASE__';
  window.API_BASE=base;
  if(!base)return;
  var orig=window.fetch.bind(window);
  window.fetch=function(url,opts){
    if(typeof url==='string'&&url.startsWith('/api'))url=base.replace(/\/$/,'')+url;
    return orig(url,opts);
  };
}());
ENVEOF
# Replace placeholder with actual value
sed -i "s|__API_BASE__|${API_BASE:-}|g" frontend/js/env.js
echo "[build] env.js written → API_BASE=${API_BASE:-}"

# Proxy các route render phía server sang Railway (status 200 = proxy, không redirect).
# Netlify giữ nguyên HTTP status từ Railway (404 thật cho slug không tồn tại).
# File _redirects được ưu tiên trước các rule trong netlify.toml.
if [ -n "${API_BASE:-}" ]; then
  B="${API_BASE%/}"
  cat > frontend/_redirects << REDIR
/api/*        ${B}/api/:splat      200!
/blog         ${B}/blog            200!
/blog/*       ${B}/blog/:splat     200!
/sitemap.xml  ${B}/sitemap.xml     200!
/robots.txt   ${B}/robots.txt      200!
REDIR
  echo "[build] _redirects written → proxy /blog, /api, sitemap, robots to ${B}"
else
  echo "[build] API_BASE empty — blog dùng trang tĩnh (không SSR)"
fi
