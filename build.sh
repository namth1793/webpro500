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
