/* ==========================================================================
   QlickLab — Espace client & Administration : noyau commun
   Aucune dépendance externe. Fonctionne en mode Supabase ou en mode démo.
   ========================================================================== */
(function (root) {
'use strict';

/* -------------------------------------------------- 1. Configuration ----- */
/* Renseignez site/qlab-config.js pour brancher Supabase.
   Sans configuration valide, l'application bascule en MODE DÉMO (données
   locales dans le navigateur) afin de rester utilisable et démontrable.     */
var CFG = root.QLAB_CONFIG || {};
var LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey &&
              CFG.supabaseUrl.indexOf('VOTRE_') === -1);

/* -------------------------------------------------- 2. Référentiels ------ */
var NATURES = [
  { id:'site-vitrine',  label:'Site vitrine',            desc:'Présenter une activité, une marque, une association.' },
  { id:'ecommerce',     label:'Boutique en ligne',       desc:'Vendre des produits ou des services en ligne.' },
  { id:'app-web',       label:'Application web',         desc:'Un outil métier, un espace client, un tableau de bord.' },
  { id:'app-mobile',    label:'Application mobile',      desc:'iOS et/ou Android.' },
  { id:'refonte',       label:'Refonte',                 desc:'Reprendre et moderniser un site ou un outil existant.' },
  { id:'automatisation',label:'Automatisation & IA',     desc:'Gagner du temps sur des tâches répétitives.' },
  { id:'identite',      label:'Identité visuelle',       desc:'Logo, charte, supports de communication.' },
  { id:'conseil',       label:'Conseil & cadrage',       desc:'Définir le besoin avant de construire.' },
  { id:'autre',         label:'Autre',                   desc:'Décrivez-nous votre idée, on en discute.' }
];
var SECTEURS = [
  'Administration / secteur public','Association','Auto-entrepreneur / indépendant',
  'Entreprise individuelle (EI)','EURL','SARL','SAS','SASU','SCI','SCOP / SCIC',
  'Profession libérale','Établissement d’enseignement','Collectivité territoriale',
  'Non immatriculé (projet personnel)','En cours de création','Autre'
];
var BUDGETS = [500,1000,2000,3000,5000,7500,10000,15000,20000,30000,50000,75000,100000];
var CONTACTS = [
  { id:'mail',    label:'E-mail',  ph:'vous@exemple.fr',        type:'email' },
  { id:'tel',     label:'Téléphone', ph:'06 12 34 56 78',       type:'tel' },
  { id:'discord', label:'Discord', ph:'pseudo#0000 ou @pseudo', type:'text' }
];
var PHASES = [
  { id:'cadrage',      label:'Cadrage' },
  { id:'conception',   label:'Conception' },
  { id:'developpement',label:'Développement' },
  { id:'recette',      label:'Recette' },
  { id:'livre',        label:'Livré' }
];
var UPDATE_KINDS = {
  info:      { label:'Information', cls:'info' },
  jalon:     { label:'Jalon',       cls:'jalon' },
  livraison: { label:'Livraison',   cls:'livraison' },
  alerte:    { label:'Point d’attention', cls:'alerte' }
};
var LINK_KINDS = {
  preview:{ label:'Aperçu' }, prod:{ label:'En ligne' }, repo:{ label:'Code' },
  design:{ label:'Maquette' }, doc:{ label:'Document' }, autre:{ label:'Lien' }
};

/* -------------------------------------------------- 3. Petits outils ----- */
function $(s, c) { return (c || document).querySelector(s); }
function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function el(tag, attrs, html) {
  var n = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'html') n.innerHTML = attrs[k];
    else if (k.slice(0,2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  }
  if (html != null) n.innerHTML = html;
  return n;
}
function money(n) {
  return new Intl.NumberFormat('fr-FR',{ style:'currency', currency:'EUR',
    maximumFractionDigits:0 }).format(Number(n) || 0);
}
function dateFull(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('fr-FR',
    { day:'numeric', month:'long', year:'numeric' });
}
function dateTime(v) {
  if (!v) return '—';
  var d = new Date(v);
  return d.toLocaleDateString('fr-FR',{ day:'2-digit', month:'short', year:'numeric' })
       + ' · ' + d.toLocaleTimeString('fr-FR',{ hour:'2-digit', minute:'2-digit' });
}
function since(v) {
  if (!v) return '';
  var s = (Date.now() - new Date(v).getTime()) / 1000;
  if (s < 60) return 'à l’instant';
  if (s < 3600) return 'il y a ' + Math.floor(s/60) + ' min';
  if (s < 86400) return 'il y a ' + Math.floor(s/3600) + ' h';
  if (s < 604800) return 'il y a ' + Math.floor(s/86400) + ' j';
  return dateFull(v);
}
function bytes(n) {
  if (!n) return '—';
  var u = ['o','Ko','Mo','Go'], i = 0; n = Number(n);
  while (n >= 1024 && i < 3) { n /= 1024; i++; }
  return (i ? n.toFixed(1) : n) + ' ' + u[i];
}
function uid() {
  if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
  return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2,10);
}
async function sha256(txt) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return Array.prototype.map.call(new Uint8Array(buf),
    function (b) { return b.toString(16).padStart(2,'0'); }).join('');
}
function debounce(fn, ms) {
  var t; return function () { var a = arguments, c = this;
    clearTimeout(t); t = setTimeout(function () { fn.apply(c,a); }, ms || 250); };
}

/* -------------------------------------------------- 4. Pictogrammes ------ */
var I = {
  home:'<path d="M3 10.5 12 3l9 7.5M5.5 9.3V20h13V9.3"/>',
  folder:'<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z"/>',
  form:'<path d="M6 3h12v18H6z"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3"/>',
  file:'<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/>',
  link:'<path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.2 1.2"/><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.2-1.2"/>',
  bell:'<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
  users:'<path d="M16.5 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H7.1a3.6 3.6 0 0 0-3.6 3.6V20"/><circle cx="10" cy="7.6" r="3.6"/><path d="M20.5 20v-1.8a3.6 3.6 0 0 0-2.7-3.5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 8.5 19a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H2a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3.7 8a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1"/>',
  out:'<path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9"/><path d="M15.5 16.5 20 12l-4.5-4.5M20 12H9"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  back:'<path d="M19 12H5M11 18l-6-6 6-6"/>',
  up:'<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>',
  down:'<path d="M12 5v14M5.5 12.5 12 19l6.5-6.5"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  eye:'<path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5.5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v1"/>',
  trash:'<path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/>',
  edit:'<path d="M12.5 5.5 4 14v5h5l8.5-8.5"/><path d="M15 3.2 20.8 9"/>',
  lock:'<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V6.8a4 4 0 0 1 8 0V10"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  alert:'<path d="M10.3 3.7 2 18.2A2 2 0 0 0 3.7 21h16.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0"/><path d="M12 9v4.5M12 17h.01"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>',
  send:'<path d="M21.5 2.5 11 13M21.5 2.5 15 21.5l-4-8.5-8.5-4z"/>',
  euro:'<path d="M17.5 6.2A7 7 0 0 0 6.5 12a7 7 0 0 0 11 5.8M4 10.5h9M4 13.5h9"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  cloud:'<path d="M12 15V4.5M8.5 8 12 4.5 15.5 8"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
  dl:'<path d="M12 4.5V15M8.5 11.5 12 15l3.5-3.5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  phone:'<path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.5 19.5 0 0 1-8.5-3 19 19 0 0 1-6-6 19.5 19.5 0 0 1-3-8.6A2 2 0 0 1 3.3 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.4 9.6a16 16 0 0 0 6 6l1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2"/>',
  chat:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-4-1L3 20l1.2-4.7a8.5 8.5 0 0 1-1-4A8.4 8.4 0 0 1 11.5 3h.5a8.4 8.4 0 0 1 9 8"/>'
};
function ico(name, size) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
    + 'stroke-linecap="round" stroke-linejoin="round"'
    + (size ? ' width="' + size + '" height="' + size + '"' : '') + '>' + (I[name] || '') + '</svg>';
}

/* -------------------------------------------------- 5. Retours visuels --- */
function toast(msg, kind) {
  var box = $('.toasts') || document.body.appendChild(el('div', { class:'toasts' }));
  var t = el('div', { class:'toast' + (kind ? ' ' + kind : '') },
    ico(kind === 'bad' ? 'alert' : kind === 'ok' ? 'check' : 'info') + '<span>' + esc(msg) + '</span>');
  box.appendChild(t);
  setTimeout(function () {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = 0; t.style.transform = 'translateX(16px)';
    setTimeout(function () { t.remove(); }, 320);
  }, kind === 'bad' ? 5200 : 3400);
}

function modal(opts) {
  var bg = el('div', { class:'modal-bg' });
  var m = el('div', { class:'modal' + (opts.wide ? ' lg' : '') });
  m.innerHTML =
    '<div class="modal-head"><div><h2>' + esc(opts.title) + '</h2>'
    + (opts.sub ? '<p class="small muted" style="margin-top:6px">' + esc(opts.sub) + '</p>' : '')
    + '</div><button class="btn btn-icon btn-quiet" data-x>' + ico('x') + '</button></div>'
    + '<div class="modal-body">' + (opts.body || '') + '</div>'
    + (opts.foot === false ? '' : '<div class="modal-foot">'
        + '<button class="btn btn-ghost" data-x>' + esc(opts.cancel || 'Annuler') + '</button>'
        + '<button class="btn ' + (opts.danger ? 'btn-primary' : 'btn-primary') + '" data-ok>'
        + esc(opts.ok || 'Valider') + '</button></div>');
  bg.appendChild(m); document.body.appendChild(bg);
  document.body.style.overflow = 'hidden';
  function close() { bg.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  $$('[data-x]', m).forEach(function (b) { b.onclick = close; });
  bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
  var okBtn = $('[data-ok]', m);
  if (okBtn) okBtn.onclick = function () {
    var r = opts.onOk ? opts.onOk(m, close, okBtn) : true;
    if (r !== false) close();
  };
  var f = $('input,select,textarea', m); if (f) setTimeout(function () { f.focus(); }, 60);
  return { root:m, close:close };
}

function confirmer(title, text, onYes, danger) {
  modal({ title:title, body:'<p class="muted" style="font-size:14.5px">' + esc(text) + '</p>',
    ok: danger ? 'Supprimer' : 'Confirmer', onOk:function () { onYes(); } });
}

function busy(btn, on, label) {
  if (on) {
    btn.dataset.lbl = btn.innerHTML; btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span><span>' + esc(label || 'Un instant…') + '</span>';
  } else { btn.disabled = false; if (btn.dataset.lbl) btn.innerHTML = btn.dataset.lbl; }
}

function copier(txt) {
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('Copié', 'ok'); });
  else { var i = el('input'); i.value = txt; document.body.appendChild(i); i.select();
    document.execCommand('copy'); i.remove(); toast('Copié','ok'); }
}

/* -------------------------------------------------- 6. Session ----------- */
var SKEY = 'qlab.session';
function session() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } }
function setSession(s) { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); }
function token() { var s = session(); return s && s.token; }

function guard(role, redirect) {
  var s = session();
  if (!s || !s.token || (role && s.role !== role)) { location.replace(redirect || 'connexion.html'); return null; }
  return s;
}
function logout() { var t = token(); if (t) api('qb_logout', { p_token:t }).catch(function(){}); setSession(null); location.replace('connexion.html'); }

/* -------------------------------------------------- 7. Appels backend ---- */
function api(fn, params) {
  if (!LIVE) {
    if (root.QLAB_DEMO) return root.QLAB_DEMO.call(fn, params || {});
    return Promise.reject(new Error(
      'Le service n’est pas configuré. Vérifiez qlab-config.js.'));
  }
  return fetch(CFG.supabaseUrl.replace(/\/$/,'') + '/rest/v1/rpc/' + fn, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', apikey:CFG.supabaseAnonKey,
              Authorization:'Bearer ' + CFG.supabaseAnonKey },
    body: JSON.stringify(params || {})
  }).then(function (r) {
    return r.text().then(function (txt) {
      var data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
      if (!r.ok) {
        var msg = (data && (data.message || data.hint || data.error)) || ('Erreur ' + r.status);
        /* Le schéma n'est pas encore installé, ou l'API n'a pas rechargé son cache :
           inutile d'infliger le message technique de PostgREST au visiteur. */
        if ((data && data.code === 'PGRST202') || /schema cache|does not exist/i.test(msg)) {
          msg = 'Le service est momentanément indisponible. Réessayez dans un instant, '
              + 'ou écrivez-nous depuis la page Contact.';
        } else if (r.status === 401 || r.status === 403) {
          msg = 'Accès refusé par le serveur. Si cela persiste, prévenez-nous.';
        }
        throw new Error(msg);
      }
      if (data && data.error) throw new Error(data.error);
      return data;
    });
  });
}
/* Empreinte navigateur : sert au comptage des tentatives côté serveur. */
function fp() {
  var k = 'qlab.fp', v = localStorage.getItem(k);
  if (!v) { v = uid(); localStorage.setItem(k, v); }
  return v;
}

/* -------------------------------------------------- 8. Bandeau démo ------ */
function demoFlag() {
  if (LIVE) return;
  var b = el('div', { class:'demo-flag' },
    'Service non configuré — renseignez <span class="mono">qlab-config.js</span>.');
  document.body.insertBefore(b, document.body.firstChild);
}

/* -------------------------------------------------- 9. Composants UI ----- */
/* Saisie du code à 6 chiffres */
function codeInput(host, onComplete) {
  host.classList.add('codebox'); host.innerHTML = '';
  var inputs = [];
  for (var i = 0; i < 6; i++) {
    var inp = el('input', { type:'text', inputmode:'numeric', maxlength:'1',
      autocomplete: i === 0 ? 'one-time-code' : 'off', 'aria-label':'Chiffre ' + (i+1) });
    host.appendChild(inp); inputs.push(inp);
  }
  function value() { return inputs.map(function (x) { return x.value; }).join(''); }
  inputs.forEach(function (inp, idx) {
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g,'').slice(0,1);
      inp.classList.toggle('filled', !!inp.value);
      if (inp.value && idx < 5) inputs[idx+1].focus();
      if (value().length === 6) onComplete(value());
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !inp.value && idx > 0) { inputs[idx-1].focus(); inputs[idx-1].value=''; inputs[idx-1].classList.remove('filled'); e.preventDefault(); }
      if (e.key === 'ArrowLeft' && idx > 0) inputs[idx-1].focus();
      if (e.key === 'ArrowRight' && idx < 5) inputs[idx+1].focus();
    });
    inp.addEventListener('paste', function (e) {
      e.preventDefault();
      var d = (e.clipboardData.getData('text') || '').replace(/\D/g,'').slice(0,6);
      d.split('').forEach(function (c, k) { if (inputs[k]) { inputs[k].value = c; inputs[k].classList.add('filled'); } });
      inputs[Math.min(d.length,5)].focus();
      if (d.length === 6) onComplete(d);
    });
  });
  return {
    focus:function () { inputs[0].focus(); },
    clear:function () { inputs.forEach(function (x) { x.value=''; x.classList.remove('filled'); }); inputs[0].focus(); },
    shake:function () { host.classList.add('shake'); setTimeout(function(){ host.classList.remove('shake'); }, 460); },
    value:value
  };
}

/* Curseur de budget cranté */
function budgetSlider(host, steps, initialIndex, onChange) {
  var idx = initialIndex == null ? 4 : initialIndex;
  host.classList.add('budget');
  host.innerHTML =
    '<div class="row-between"><div><div class="budget-val" data-v></div>'
    + '<div class="budget-note" data-n></div></div></div>'
    + '<input class="range" type="range" min="0" max="' + (steps.length-1) + '" step="1" value="' + idx + '">'
    + '<div class="range-ticks"><span>' + money(steps[0]) + '</span>'
    + '<span>' + money(steps[steps.length-1]) + ' et +</span></div>';
  var r = $('.range', host), v = $('[data-v]', host), n = $('[data-n]', host);
  function paint() {
    var i = +r.value, val = steps[i], last = i === steps.length - 1;
    v.innerHTML = money(val) + (last ? '<small>et plus</small>' : '');
    n.textContent = i === 0 ? 'Petit projet, périmètre resserré.'
      : last ? 'Programme sur mesure — on en parle de vive voix.'
      : 'Enveloppe indicative, ajustable après le cadrage.';
    r.style.setProperty('--pct', (i / (steps.length-1) * 100) + '%');
    if (onChange) onChange(val, i);
  }
  r.addEventListener('input', paint); paint();
  return { value:function () { return steps[+r.value]; } };
}

/* Barre de phases du projet */
function phaseBar(host, currentId) {
  var cur = PHASES.findIndex(function (p) { return p.id === currentId; });
  if (cur < 0) cur = 0;
  host.className = 'phasebar';
  host.innerHTML = '<div class="steps">' + PHASES.map(function (p, i) {
      var cls = i < cur ? 'done' : i === cur ? 'now done' : '';
      return '<div class="step ' + cls + '"><div class="step-bar"><i style="animation-delay:'
        + (i * 90) + 'ms"></i></div><div class="step-lbl">' + esc(p.label) + '</div></div>';
    }).join('') + '</div>'
    + '<div class="steps-now">Étape ' + (cur + 1) + ' sur ' + PHASES.length
    + ' · <b>' + esc(PHASES[cur].label) + '</b></div>';
}

/* Menu latéral repliable en mobile */
function railToggle() {
  var rail = $('.rail'), b = $('.burger-app');
  if (!rail || !b) return;
  b.onclick = function () {
    rail.classList.add('open');
    var s = el('div', { class:'rail-scrim' });
    s.onclick = function () { rail.classList.remove('open'); s.remove(); };
    document.body.appendChild(s);
  };
}

/* Lecture d'un fichier -> base64 */
function readFile(file) {
  return new Promise(function (res, rej) {
    var r = new FileReader();
    r.onload = function () { res(String(r.result).split(',')[1]); };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function download(name, mime, b64) {
  var bin = atob(b64), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  var url = URL.createObjectURL(new Blob([arr], { type: mime || 'application/octet-stream' }));
  var a = el('a', { href:url, download:name }); document.body.appendChild(a); a.click();
  a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
}
function extOf(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : 'fic'; }

/* -------------------------------------------------- 10. Exposition ------- */
root.QL = {
  LIVE:LIVE, CFG:CFG,
  NATURES:NATURES, SECTEURS:SECTEURS, BUDGETS:BUDGETS, CONTACTS:CONTACTS,
  PHASES:PHASES, UPDATE_KINDS:UPDATE_KINDS, LINK_KINDS:LINK_KINDS,
  $:$, $$:$$, el:el, esc:esc, ico:ico, I:I,
  money:money, dateFull:dateFull, dateTime:dateTime, since:since, bytes:bytes,
  uid:uid, sha256:sha256, debounce:debounce, extOf:extOf,
  toast:toast, modal:modal, confirmer:confirmer, busy:busy, copier:copier,
  session:session, setSession:setSession, token:token, guard:guard, logout:logout,
  api:api, fp:fp, demoFlag:demoFlag,
  codeInput:codeInput, budgetSlider:budgetSlider, phaseBar:phaseBar,
  railToggle:railToggle, readFile:readFile, download:download
};
})(window);
