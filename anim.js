/* ============================================================
   QlickLab — moteur d'animation (GSAP + ScrollTrigger + Lenis + SplitType)
   Fluide, storytelling, et respectueux de prefers-reduced-motion.
   ============================================================ */
(function(){
'use strict';
if(!window.gsap || !window.ScrollTrigger) return;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
gsap.registerPlugin(ScrollTrigger);

/* ---------- SMOOTH SCROLL (Lenis) ---------- */
var lenis = null;
if(!reduce && window.Lenis){
  document.documentElement.style.scrollBehavior = 'auto';
  lenis = new Lenis({ lerp:.11, smoothWheel:true, wheelMultiplier:1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function(t){ lenis.raf(t*1000); });
  gsap.ticker.lagSmoothing(0);
  /* ancres internes -> défilement Lenis */
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="#"]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href.length < 2) return;
    var el = document.querySelector(href);
    if(!el) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset:-84, duration:1.15 });
    history.pushState(null,'',href);
  });
}
if(reduce) return; /* reste des effets désactivés si l'utilisateur préfère moins de mouvement */

/* ---------- HELPERS ---------- */
function q(s,ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(s)); }

document.fonts.ready.then(function(){

  /* ---------- 1. TITRES — révélation par mots masqués ---------- */
  if(window.SplitType){
    q('.sec-head h2,.chapter h2,.story-intro h2,.certs-head h2,.page-hero h1,.cta-box h2,.moody-tagline').forEach(function(h){
      if(h.dataset.split) return; h.dataset.split='1';
      var st = new SplitType(h,{ types:'lines,words' });
      if(!st.words || !st.words.length) return;
      gsap.from(st.words,{
        yPercent:115, duration:.85, ease:'power4.out', stagger:.03,
        scrollTrigger:{ trigger:h, start:'top 88%', once:true }
      });
    });
  }

  /* ---------- 2. PARAGRAPHES & CTA des chapitres — fondu décalé ---------- */
  q('.chapter').forEach(function(ch){
    var items = q('p,.pull,.btn',ch).slice(0,4);
    if(!items.length) return;
    gsap.from(items,{
      y:26, opacity:0, duration:.8, ease:'power3.out', stagger:.09,
      scrollTrigger:{ trigger:ch, start:'top 74%', once:true }
    });
  });

  /* ---------- 3. PARALLAXE — visuels de chapitre ---------- */
  q('.chap-visual img').forEach(function(img){
    gsap.fromTo(img,
      { yPercent:9, scale:.95 },
      { yPercent:-9, scale:1, ease:'none',
        scrollTrigger:{ trigger:img.closest('.chapter')||img, start:'top bottom', end:'bottom top', scrub:.6 } });
  });

  /* ---------- 4. HÉROS desktop — parallaxe de sortie ---------- */
  var hf = document.querySelector('.hero-frame');
  if(hf){
    gsap.to(hf,{ yPercent:14, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:.5 } });
    gsap.to('.hero-copy',{ yPercent:8, opacity:.4, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:.5 } });
  }

  /* ---------- 5. HÉROS mobile — zoom lent + parallaxe ---------- */
  var hmbg = document.querySelector('.hero-m-bg img');
  if(hmbg && getComputedStyle(document.querySelector('.hero-m')).display !== 'none'){
    gsap.fromTo(hmbg,{ scale:1.14 },{ scale:1.02, yPercent:8, ease:'none',
      scrollTrigger:{ trigger:'.hero-m', start:'top top', end:'bottom top', scrub:.5 } });
    gsap.from('.hero-m-inner > *',{ y:26, opacity:0, duration:.9, ease:'power3.out', stagger:.1, delay:.25 });
  }

  /* ---------- 6. CARTE MOODY — entrée en profondeur ---------- */
  q('.moody-card').forEach(function(card){
    gsap.from(card,{ y:56, opacity:0, scale:.975, duration:1, ease:'power3.out',
      scrollTrigger:{ trigger:card, start:'top 82%', once:true } });
  });
  var mi = document.querySelector('.moody-illus');
  if(mi){
    gsap.fromTo(mi,{ yPercent:7 },{ yPercent:-7, ease:'none',
      scrollTrigger:{ trigger:mi, start:'top bottom', end:'bottom top', scrub:.6 } });
  }

  /* ---------- 7. MARQUEE — vitesse réactive au scroll ---------- */
  var mq = document.getElementById('marquee');
  if(mq){
    var base = 1, boost = 0;
    ScrollTrigger.create({
      trigger: mq, start:'top bottom', end:'bottom top',
      onUpdate: function(self){ boost = Math.min(Math.abs(self.getVelocity())/900, 2.4); }
    });
    gsap.ticker.add(function(){
      boost += (0-boost)*.06;
      mq.style.animationDuration = (26/(base+boost)) + 's';
    });
  }

  /* ---------- 8. GRILLES (domaines, équipe, projets, FAQ…) — cascade ---------- */
  q('.feat-grid,.proj-grid,.team-grid,.certs-list,.price-grid,.steps').forEach(function(grid){
    var kids = Array.prototype.slice.call(grid.children);
    if(kids.length<2) return;
    gsap.from(kids,{ y:34, opacity:0, duration:.75, ease:'power3.out', stagger:.07,
      scrollTrigger:{ trigger:grid, start:'top 82%', once:true } });
  });

  /* ---------- 9. CTA final — zoom doux ---------- */
  var cta = document.querySelector('.cta-box');
  if(cta){
    gsap.from(cta,{ scale:.94, opacity:0, duration:1, ease:'power3.out',
      scrollTrigger:{ trigger:cta, start:'top 80%', once:true } });
  }

  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  setTimeout(function(){ ScrollTrigger.refresh(); }, 900);
});
})();
