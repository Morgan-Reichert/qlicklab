/* Shared: smooth page transitions across QlickLab pages */
(function(){
  var pt=document.querySelector('.pt-overlay');
  if(!pt) return;
  // ENTER (arriving from an internal transition): skip preloader, reveal overlay
  if(sessionStorage.getItem('pt-nav')){
    sessionStorage.removeItem('pt-nav');
    var pl=document.getElementById('preloader'); if(pl) pl.classList.add('done');
    pt.classList.add('reveal');
    pt.addEventListener('animationend',function(){pt.classList.remove('reveal');},{once:true});
  }
  // EXIT: intercept internal page links
  document.addEventListener('click',function(e){
    var a=e.target.closest && e.target.closest('a'); if(!a) return;
    var href=a.getAttribute('href'); if(!href) return;
    if(href[0]==='#'||/^https?:|^mailto:|^tel:/.test(href)||a.target==='_blank'||a.hasAttribute('download')) return;
    if(!/\.html($|[#?])/.test(href)) return;
    e.preventDefault();
    sessionStorage.setItem('pt-nav','1');
    pt.classList.add('cover');
    setTimeout(function(){window.location.href=href;},470);
  });
})();
