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
  /* NB : fromTo + clearProps partout — certains éléments sont aussi gérés par
     le système data-reveal (opacité 0 au chargement) : un gsap.from y capturerait
     une valeur d'arrivée nulle et les laisserait invisibles. */
  q('.chapter').forEach(function(ch){
    var items = q('p,.pull,.btn',ch).slice(0,4);
    if(!items.length) return;
    gsap.fromTo(items,{ y:26, opacity:0 },{
      y:0, opacity:1, duration:.8, ease:'power3.out', stagger:.09, clearProps:'opacity,transform',
      scrollTrigger:{ trigger:ch, start:'top 74%', once:true }
    });
  });

  /* ---------- 3. PARALLAXE — visuels de chapitre ---------- */
  q('.chap-visual img,.chap-visual svg').forEach(function(img){
    gsap.fromTo(img,
      { yPercent:9, scale:.95 },
      { yPercent:-9, scale:1, ease:'none',
        scrollTrigger:{ trigger:img.closest('.chapter')||img, start:'top bottom', end:'bottom top', scrub:.6 } });
  });

  /* ---------- 3bis. SCÈNES SVG — vie interne des illustrations ---------- */
  q('.chap-svg').forEach(function(svg){
    /* éléments flottants (compas, pages, arrosoir, éclats…) */
    q('.flo',svg).forEach(function(el,i){
      gsap.to(el,{ y:-(8+(i%3)*3), duration:2.4+(i%4)*.5, ease:'sine.inOut', yoyo:true, repeat:-1, delay:i*.3 });
    });
    /* aiguille de boussole qui oscille */
    q('.needle',svg).forEach(function(el){
      gsap.to(el,{ rotation:16, transformOrigin:'50% 50%', duration:1.6, ease:'sine.inOut', yoyo:true, repeat:-1 });
    });
    /* gouttes d'arrosoir */
    q('.drop',svg).forEach(function(el,i){
      gsap.fromTo(el,{ y:-4, opacity:0 },{ y:26, opacity:1, duration:1.1, ease:'power1.in', repeat:-1, repeatDelay:.5, delay:i*.55,
        onRepeat:function(){ gsap.set(el,{opacity:0}); } });
    });
    /* clignement des yeux du robot */
    q('.eyes',svg).forEach(function(el){
      gsap.timeline({ repeat:-1, repeatDelay:2.8 })
        .to(el,{ scaleY:.1, transformOrigin:'50% 50%', duration:.07 })
        .to(el,{ scaleY:1, duration:.09 });
    });
    /* traits de circuits & arcs de soleil qui se dessinent au scroll */
    var draws=q('.cir path[pathLength],.arc path[pathLength]',svg);
    if(draws.length){
      gsap.set(draws,{ strokeDasharray:1, strokeDashoffset:1 });
      gsap.to(draws,{ strokeDashoffset:0, duration:1.1, ease:'power2.out', stagger:.18,
        scrollTrigger:{ trigger:svg, start:'top 78%', once:true } });
    }
    /* chemin en pointillés (vision) */
    q('.path-dash',svg).forEach(function(el){
      gsap.from(el,{ opacity:0, duration:1.4, ease:'power2.out',
        scrollTrigger:{ trigger:svg, start:'top 74%', once:true } });
    });
  });

  /* ---------- 4. HÉROS desktop — parallaxe de sortie ---------- */
  var hf = document.querySelector('.hero-frame');
  if(hf){
    gsap.to(hf,{ yPercent:14, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:.5 } });
    gsap.to('.hero-copy',{ yPercent:8, opacity:.4, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:.5 } });
  }

  /* ---------- 5. HÉROS mobile — entrée en cascade + sortie parallaxe ---------- */
  var hm = document.querySelector('.hero-m');
  if(hm && getComputedStyle(hm).display !== 'none'){
    gsap.fromTo('.hero-m-inner > *',{ y:26, opacity:0 },
      { y:0, opacity:1, duration:.9, ease:'power3.out', stagger:.12, delay:.2, clearProps:'opacity,transform' });
    gsap.to('.hero-m-inner',{ yPercent:10, opacity:.35, ease:'none',
      scrollTrigger:{ trigger:hm, start:'top top', end:'bottom top', scrub:.5 } });
  }

  /* ---------- 6. CARTE MOODY — entrée en profondeur ---------- */
  q('.moody-card').forEach(function(card){
    gsap.fromTo(card,{ y:56, opacity:0, scale:.975 },{ y:0, opacity:1, scale:1, duration:1, ease:'power3.out', clearProps:'opacity,transform',
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
    gsap.fromTo(kids,{ y:34, opacity:0 },{ y:0, opacity:1, duration:.75, ease:'power3.out', stagger:.07, clearProps:'opacity,transform',
      scrollTrigger:{ trigger:grid, start:'top 85%', once:true } });
  });

  /* ---------- 9. CTA final — zoom doux ---------- */
  var cta = document.querySelector('.cta-box');
  if(cta){
    gsap.fromTo(cta,{ scale:.94, opacity:0 },{ scale:1, opacity:1, duration:1, ease:'power3.out', clearProps:'opacity,transform',
      scrollTrigger:{ trigger:cta, start:'top 85%', once:true } });
  }

  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  setTimeout(function(){ ScrollTrigger.refresh(); }, 900);
});
})();
