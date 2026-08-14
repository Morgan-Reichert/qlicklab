/* QlickLab — shared UX layer (loaded on every page) */
(function(){
'use strict';
var mqHover=window.matchMedia('(hover:hover)').matches;

/* ---------- PAGE TRANSITIONS ---------- */
var pt=document.querySelector('.pt-overlay');
function go(href){
  if(pt){sessionStorage.setItem('pt-nav','1');pt.classList.add('cover');setTimeout(function(){window.location.href=href;},460);}
  else window.location.href=href;
}
if(pt){
  if(sessionStorage.getItem('pt-nav')){
    sessionStorage.removeItem('pt-nav');
    var pl=document.getElementById('preloader'); if(pl) pl.classList.add('done');
    pt.classList.add('reveal');
    pt.addEventListener('animationend',function(){pt.classList.remove('reveal');},{once:true});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a'); if(!a) return;
    var href=a.getAttribute('href'); if(!href) return;
    if(href[0]==='#'||/^https?:|^mailto:|^tel:/.test(href)||a.target==='_blank'||a.hasAttribute('download')||a.dataset.copy) return;
    if(!/\.html($|[#?])/.test(href)) return;
    e.preventDefault(); go(href);
  });
}

/* ---------- PREFETCH ON HOVER ---------- */
var pf=new Set();
document.addEventListener('mouseover',function(e){
  var a=e.target.closest&&e.target.closest('a'); if(!a)return;
  var href=a.getAttribute('href'); if(!href||href[0]==='#'||/^https?:|^mailto:/.test(href))return;
  var u=href.split('#')[0]; if(!/\.html$/.test(u)||pf.has(u))return; pf.add(u);
  var l=document.createElement('link'); l.rel='prefetch'; l.href=u; document.head.appendChild(l);
});

/* ---------- IMAGE FADE-IN ---------- */
document.querySelectorAll('.card-media img,.slide-visual img,.chap-visual img,.hero-frame img,.certs-visual img,.proj-media img,.tm-av,.t-person .av img,.jcard img,.cta-person').forEach(function(img){
  img.classList.add('fadein');
  var done=function(){img.classList.add('ld');};
  if(img.complete&&img.naturalWidth>0) done();
  else{img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});}
});

/* ---------- SPOTLIGHT ON CARDS ---------- */
if(mqHover){document.querySelectorAll('[data-tilt]').forEach(function(el){
  el.addEventListener('mousemove',function(e){var r=el.getBoundingClientRect();
    el.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
    el.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');});
});}

/* ---------- SCROLLSPY (same-page anchors) ---------- */
var spyLinks=[].slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
if(spyLinks.length){
  var map={};
  spyLinks.forEach(function(a){var id=a.getAttribute('href').slice(1);if(id)(map[id]=map[id]||[]).push(a);});
  var secs=Object.keys(map).map(function(id){return document.getElementById(id);}).filter(Boolean);
  if(secs.length){
    var spO=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){
        document.querySelectorAll('.nav-top.current,.nav-plain.current').forEach(function(x){x.classList.remove('current');});
        (map[e.target.id]||[]).forEach(function(a){var item=a.closest('.nav-item');if(item){var top=item.querySelector('.nav-top');if(top)top.classList.add('current');}else a.classList.add('current');});
      }});
    },{rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(function(s){spO.observe(s);});
  }
}

/* ---------- FLOATING CTA ---------- */
(function(){
  var fab=document.createElement('a'); fab.className='fab'; fab.href='contact.html';
  fab.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Proposer un projet';
  document.body.appendChild(fab);
  window.addEventListener('scroll',function(){fab.classList.toggle('show',window.scrollY>window.innerHeight*0.85);},{passive:true});
})();

/* ---------- BACK-TO-TOP CIRCULAR ---------- */
var tt=document.getElementById('toTop');
if(tt){
  tt.innerHTML='<svg class="ring" width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="22"/><circle class="bar" cx="25" cy="25" r="22"/></svg><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="position:relative"><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var bar=tt.querySelector('.bar'), C=2*Math.PI*22; bar.style.strokeDasharray=C;
  function upd(){var h=document.documentElement.scrollHeight-window.innerHeight,p=h>0?window.scrollY/h:0;bar.style.strokeDashoffset=C*(1-p);}
  window.addEventListener('scroll',upd,{passive:true}); upd();
}

/* ---------- TOASTS ---------- */
var tc=document.createElement('div'); tc.className='toasts'; document.body.appendChild(tc);
window.qlToast=function(msg){
  var t=document.createElement('div'); t.className='toast';
  t.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'+msg;
  tc.appendChild(t); requestAnimationFrame(function(){t.classList.add('show');});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},350);},2600);
};

/* ---------- COPY EMAIL ---------- */
document.querySelectorAll('a').forEach(function(a){
  if(/@qlicklab\.eu/.test(a.textContent)&&(a.getAttribute('href')||'')[0]==='#'){
    a.addEventListener('click',function(e){e.preventDefault();
      var m=a.textContent.trim().match(/[\w.]+@qlicklab\.eu/);
      if(m){ if(navigator.clipboard) navigator.clipboard.writeText(m[0]); window.qlToast('Email copié : '+m[0]); }
    });
  }
});

/* ---------- COMMAND PALETTE (⌘K) ---------- */
(function(){
  var DEST=[
    ['Accueil','index.html','Page'],['Nos projets','projets.html','Page'],["L'équipe",'equipe.html','Page'],
    ['À propos','apropos.html','Page'],['Carrières','carrieres.html','Page'],['Contact','contact.html','Page'],
    ['Étude de cas · Moody','cas-carelin.html','Page'],['Mentions légales','legal.html','Page'],
    ['Notre philosophie','index.html#philosophie','Section'],["La place de l'IA",'index.html#ia','Section'],
    ['Notre vision','index.html#vision','Section'],['Nos startups','index.html#startups','Section'],
    
    ['Confidentialité','index.html#certifications','Section'],['FAQ','index.html#faq','Section']
  ];
  var el=document.createElement('div'); el.className='cmdk';
  el.innerHTML='<div class="cmdk-bg"></div><div class="cmdk-box"><input type="text" placeholder="Rechercher une page ou une section…" aria-label="Recherche"><ul></ul></div>';
  document.body.appendChild(el);
  var input=el.querySelector('input'), ul=el.querySelector('ul'), sel=0, items=[];
  function render(q){ q=(q||'').toLowerCase();
    items=DEST.filter(function(d){return d[0].toLowerCase().indexOf(q)>-1;});
    ul.innerHTML=items.length?items.map(function(d,i){return '<li data-i="'+i+'" class="'+(i===sel?'sel':'')+'">'+d[0]+'<small>'+d[2]+'</small></li>';}).join(''):'<li style="color:var(--muted-2);cursor:default">Aucun résultat</li>';
  }
  function open(){el.classList.add('open');input.value='';sel=0;render('');document.body.style.overflow='hidden';setTimeout(function(){input.focus();},60);}
  function close(){el.classList.remove('open');document.body.style.overflow='';}
  function nav(){var d=items[sel]; if(d){close(); go(d[1]);}}
  window.qlOpenCmd=open;
  input.addEventListener('input',function(){sel=0;render(input.value);});
  el.addEventListener('click',function(e){ if(e.target.classList.contains('cmdk-bg')){close();return;} var li=e.target.closest('li[data-i]'); if(li){sel=+li.dataset.i;nav();}});
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();el.classList.contains('open')?close():open();return;}
    if(!el.classList.contains('open'))return;
    if(e.key==='Escape')close();
    else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,items.length-1);render(input.value);}
    else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);render(input.value);}
    else if(e.key==='Enter'){e.preventDefault();nav();}
  });
})();

/* ---------- NAV SEARCH TRIGGER ---------- */
(function(){
  var cta=document.querySelector('.nav-cta'); if(!cta||!window.qlOpenCmd)return;
  var b=document.createElement('button'); b.className='navsearch'; b.type='button'; b.setAttribute('aria-label','Rechercher');
  b.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><kbd>⌘K</kbd>';
  b.addEventListener('click',window.qlOpenCmd);
  cta.insertBefore(b,cta.firstChild);
})();

/* ---------- CARTE MOODY DÉPLIANTE (animation de hauteur) ---------- */
document.addEventListener('click',function(e){
  var btn=e.target.closest('.moody-toggle'); if(!btn)return;
  var card=btn.closest('.moody-card'); if(!card)return;
  if(card.dataset.animating==='1')return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  card.querySelectorAll('img[loading="lazy"]').forEach(function(im){im.loading='eager';});
  var start=card.offsetHeight;
  var mr=card.querySelector('.moody-right');
  var r1=mr?mr.getBoundingClientRect():null;
  var folded=card.classList.toggle('folded');
  btn.setAttribute('aria-expanded',String(!folded));
  if(reduce)return;
  var end=card.offsetHeight;
  card.dataset.animating='1';
  card.style.height=start+'px';
  card.getBoundingClientRect();
  card.style.transition='height .55s cubic-bezier(.22,1,.36,1)';
  card.style.height=end+'px';
  /* FLIP : la zone verte glisse de son ancienne position vers la nouvelle */
  if(mr&&r1&&r1.width>0){
    var r2=mr.getBoundingClientRect();
    if(r2.width>0){
      var dx=r1.left-r2.left, dy=r1.top-r2.top, sx=r1.width/r2.width, sy=r1.height/r2.height;
      mr.style.transformOrigin='top left';
      mr.style.transform='translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')';
      mr.getBoundingClientRect();
      mr.style.transition='transform .55s cubic-bezier(.22,1,.36,1)';
      mr.style.transform='';
    }
  }
  var done=function(){card.style.height='';card.style.transition='';card.dataset.animating='';
    if(mr){mr.style.transition='';mr.style.transform='';mr.style.transformOrigin='';}
    card.removeEventListener('transitionend',done);};
  card.addEventListener('transitionend',done);
  setTimeout(done,650);
});

})();
