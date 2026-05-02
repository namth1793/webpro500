#!/bin/sh
# Netlify build script — injects Railway API URL into frontend/js/env.js
# Set the API_BASE environment variable in Netlify to your Railway backend URL
echo "window.API_BASE = '${API_BASE:-}';" > frontend/js/env.js
echo "[build] env.js written → API_BASE=${API_BASE:-}"
