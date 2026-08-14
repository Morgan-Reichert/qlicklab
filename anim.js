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
    /* clignement des yeux (robot, personnages) */
    q('.eyes',svg).forEach(function(el,i){
      gsap.timeline({ repeat:-1, repeatDelay:2.8+i*.7 })
        .to(el,{ scaleY:.1, transformOrigin:'50% 50%', duration:.07 })
        .to(el,{ scaleY:1, duration:.09 });
    });
    /* battement de cœur */
    q('.beat',svg).forEach(function(el){
      gsap.timeline({ repeat:-1, repeatDelay:.55 })
        .to(el,{ scale:1.14, transformOrigin:'50% 50%', duration:.14, ease:'power2.out' })
        .to(el,{ scale:1, duration:.16, ease:'power2.in' })
        .to(el,{ scale:1.09, duration:.12, ease:'power2.out' })
        .to(el,{ scale:1, duration:.2, ease:'power2.in' });
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

  /* ---------- 3ter. DOMAINES mobile — pile épinglée : les cartes volent
     depuis 4 directions et se superposent exactement au même endroit ---------- */
  if(window.matchMedia('(max-width:768px)').matches){
    var polboard = document.querySelector('.feat-board');
    var polcards = q('.feat-board .polcard');
    if(polboard && polcards.length === 4){
      polboard.classList.add('stacked');
      polcards.forEach(function(c){ c.classList.add('in'); });   /* neutralise data-reveal */
      gsap.set(polcards,{ xPercent:-50 });
      gsap.set(polcards[0],{ rotation:-2 });

      /* la hauteur du plateau = la plus haute carte */
      function sizeBoard(){
        var h = 0;
        polcards.forEach(function(c){ h = Math.max(h, c.offsetHeight); });
        polboard.style.height = h + 'px';
      }
      sizeBoard();
      window.addEventListener('resize', function(){ sizeBoard(); ScrollTrigger.refresh(); });

      /* préparation du "ça se dessine / ça s'écrit" */
      var intro = polcards.map(function(card){
        var svg = card.querySelector('.pol-svg');
        var strokes = [], fills = [];
        if(svg){
          q('path,circle,rect', svg).forEach(function(el){
            if(el === svg.firstElementChild) return;            /* fond beige */
            if(el.hasAttribute('pathLength') || el.hasAttribute('stroke-dasharray')) return;
            var hasStroke = el.getAttribute('stroke') || el.closest('g[stroke]');
            try{
              if(hasStroke && el.getTotalLength){
                var L = el.getTotalLength();
                if(L > 0){ el.style.strokeDasharray = L; el.style.strokeDashoffset = L; strokes.push(el); }
              }
            }catch(e){}
            var f = el.getAttribute('fill');
            if(f && f !== 'none') fills.push(el);
          });
          gsap.set(fills,{ fillOpacity:0 });
        }
        var chars = [];
        q('h3,p', card).forEach(function(t){
          var txt = t.textContent; t.textContent = '';
          txt.split('').forEach(function(ch){
            var s = document.createElement('span');
            s.textContent = ch; s.style.opacity = 0;
            t.appendChild(s); chars.push(s);
          });
        });
        return { strokes:strokes, fills:fills, chars:chars, played:false };
      });
      function playIntro(i){
        var d = intro[i];
        if(!d || d.played) return; d.played = true;
        var tl = gsap.timeline();
        if(d.strokes.length) tl.to(d.strokes,{ strokeDashoffset:0, duration:.75, ease:'power2.inOut', stagger:.035 },0);
        if(d.fills.length)   tl.to(d.fills,{ fillOpacity:1, duration:.5, ease:'power1.out', stagger:.02 },.5);
        if(d.chars.length)   tl.to(d.chars,{ opacity:1, duration:.01, ease:'none', stagger:.012 },.25);
      }

      /* aimantation : jamais plus d'une carte par geste */
      var snapIdx = 0;
      var poltl = gsap.timeline({
        scrollTrigger:{
          trigger:polboard, start:'top 108px', end:'+=250%', pin:true, scrub:.55, anticipatePin:1,
          onEnter:function(){ playIntro(0); },
          snap:{
            snapTo:function(v){
              var t = Math.round(v * 3);
              return Math.max(snapIdx - 1, Math.min(snapIdx + 1, t)) / 3;
            },
            onComplete:function(self){ snapIdx = Math.round(self.progress * 3); },
            duration:{min:.3,max:.7}, ease:'power3.out', delay:.05
          }
        }
      });
      /* 2e carte : de la gauche · 3e : de la droite · 4e : d'en dessous */
      poltl.call(function(){ playIntro(1); },null,0)
        .fromTo(polcards[1],{ x:'-125vw', rotation:-26 },{ x:0, rotation:-2.2, duration:1, ease:'power2.out' },0)
        .call(function(){ playIntro(2); },null,1)
        .fromTo(polcards[2],{ x:'125vw', rotation:24 },{ x:0, rotation:1.8, duration:1, ease:'power2.out' },1)
        .call(function(){ playIntro(3); },null,2)
        .fromTo(polcards[3],{ y:'115vh', rotation:-16 },{ y:0, rotation:2.4, duration:1, ease:'power2.out' },2);
    }
  }

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

    /* mini-carte Moody : flottement doux après l'entrée */
    var mc = hm.querySelector('.hero-mcard');
    if(mc){ gsap.to(mc,{ y:-6, duration:2.6, ease:'sine.inOut', yoyo:true, repeat:-1, delay:1.7 }); }

    /* carrousel dessiné : chaque illustration se trace, vit, s'efface, place à la suivante */
    var cyc = hm.querySelector('.hero-cycle');
    if(cyc){
      var csvgs = q('.hero-svg', cyc);
      var cdata = csvgs.map(function(svg){
        var strokes = [], fills = [];
        q('path,circle,rect,ellipse', svg).forEach(function(el){
          if(el.hasAttribute('stroke-dasharray')) return;
          var hasStroke = el.getAttribute('stroke') || el.closest('g[stroke]');
          try{
            if(hasStroke && el.getTotalLength){
              var L = el.getTotalLength();
              if(L > 0){ el._len = L; el.style.strokeDasharray = L; el.style.strokeDashoffset = L; strokes.push(el); }
            }
          }catch(e){}
          var f = el.getAttribute('fill');
          if(f && f !== 'none') fills.push(el);
        });
        gsap.set(svg,{ autoAlpha:0 });
        gsap.set(fills,{ fillOpacity:0 });
        return { svg:svg, strokes:strokes, fills:fills };
      });
      var ci = 0;
      (function cycleNext(){
        var d = cdata[ci];
        gsap.timeline({ onComplete:function(){ ci = (ci+1) % cdata.length; cycleNext(); } })
          .set(d.svg,{ autoAlpha:1 })
          .to(d.strokes,{ strokeDashoffset:0, duration:1.05, ease:'power2.inOut', stagger:.03 },0)
          .to(d.fills,{ fillOpacity:1, duration:.55, ease:'power1.out', stagger:.018 },.75)
          .to({},{ duration:4.2 })
          .to(d.fills,{ fillOpacity:0, duration:.4, ease:'power1.in' },'>')
          .to(d.strokes,{ strokeDashoffset:function(i,el){ return el._len; }, duration:.65, ease:'power2.in', stagger:.012 },'<')
          .set(d.svg,{ autoAlpha:0 });
      })();
    }
  }

  /* mot tournant : une force / un atout / une fierté (héros desktop + mobile)
     — cascade lettre à lettre avec bascule 3D */
  document.querySelectorAll('.rotw').forEach(function(rot){
    if(!rot.offsetParent) return; /* invisible sur ce format */
    var words = ['une force','un atout','une fierté'];
    /* largeur stabilisée sur le mot le plus large pour éviter les sauts */
    var probe = rot.cloneNode(false);
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
    rot.parentNode.appendChild(probe);
    var wmax = 0;
    words.forEach(function(w){ probe.textContent = w; wmax = Math.max(wmax, probe.offsetWidth); });
    probe.remove();
    rot.style.display = 'inline-block';
    rot.style.minWidth = wmax + 'px';

    function setChars(word){
      rot.textContent = '';
      word.split('').forEach(function(ch){
        var s = document.createElement('span');
        s.className = 'rc';
        s.textContent = ch === ' ' ? ' ' : ch;
        rot.appendChild(s);
      });
      return rot.querySelectorAll('.rc');
    }
    setChars(words[0]);
    var wi = 0, busy = false;
    setInterval(function(){
      if(busy) return; busy = true;
      wi = (wi+1) % words.length;
      gsap.to(rot.querySelectorAll('.rc'),{
        y:-16, opacity:0, rotateX:75, duration:.3, stagger:.028, ease:'power2.in',
        onComplete:function(){
          var chars = setChars(words[wi]);
          gsap.fromTo(chars,
            { y:18, opacity:0, rotateX:-75 },
            { y:0, opacity:1, rotateX:0, duration:.5, stagger:.04, ease:'back.out(1.7)',
              onComplete:function(){ busy = false; } });
        }
      });
    }, 3400);
  });

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

/* footer mobile : colonnes en accordéons (toutes pages) */
(function(){
  if(!window.matchMedia('(max-width:768px)').matches) return;
  var cols = document.querySelectorAll('footer .f-col');
  cols.forEach(function(col,i){
    if(i===0) col.classList.add('open');
    var h = col.querySelector('h5');
    if(h) h.addEventListener('click',function(){ col.classList.toggle('open'); });
  });
})();
