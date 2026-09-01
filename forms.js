/* ==========================================================================
   QlickLab — Moteur de formulaires
   Rend un schéma en champs interactifs, gère l'état des réponses, et sait
   aussi les restituer en lecture seule pour l'espace d'administration.
   Types simples : text, textarea, select, radio, multi, checkbox, number,
   date, email, url.
   Types modulables : echelle, repeat, couleurs, priorite, fichier.
   ========================================================================== */
(function (root) {
'use strict';
var QL = root.QL, esc = QL.esc, ico = QL.ico, $ = QL.$, $$ = QL.$$;

var TYPES = [
  ['text',     'Texte court'],
  ['textarea', 'Texte long'],
  ['select',   'Liste déroulante'],
  ['radio',    'Choix unique'],
  ['multi',    'Choix multiples'],
  ['checkbox', 'Case à cocher'],
  ['number',   'Nombre'],
  ['date',     'Date'],
  ['email',    'E-mail'],
  ['url',      'Adresse web'],
  ['echelle',  'Curseur entre deux pôles'],
  ['repeat',   'Liste à rallonge'],
  ['couleurs', 'Couleurs'],
  ['priorite', 'Classement par importance'],
  ['fichier',  'Dépôt de fichiers']
];
/* Ce que veut dire « options » selon le type, pour guider dans l'éditeur. */
var OPTIONS_LABEL = {
  select:'Choix possibles, séparés par une virgule',
  radio:'Choix possibles, séparés par une virgule',
  multi:'Choix possibles, séparés par une virgule',
  priorite:'Éléments à classer, séparés par une virgule',
  echelle:'Les deux pôles, séparés par une virgule — ex. : Sobre, Expressif',
  repeat:'Colonnes de chaque ligne, séparées par une virgule — ex. : Titre, Lien, Pourquoi'
};
function usesOptions(t) { return !!OPTIONS_LABEL[t]; }

function clone(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
function vide(v) {
  return v == null || v === '' || (Array.isArray(v) && v.length === 0);
}

/* ------------------------------------------------------------------------ */
/*  Moteur : rendu + état                                                    */
/* ------------------------------------------------------------------------ */
function engine(schema, answers, opts) {
  opts = opts || {};
  var ro = !!opts.readonly;
  var state = {};
  var host = null;
  schema = schema || [];
  schema.forEach(function (f) {
    var v = answers && answers[f.key] != null ? clone(answers[f.key]) : null;
    state[f.key] = v == null ? defaut(f) : v;
  });

  function defaut(f) {
    if (f.type === 'echelle')  return 50;
    if (f.type === 'priorite') return (f.options || []).slice();
    if (f.type === 'multi' || f.type === 'repeat' ||
        f.type === 'couleurs' || f.type === 'fichier') return [];
    if (f.type === 'checkbox') return false;
    return '';
  }
  function touche() { if (opts.onChange) opts.onChange(state); }

  /* --------------------------------------------------- rendu des champs -- */
  function html() {
    return schema.map(function (f) {
      return '<div class="field" data-k="' + esc(f.key) + '">'
        + '<label>' + esc(f.label) + (f.required ? ' <span class="req">*</span>' : '') + '</label>'
        + (f.help ? '<p class="hint">' + esc(f.help) + '</p>' : '')
        + '<div data-slot="' + esc(f.key) + '">' + controle(f) + '</div></div>';
    }).join('');
  }

  function controle(f) {
    var v = state[f.key], d = ro ? ' disabled' : '';
    switch (f.type) {

      case 'textarea':
        return '<textarea class="textarea" data-f="' + esc(f.key) + '"'
          + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + d + '>'
          + esc(v || '') + '</textarea>';

      case 'select':
        return '<select class="select" data-f="' + esc(f.key) + '"' + d + '>'
          + '<option value="">Choisir…</option>'
          + (f.options || []).map(function (o) {
              return '<option' + (v === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('')
          + '</select>';

      case 'radio':
        return '<div class="opts">' + (f.options || []).map(function (o) {
          return '<label class="opt"><input type="radio" name="r_' + esc(f.key) + '" value="' + esc(o) + '"'
            + (v === o ? ' checked' : '') + d + '><span class="dot"></span>'
            + '<span class="grow"><b class="ttl">' + esc(o) + '</b></span></label>'; }).join('') + '</div>';

      case 'multi':
        var arr = Array.isArray(v) ? v : [];
        return '<div class="row wrapfx" style="gap:8px">' + (f.options || []).map(function (o) {
          return '<label class="chip' + (arr.indexOf(o) >= 0 ? ' on' : '') + '">'
            + '<input type="checkbox" style="display:none" data-multi value="' + esc(o) + '"'
            + (arr.indexOf(o) >= 0 ? ' checked' : '') + d + '>' + esc(o) + '</label>'; }).join('') + '</div>';

      case 'checkbox':
        return '<label class="check"><input type="checkbox" data-f="' + esc(f.key) + '"'
          + (v ? ' checked' : '') + d + '><span>' + esc(f.placeholder || 'Oui') + '</span></label>';

      /* ---- Curseur entre deux pôles ---- */
      case 'echelle':
        var p = f.options && f.options.length >= 2 ? f.options : ['Plutôt non', 'Plutôt oui'];
        var n = typeof v === 'number' ? v : 50;
        return '<div class="scale">'
          + '<div class="scale-poles"><span>' + esc(p[0]) + '</span><span>' + esc(p[1]) + '</span></div>'
          + '<input class="range" type="range" min="0" max="100" step="5" value="' + n + '" data-f="' + esc(f.key) + '"' + d + '>'
          + '<div class="scale-read" data-read>' + lecture(n, p) + '</div></div>';

      /* ---- Liste à rallonge ---- */
      case 'repeat':
        var cols = (f.options && f.options.length ? f.options : ['Élément']);
        var lignes = Array.isArray(v) ? v : [];
        return '<div class="rep">'
          + (lignes.length ? lignes.map(function (ln, i) {
              return '<div class="rep-row">'
                + '<span class="rep-no">' + (i + 1) + '</span>'
                + '<div class="rep-fields">' + cols.map(function (c) {
                    return '<input class="input" placeholder="' + esc(c) + '" value="'
                      + esc(ln[c] || '') + '" data-rep="' + esc(f.key) + '" data-i="' + i
                      + '" data-c="' + esc(c) + '"' + d + '>'; }).join('') + '</div>'
                + (ro ? '' : '<button type="button" class="btn btn-icon btn-danger" data-rmrep="' + esc(f.key)
                    + '" data-i="' + i + '" aria-label="Retirer">' + ico('trash') + '</button>')
                + '</div>'; }).join('')
            : '<p class="small faint" style="margin:0 0 10px">Aucune ligne pour l’instant.</p>')
          + (ro ? '' : '<button type="button" class="btn btn-ghost btn-sm rep-add" data-addrep="' + esc(f.key) + '">'
              + ico('plus') + '<span>Ajouter une ligne</span></button>')
          + '</div>';

      /* ---- Couleurs ---- */
      case 'couleurs':
        var cs = Array.isArray(v) ? v : [];
        return '<div class="swatches">'
          + cs.map(function (c, i) {
              return '<span class="sw"><input type="color" value="' + esc(c) + '" data-col="' + esc(f.key)
                + '" data-i="' + i + '"' + d + '>'
                + '<input class="sw-hex" value="' + esc(c) + '" data-colhex="' + esc(f.key)
                + '" data-i="' + i + '" spellcheck="false"' + d + '>'
                + (ro ? '' : '<button type="button" class="sw-x" data-rmcol="' + esc(f.key)
                    + '" data-i="' + i + '" aria-label="Retirer">' + ico('x') + '</button>')
                + '</span>'; }).join('')
          + (ro ? (cs.length ? '' : '<span class="small faint">Aucune couleur.</span>')
                : '<button type="button" class="btn btn-ghost btn-sm" data-addcol="' + esc(f.key) + '">'
                  + ico('plus') + '<span>Ajouter</span></button>')
          + '</div>';

      /* ---- Classement ---- */
      case 'priorite':
        var ordre = Array.isArray(v) && v.length ? v : (f.options || []).slice();
        return '<div class="rank">' + ordre.map(function (o, i) {
          return '<div class="rank-item"><span class="rank-no">' + (i + 1) + '</span>'
            + '<span class="grow">' + esc(o) + '</span>'
            + (ro ? '' : '<span class="row" style="gap:2px">'
                + (i > 0 ? '<button type="button" class="btn btn-icon btn-quiet" data-up="' + esc(f.key)
                    + '" data-i="' + i + '" aria-label="Monter">' + ico('up') + '</button>' : '')
                + (i < ordre.length - 1 ? '<button type="button" class="btn btn-icon btn-quiet" data-down="'
                    + esc(f.key) + '" data-i="' + i + '" aria-label="Descendre">' + ico('down') + '</button>' : '')
                + '</span>')
            + '</div>'; }).join('') + '</div>';

      /* ---- Dépôt de fichiers ---- */
      case 'fichier':
        var fs = Array.isArray(v) ? v : [];
        return '<div class="filefield">'
          + (fs.length ? '<div class="stack stack-6" style="margin-bottom:10px">' + fs.map(function (x, i) {
              return '<div class="ff-row"><span class="file-ic">' + esc(QL.extOf(x.name).slice(0,4)) + '</span>'
                + '<span class="grow truncate">' + esc(x.name) + '</span>'
                + (ro ? '' : '<button type="button" class="btn btn-icon btn-danger" data-rmfile="' + esc(f.key)
                    + '" data-i="' + i + '" aria-label="Retirer">' + ico('trash') + '</button>')
                + '</div>'; }).join('') + '</div>' : '')
          + (ro ? (fs.length ? '' : '<span class="small faint">Aucun fichier.</span>')
                : '<label class="drop drop-sm">' + ico('cloud')
                  + '<b>Déposer un fichier</b><span>Images, PDF, tout format · 9 Mo maximum</span>'
                  + '<input type="file" multiple style="display:none" data-file="' + esc(f.key) + '"></label>')
          + '</div>';

      default:
        return '<input class="input" data-f="' + esc(f.key) + '" type="' + (f.type || 'text') + '" value="'
          + esc(v || '') + '"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + d + '>';
    }
  }

  function lecture(n, p) {
    if (n <= 15) return 'Franchement ' + p[0].toLowerCase();
    if (n <= 40) return 'Plutôt ' + p[0].toLowerCase();
    if (n < 60)  return 'Entre les deux';
    if (n < 85)  return 'Plutôt ' + p[1].toLowerCase();
    return 'Franchement ' + p[1].toLowerCase();
  }

  function refresh(f) {
    var slot = $('[data-slot="' + f.key + '"]', host);
    if (slot) { slot.innerHTML = controle(f); brancher(); }
  }
  function champ(k) { return schema.filter(function (f) { return f.key === k; })[0]; }

  /* ------------------------------------------------------- interactions -- */
  function brancher() {
    if (ro || !host) return;

    $$('[data-f]', host).forEach(function (n) {
      n.oninput = n.onchange = function () {
        var f = champ(n.dataset.f);
        if (!f) return;
        if (f.type === 'checkbox') state[f.key] = n.checked;
        else if (f.type === 'echelle') {
          state[f.key] = +n.value;
          n.style.setProperty('--pct', n.value + '%');
          var r = $('[data-read]', n.parentNode);
          if (r) r.textContent = lecture(+n.value,
            f.options && f.options.length >= 2 ? f.options : ['Plutôt non', 'Plutôt oui']);
        } else state[f.key] = n.value;
        touche();
      };
      if (n.type === 'range') n.style.setProperty('--pct', n.value + '%');
    });

    $$('input[type=radio]', host).forEach(function (n) {
      n.onchange = function () {
        var k = n.name.replace(/^r_/, '');
        state[k] = n.value; touche();
      };
    });

    $$('[data-multi]', host).forEach(function (n) {
      n.onchange = function () {
        n.parentNode.classList.toggle('on', n.checked);
        var k = n.closest('[data-slot]').dataset.slot;
        state[k] = $$('[data-multi]', n.closest('[data-slot]'))
          .filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
        touche();
      };
    });

    /* Liste à rallonge */
    $$('[data-addrep]', host).forEach(function (b) {
      b.onclick = function () {
        var f = champ(b.dataset.addrep);
        if (!Array.isArray(state[f.key])) state[f.key] = [];
        var ligne = {}; (f.options || ['Élément']).forEach(function (c) { ligne[c] = ''; });
        state[f.key].push(ligne); refresh(f); touche();
        var champs = $$('[data-rep="' + f.key + '"]', host);
        if (champs.length) champs[champs.length - (f.options || ['x']).length].focus();
      };
    });
    $$('[data-rmrep]', host).forEach(function (b) {
      b.onclick = function () {
        var f = champ(b.dataset.rmrep);
        state[f.key].splice(+b.dataset.i, 1); refresh(f); touche();
      };
    });
    $$('[data-rep]', host).forEach(function (n) {
      n.oninput = function () {
        state[n.dataset.rep][+n.dataset.i][n.dataset.c] = n.value; touche();
      };
    });

    /* Couleurs */
    $$('[data-addcol]', host).forEach(function (b) {
      b.onclick = function () {
        var f = champ(b.dataset.addcol);
        if (!Array.isArray(state[f.key])) state[f.key] = [];
        state[f.key].push('#A62FBD'); refresh(f); touche();
      };
    });
    $$('[data-rmcol]', host).forEach(function (b) {
      b.onclick = function () {
        var f = champ(b.dataset.rmcol);
        state[f.key].splice(+b.dataset.i, 1); refresh(f); touche();
      };
    });
    $$('[data-col]', host).forEach(function (n) {
      n.oninput = function () {
        state[n.dataset.col][+n.dataset.i] = n.value;
        var hex = $('[data-colhex="' + n.dataset.col + '"][data-i="' + n.dataset.i + '"]', host);
        if (hex) hex.value = n.value;
        touche();
      };
    });
    $$('[data-colhex]', host).forEach(function (n) {
      n.oninput = function () {
        var v = n.value.trim();
        if (!/^#/.test(v)) v = '#' + v;
        if (/^#[0-9a-f]{6}$/i.test(v)) {
          state[n.dataset.colhex][+n.dataset.i] = v;
          var pick = $('[data-col="' + n.dataset.colhex + '"][data-i="' + n.dataset.i + '"]', host);
          if (pick) pick.value = v;
          touche();
        }
      };
    });

    /* Classement */
    function bouger(k, i, delta) {
      var f = champ(k), a = state[f.key];
      if (!Array.isArray(a)) a = state[f.key] = (f.options || []).slice();
      a.splice(i + delta, 0, a.splice(i, 1)[0]);
      refresh(f); touche();
    }
    $$('[data-up]', host).forEach(function (b) {
      b.onclick = function () { bouger(b.dataset.up, +b.dataset.i, -1); }; });
    $$('[data-down]', host).forEach(function (b) {
      b.onclick = function () { bouger(b.dataset.down, +b.dataset.i, 1); }; });

    /* Dépôt de fichiers */
    $$('[data-file]', host).forEach(function (n) {
      n.onchange = function () {
        var f = champ(n.dataset.file);
        var liste = Array.prototype.slice.call(n.files); n.value = '';
        if (!liste.length || !opts.upload) return;
        var lourds = liste.filter(function (x) { return x.size > 9 * 1024 * 1024; });
        if (lourds.length) {
          QL.toast(lourds[0].name + ' dépasse 9 Mo.', 'bad');
          liste = liste.filter(function (x) { return x.size <= 9 * 1024 * 1024; });
        }
        if (!liste.length) return;
        QL.toast('Envoi de ' + liste.length + ' fichier' + (liste.length > 1 ? 's' : '') + '…');
        Promise.all(liste.map(opts.upload)).then(function (docs) {
          if (!Array.isArray(state[f.key])) state[f.key] = [];
          docs.forEach(function (d) { if (d) state[f.key].push(d); });
          refresh(f); touche(); QL.toast('Fichier ajouté', 'ok');
        }).catch(function (e) { QL.toast(e.message || 'Envoi impossible.', 'bad'); });
      };
    });
  }

  return {
    html: html,
    mount: function (n) { host = n; brancher(); },
    value: function () { return clone(state); },
    manquants: function () {
      return schema.filter(function (f) {
        if (!f.required) return false;
        var v = state[f.key];
        if (f.type === 'echelle' || f.type === 'priorite') return false;
        if (f.type === 'checkbox') return v !== true;
        if (f.type === 'repeat') return !Array.isArray(v) || !v.length
          || !v.some(function (l) { return Object.keys(l).some(function (c) { return (l[c] || '').trim(); }); });
        return vide(v);
      });
    }
  };
}

/* ------------------------------------------------------------------------ */
/*  Restitution en lecture (espace d'administration)                         */
/* ------------------------------------------------------------------------ */
function reponse(f, v) {
  if (vide(v) && typeof v !== 'number' && v !== false)
    return '<span class="faint">Sans réponse</span>';
  switch (f.type) {
    case 'echelle':
      var p = f.options && f.options.length >= 2 ? f.options : ['Plutôt non', 'Plutôt oui'];
      var n = typeof v === 'number' ? v : 50;
      return '<div class="ans-scale"><div class="ans-scale-bar"><i style="left:' + n + '%"></i></div>'
        + '<div class="row-between xsmall faint"><span>' + esc(p[0]) + '</span>'
        + '<b style="color:var(--ink)">' + n + ' / 100</b><span>' + esc(p[1]) + '</span></div></div>';
    case 'couleurs':
      return '<div class="row wrapfx" style="gap:8px">' + v.map(function (c) {
        return '<span class="row" style="gap:6px"><span style="width:20px;height:20px;border-radius:6px;'
          + 'border:1px solid var(--line-2);background:' + esc(c) + '"></span>'
          + '<span class="mono small">' + esc(c) + '</span></span>'; }).join('') + '</div>';
    case 'priorite':
      return '<ol style="margin:0;padding-left:20px">' + v.map(function (o) {
        return '<li>' + esc(o) + '</li>'; }).join('') + '</ol>';
    case 'repeat':
      var cols = f.options && f.options.length ? f.options : ['Élément'];
      return '<div class="stack stack-6">' + v.filter(function (l) {
          return Object.keys(l).some(function (c) { return (l[c] || '').trim(); });
        }).map(function (l) {
        return '<div class="ans-line">' + cols.map(function (c) {
          return l[c] ? '<span><i>' + esc(c) + '</i> ' + esc(l[c]) + '</span>' : ''; }).join('') + '</div>';
      }).join('') + '</div>';
    case 'fichier':
      return '<div class="stack stack-6">' + v.map(function (x) {
        return '<button class="ans-file" data-doc="' + esc(x.id) + '">' + ico('dl')
          + '<span>' + esc(x.name) + '</span></button>'; }).join('') + '</div>';
    case 'multi':
      return (Array.isArray(v) ? v : [v]).map(function (o) {
        return '<span class="badge plain" style="margin:0 6px 6px 0">' + esc(o) + '</span>'; }).join('');
    case 'checkbox':
      return v ? 'Oui' : 'Non';
    default:
      return esc(String(v));
  }
}

QL.form = { engine: engine, reponse: reponse, TYPES: TYPES,
            OPTIONS_LABEL: OPTIONS_LABEL, usesOptions: usesOptions };
})(window);
