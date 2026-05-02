(function(){
  var base='';
  window.API_BASE=base;
  if(!base)return;
  var orig=window.fetch.bind(window);
  window.fetch=function(url,opts){
    if(typeof url==='string'&&url.startsWith('/api'))url=base.replace(/\/$/,'')+url;
    return orig(url,opts);
  };
}());
