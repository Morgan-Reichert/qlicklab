/* ==========================================================================
   QlickLab — Backend de DÉMONSTRATION (navigateur uniquement)
   Reproduit à l'identique le contrat des fonctions RPC Supabase afin que
   l'interface soit utilisable avant le branchement du vrai backend.
   Dès que qlab-config.js est renseigné, ce fichier n'est plus sollicité.
   ========================================================================== */
(function (root) {
'use strict';

var DB_KEY = 'qlab.demo.db.v1';
/* Empreintes SHA-256 : le mot de passe et le code promo ne figurent pas en clair. */
var ADMIN_HASH = '81a85a35260234114b0c90c741e1dfa818c13a7dae20b09fa66b799f42e32d9d';
var PROMO_HASH = '5f7d42e585cec7abcf0adb51ed2ea2358a64f9ff8e9e4573c4c0f4e5458eca0d';

function uid() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function now() { return new Date().toISOString(); }
function ago(d) { return new Date(Date.now() - d * 86400000).toISOString(); }
async function sha(t) {
  var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
}

/* ---------------------------------------------- Jeu de données initial --- */
function seed() {
  var cid = 'demo-client-1';
  return {
    settings: {
      fee_amount: 49,
      currency: 'EUR',
      payment_instructions:
        'Les frais de dossier sont réglés par virement à réception de nos coordonnées bancaires, '
        + 'ou via le lien de paiement que nous vous adressons. Votre code d’accès est délivré dès réception.',
      cgu_version: '2026-09'
    },
    clients: [{
      id: cid, code: '482913',
      business_name: 'Studio Carelin', project_nature: 'app-web',
      sector: 'SASU', budget: 15000,
      contact_method: 'mail', contact_value: 'contact@carelin.fr',
      brief: 'Nous voulons remplacer nos tableurs par un vrai espace de suivi pour nos 40 intervenants.',
      fee_amount: 0, fee_status: 'offert', promo_code: 'MarsSim2025$',
      account_status: 'actif', cgu_accepted_at: ago(24),
      project_title: 'Espace de coordination Carelin',
      project_phase: 'conception', progress: 38,
      summary: 'Un espace web unique pour planifier les interventions, suivre les dossiers '
             + 'et centraliser les documents. Première version utilisable visée pour la fin du trimestre.',
      notes: 'Interlocutrice : Nadia. Répond vite par mail, préfère les points le mardi.',
      created_at: ago(24)
    }],
    forms: [
      { id: 'f-cadrage', title: 'Cadrage du besoin',
        description: 'Dix minutes pour poser le périmètre : ce que l’outil doit faire, pour qui, et ce qu’il ne fera pas.',
        schema: [
          { key: 'objectif', label: 'En une phrase, à quoi sert ce projet ?', type: 'textarea', required: true,
            placeholder: 'Ex. : permettre à nos coordinateurs de planifier les interventions sans passer par le tableur.' },
          { key: 'cibles', label: 'Qui va s’en servir au quotidien ?', type: 'textarea', required: true,
            help: 'Profils, nombre de personnes, niveau d’aisance avec le numérique.' },
          { key: 'existant', label: 'Qu’utilisez-vous aujourd’hui ?', type: 'select', required: true,
            options: ['Rien de formalisé', 'Tableurs', 'Un logiciel du marché', 'Un outil interne', 'Autre'] },
          { key: 'must', label: 'Les trois fonctions indispensables', type: 'textarea', required: true },
          { key: 'jamais', label: 'Ce que le projet ne doit surtout pas faire', type: 'textarea',
            help: 'Aussi utile que la liste précédente : ça évite de construire pour rien.' },
          { key: 'echeance', label: 'Échéance souhaitée', type: 'date' },
          { key: 'contraintes', label: 'Contraintes connues', type: 'multi',
            options: ['Marché public', 'RGPD sensible', 'Hébergement en France', 'Accessibilité RGAA',
                      'Reprise de données', 'Intégration à un outil existant'] }
        ] },
      { id: 'f-identite', title: 'Identité & ton',
        description: 'Ce qui fera que le résultat vous ressemble.',
        schema: [
          { key: 'logo', label: 'Avez-vous un logo exploitable ?', type: 'radio', required: true,
            options: ['Oui, en vectoriel', 'Oui, en image seulement', 'Non, à créer'] },
          { key: 'couleurs', label: 'Couleurs imposées', type: 'text', placeholder: '#A62FBD, #F97316…' },
          { key: 'refs', label: 'Deux ou trois sites que vous trouvez réussis', type: 'textarea',
            help: 'Et en une ligne, ce qui vous plaît dans chacun.' },
          { key: 'ton', label: 'Le ton juste pour vous', type: 'select',
            options: ['Institutionnel', 'Chaleureux', 'Direct et sobre', 'Enjoué', 'Technique'] }
        ] },
      { id: 'f-acces', title: 'Accès techniques',
        description: 'Les comptes nécessaires à la mise en ligne. À remplir seulement quand nous vous le demandons.',
        schema: [
          { key: 'domaine', label: 'Nom de domaine', type: 'text', placeholder: 'exemple.fr' },
          { key: 'registrar', label: 'Chez quel hébergeur / bureau d’enregistrement ?', type: 'text' },
          { key: 'analytics', label: 'Souhaitez-vous une mesure d’audience ?', type: 'radio',
            options: ['Oui, respectueuse de la vie privée', 'Non'] },
          { key: 'remarques', label: 'Remarques', type: 'textarea' }
        ] },
      { id: 'f-contenus', title: 'Contenus & rédaction',
        description: 'Qui écrit quoi, et quand.',
        schema: [
          { key: 'redaction', label: 'Qui rédige les textes ?', type: 'radio', required: true,
            options: ['Nous les fournissons', 'QlickLab les rédige', 'À quatre mains'] },
          { key: 'pages', label: 'Pages ou écrans attendus', type: 'textarea', required: true },
          { key: 'photos', label: 'Disposez-vous de photos ?', type: 'radio',
            options: ['Oui', 'Non', 'Partiellement'] }
        ] }
    ],
    assignments: [
      { id: 'a1', client_id: cid, form_id: 'f-cadrage', status: 'submitted', assigned_at: ago(22),
        submitted_at: ago(19), due_at: null,
        answers: { objectif: 'Remplacer nos tableurs par un espace de suivi partagé.',
          cibles: '40 intervenants sur le terrain, 4 coordinateurs au bureau.',
          existant: 'Tableurs', must: 'Planning, fiches bénéficiaires, export mensuel.',
          jamais: 'Pas de messagerie interne, nous avons déjà un outil.',
          echeance: '', contraintes: ['RGPD sensible', 'Hébergement en France'] } },
      { id: 'a2', client_id: cid, form_id: 'f-identite', status: 'active', assigned_at: ago(6),
        submitted_at: null, due_at: null, answers: {} },
      { id: 'a3', client_id: cid, form_id: 'f-contenus', status: 'active', assigned_at: ago(2),
        submitted_at: null, due_at: null, answers: {} }
    ],
    updates: [
      { id: 'u1', client_id: cid, kind: 'jalon', title: 'Cadrage validé',
        body: 'Le périmètre de la première version est arrêté : planning, fiches bénéficiaires et export mensuel. '
            + 'La messagerie interne est explicitement hors périmètre.', created_at: ago(19) },
      { id: 'u2', client_id: cid, kind: 'info', title: 'Maquettes des trois écrans principaux',
        body: 'Les maquettes du planning, de la fiche bénéficiaire et du tableau de bord sont consultables '
            + 'dans les liens du projet. Vos retours sont attendus pour la fin de semaine.', created_at: ago(9) },
      { id: 'u3', client_id: cid, kind: 'alerte', title: 'En attente de vos accès',
        body: 'Il nous manque le nom de domaine et l’accès au bureau d’enregistrement pour préparer la mise en ligne. '
            + 'Le formulaire « Accès techniques » sera activé dès que vous serez prêts.', created_at: ago(3) }
    ],
    links: [
      { id: 'l1', client_id: cid, label: 'Maquettes interactives', url: 'https://example.com/maquettes',
        kind: 'design', created_at: ago(9) },
      { id: 'l2', client_id: cid, label: 'Version de test', url: 'https://example.com/preview',
        kind: 'preview', created_at: ago(5) }
    ],
    documents: [
      { id: 'd1', client_id: cid, kind: 'file', name: 'logo-carelin.svg', mime: 'image/svg+xml',
        size: 24576, note: 'Version vectorielle fournie par le client', uploaded_by: 'client',
        b64: '', created_at: ago(20) },
      { id: 'd2', client_id: cid, kind: 'link', name: 'Charte graphique 2024',
        url: 'https://example.com/charte.pdf', note: '', uploaded_by: 'client', created_at: ago(18) }
    ],
    sessions: {},
    attempts: []
  };
}

function load() {
  var raw = localStorage.getItem(DB_KEY);
  if (!raw) { var d = seed(); save(d); return d; }
  try { return JSON.parse(raw); } catch (e) { var s = seed(); save(s); return s; }
}
function save(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

/* ---------------------------------------------------------- Utilitaires - */
function fail(msg) { var e = new Error(msg); e.handled = true; throw e; }
function auth(db, tok, role) {
  var s = db.sessions[tok];
  if (!s || new Date(s.expires) < new Date()) fail('Session expirée. Reconnectez-vous.');
  if (role && s.role !== role) fail('Accès refusé.');
  return s;
}
function newCode(db) {
  var c, guard = 0;
  do { c = String(Math.floor(100000 + Math.random() * 900000)); guard++; }
  while (db.clients.some(function (x) { return x.code === c; }) && guard < 200);
  return c;
}
function mkSession(db, role, client_id) {
  var tok = uid() + uid();
  db.sessions[tok] = { role: role, client_id: client_id || null,
    expires: new Date(Date.now() + 12 * 3600000).toISOString() };
  return tok;
}
function pub(c) {
  return { id: c.id, code: c.code, business_name: c.business_name, project_nature: c.project_nature,
    sector: c.sector, budget: c.budget, contact_method: c.contact_method, contact_value: c.contact_value,
    brief: c.brief, fee_amount: c.fee_amount, fee_status: c.fee_status, account_status: c.account_status,
    project_title: c.project_title, project_phase: c.project_phase, progress: c.progress,
    summary: c.summary, created_at: c.created_at };
}
function throttle(db, fpv) {
  var lim = new Date(Date.now() - 15 * 60000).toISOString();
  db.attempts = db.attempts.filter(function (a) { return a.at > lim; });
  var bad = db.attempts.filter(function (a) { return a.fp === fpv && !a.ok; }).length;
  if (bad >= 8) fail('Trop de tentatives. Réessayez dans quelques minutes.');
}

/* --------------------------------------------------------- Répartiteur -- */
var H = {};

H.qb_settings = function (db) {
  return { fee_amount: db.settings.fee_amount, currency: db.settings.currency,
    payment_instructions: db.settings.payment_instructions, cgu_version: db.settings.cgu_version };
};

H.qb_signup = async function (db, p) {
  var d = p.p_payload || {};
  ['business_name', 'project_nature', 'sector', 'contact_method', 'contact_value'].forEach(function (k) {
    if (!d[k]) fail('Champ manquant : ' + k);
  });
  if (!d.cgu) fail('Les conditions doivent être acceptées.');
  var fee = db.settings.fee_amount, feeStatus = 'du', promo = null;
  if (d.promo_code) {
    if (await sha(String(d.promo_code).trim()) === PROMO_HASH) {
      fee = 0; feeStatus = 'offert'; promo = String(d.promo_code).trim();
    } else fail('Code promotionnel inconnu.');
  }
  var c = {
    id: uid(), code: newCode(db),
    business_name: String(d.business_name).trim(), project_nature: d.project_nature,
    sector: d.sector, budget: Number(d.budget) || 0,
    contact_method: d.contact_method, contact_value: String(d.contact_value).trim(),
    brief: (d.brief || '').trim(),
    fee_amount: fee, fee_status: feeStatus, promo_code: promo,
    account_status: feeStatus === 'offert' ? 'actif' : 'attente_paiement',
    cgu_accepted_at: now(), project_title: '', project_phase: 'cadrage', progress: 0,
    summary: '', notes: '', created_at: now()
  };
  db.clients.unshift(c); save(db);
  return { ok: true, status: c.account_status, fee_amount: fee, fee_status: feeStatus,
    code: c.account_status === 'actif' ? c.code : null,
    payment_instructions: db.settings.payment_instructions };
};

H.qb_client_login = function (db, p) {
  throttle(db, p.p_fp);
  var code = String(p.p_code || '').trim();
  var c = db.clients.filter(function (x) { return x.code === code; })[0];
  var ok = !!c && c.account_status === 'actif';
  db.attempts.push({ fp: p.p_fp, ok: ok, at: now() });
  if (!c) { save(db); fail('Code inconnu. Vérifiez les six chiffres.'); }
  if (c.account_status === 'attente_paiement')
    { save(db); fail('Votre dossier est en attente de règlement des frais.'); }
  if (c.account_status === 'suspendu') { save(db); fail('Cet accès est suspendu.'); }
  var tok = mkSession(db, 'client', c.id); save(db);
  return { token: tok, role: 'client', client: pub(c) };
};

H.qb_admin_login = async function (db, p) {
  throttle(db, p.p_fp);
  var h = await sha(String(p.p_username || '').trim().toLowerCase() + '|' + String(p.p_password || ''));
  var ok = h === ADMIN_HASH;
  db.attempts.push({ fp: p.p_fp, ok: ok, at: now() });
  if (!ok) { save(db); fail('Identifiant ou mot de passe incorrect.'); }
  var tok = mkSession(db, 'admin'); save(db);
  return { token: tok, role: 'admin' };
};

H.qb_logout = function (db, p) { delete db.sessions[p.p_token]; save(db); return { ok: true }; };

H.qb_me = function (db, p) {
  var s = auth(db, p.p_token);
  if (s.role === 'admin') return { role: 'admin' };
  var c = db.clients.filter(function (x) { return x.id === s.client_id; })[0];
  return { role: 'client', client: c ? pub(c) : null };
};

function bundle(db, cid, isAdmin) {
  var c = db.clients.filter(function (x) { return x.id === cid; })[0];
  if (!c) fail('Dossier introuvable.');
  var forms = db.assignments.filter(function (a) { return a.client_id === cid; })
    .map(function (a) {
      var f = db.forms.filter(function (x) { return x.id === a.form_id; })[0] || {};
      return { assignment_id: a.id, form_id: a.form_id, title: f.title, description: f.description,
        schema: f.schema || [], status: a.status, answers: a.answers || {},
        assigned_at: a.assigned_at, submitted_at: a.submitted_at, due_at: a.due_at };
    }).sort(function (x, y) { return (x.status === 'active' ? -1 : 1) - (y.status === 'active' ? -1 : 1); });
  var out = {
    client: isAdmin ? Object.assign(pub(c), { notes: c.notes, promo_code: c.promo_code,
      cgu_accepted_at: c.cgu_accepted_at }) : pub(c),
    updates: db.updates.filter(function (u) { return u.client_id === cid; })
      .sort(function (a, b) { return b.created_at.localeCompare(a.created_at); }),
    links: db.links.filter(function (l) { return l.client_id === cid; }),
    forms: forms,
    documents: db.documents.filter(function (d) { return d.client_id === cid; })
      .map(function (d) { return { id: d.id, kind: d.kind, name: d.name, mime: d.mime, size: d.size,
        url: d.url, note: d.note, uploaded_by: d.uploaded_by, created_at: d.created_at }; })
      .sort(function (a, b) { return b.created_at.localeCompare(a.created_at); })
  };
  return out;
}

H.qb_client_data = function (db, p) { var s = auth(db, p.p_token, 'client'); return bundle(db, s.client_id); };

H.qb_form_save = function (db, p) {
  var s = auth(db, p.p_token, 'client');
  var a = db.assignments.filter(function (x) { return x.id === p.p_assignment && x.client_id === s.client_id; })[0];
  if (!a) fail('Formulaire introuvable.');
  if (a.status === 'submitted' && p.p_submit) fail('Ce formulaire a déjà été envoyé.');
  a.answers = p.p_answers || {};
  if (p.p_submit) { a.status = 'submitted'; a.submitted_at = now(); }
  save(db); return { ok: true, status: a.status };
};

H.qb_doc_add = function (db, p) {
  var s = auth(db, p.p_token);
  var cid = s.role === 'admin' ? p.p_client : s.client_id;
  var d = p.p_doc || {};
  if (d.kind === 'file' && d.size > 9 * 1024 * 1024) fail('Fichier trop volumineux (9 Mo maximum).');
  var doc = { id: uid(), client_id: cid, kind: d.kind || 'file', name: d.name,
    mime: d.mime || '', size: d.size || 0, url: d.url || '', note: d.note || '',
    b64: d.b64 || '', uploaded_by: s.role, created_at: now() };
  db.documents.unshift(doc); save(db);
  return { ok: true, id: doc.id };
};
H.qb_doc_get = function (db, p) {
  var s = auth(db, p.p_token);
  var d = db.documents.filter(function (x) { return x.id === p.p_id; })[0];
  if (!d || (s.role === 'client' && d.client_id !== s.client_id)) fail('Document introuvable.');
  if (!d.b64) fail('Ce document de démonstration n’a pas de contenu téléchargeable.');
  return { name: d.name, mime: d.mime, b64: d.b64 };
};
H.qb_doc_delete = function (db, p) {
  var s = auth(db, p.p_token);
  var i = db.documents.findIndex(function (x) { return x.id === p.p_id; });
  if (i < 0) fail('Document introuvable.');
  if (s.role === 'client' && db.documents[i].client_id !== s.client_id) fail('Accès refusé.');
  db.documents.splice(i, 1); save(db); return { ok: true };
};

/* ------------------------------------------------------------- Admin ---- */
H.qb_admin_data = function (db, p) {
  auth(db, p.p_token, 'admin');
  var clients = db.clients.map(function (c) {
    var waiting = db.assignments.filter(function (a) { return a.client_id === c.id && a.status === 'active'; }).length;
    var subs = db.assignments.filter(function (a) { return a.client_id === c.id && a.status === 'submitted'; }).length;
    var last = db.updates.filter(function (u) { return u.client_id === c.id; })
      .sort(function (a, b) { return b.created_at.localeCompare(a.created_at); })[0];
    return Object.assign(pub(c), { forms_active: waiting, forms_done: subs,
      docs: db.documents.filter(function (d) { return d.client_id === c.id; }).length,
      last_update: last ? last.created_at : null });
  });
  return {
    clients: clients,
    forms: db.forms.map(function (f) {
      return { id: f.id, title: f.title, description: f.description, schema: f.schema,
        used: db.assignments.filter(function (a) { return a.form_id === f.id; }).length };
    }),
    settings: db.settings,
    stats: {
      clients: db.clients.filter(function (c) { return c.account_status === 'actif'; }).length,
      pending: db.clients.filter(function (c) { return c.account_status === 'attente_paiement'; }).length,
      forms_waiting: db.assignments.filter(function (a) { return a.status === 'active'; }).length,
      to_review: db.assignments.filter(function (a) { return a.status === 'submitted'; }).length
    }
  };
};
H.qb_admin_client = function (db, p) { auth(db, p.p_token, 'admin'); return bundle(db, p.p_id, true); };

H.qb_admin_client_patch = function (db, p) {
  auth(db, p.p_token, 'admin');
  var c = db.clients.filter(function (x) { return x.id === p.p_id; })[0];
  if (!c) fail('Dossier introuvable.');
  var allow = ['business_name', 'project_nature', 'sector', 'budget', 'contact_method', 'contact_value',
    'brief', 'fee_status', 'fee_amount', 'account_status', 'project_title', 'project_phase',
    'progress', 'summary', 'notes'];
  Object.keys(p.p_patch || {}).forEach(function (k) { if (allow.indexOf(k) >= 0) c[k] = p.p_patch[k]; });
  save(db); return { ok: true, client: pub(c) };
};
H.qb_admin_client_delete = function (db, p) {
  auth(db, p.p_token, 'admin');
  ['clients'].forEach(function () {});
  db.clients = db.clients.filter(function (x) { return x.id !== p.p_id; });
  db.assignments = db.assignments.filter(function (x) { return x.client_id !== p.p_id; });
  db.updates = db.updates.filter(function (x) { return x.client_id !== p.p_id; });
  db.links = db.links.filter(function (x) { return x.client_id !== p.p_id; });
  db.documents = db.documents.filter(function (x) { return x.client_id !== p.p_id; });
  save(db); return { ok: true };
};
H.qb_admin_code_regen = function (db, p) {
  auth(db, p.p_token, 'admin');
  var c = db.clients.filter(function (x) { return x.id === p.p_id; })[0];
  if (!c) fail('Dossier introuvable.');
  c.code = newCode(db); save(db); return { code: c.code };
};
H.qb_admin_form_upsert = function (db, p) {
  auth(db, p.p_token, 'admin');
  var f = p.p_form || {};
  if (!f.title) fail('Titre requis.');
  var ex = f.id && db.forms.filter(function (x) { return x.id === f.id; })[0];
  if (ex) { ex.title = f.title; ex.description = f.description || ''; ex.schema = f.schema || []; }
  else { f.id = uid(); db.forms.push({ id: f.id, title: f.title, description: f.description || '', schema: f.schema || [] }); }
  save(db); return { ok: true, id: ex ? ex.id : f.id };
};
H.qb_admin_form_delete = function (db, p) {
  auth(db, p.p_token, 'admin');
  db.forms = db.forms.filter(function (x) { return x.id !== p.p_id; });
  db.assignments = db.assignments.filter(function (x) { return x.form_id !== p.p_id; });
  save(db); return { ok: true };
};
H.qb_admin_assign = function (db, p) {
  auth(db, p.p_token, 'admin');
  var a = db.assignments.filter(function (x) { return x.client_id === p.p_client && x.form_id === p.p_form; })[0];
  if (p.p_action === 'unassign') {
    db.assignments = db.assignments.filter(function (x) { return !(x.client_id === p.p_client && x.form_id === p.p_form); });
  } else if (p.p_action === 'reopen') {
    if (a) { a.status = 'active'; a.submitted_at = null; }
  } else {
    if (a) { a.status = 'active'; }
    else db.assignments.push({ id: uid(), client_id: p.p_client, form_id: p.p_form, status: 'active',
      assigned_at: now(), submitted_at: null, due_at: p.p_due || null, answers: {} });
  }
  save(db); return { ok: true };
};
H.qb_admin_update_post = function (db, p) {
  auth(db, p.p_token, 'admin');
  var u = p.p_update || {};
  if (!u.title) fail('Titre requis.');
  db.updates.unshift({ id: uid(), client_id: p.p_client, kind: u.kind || 'info',
    title: u.title, body: u.body || '', created_at: now() });
  save(db); return { ok: true };
};
H.qb_admin_update_delete = function (db, p) {
  auth(db, p.p_token, 'admin');
  db.updates = db.updates.filter(function (x) { return x.id !== p.p_id; }); save(db); return { ok: true };
};
H.qb_admin_link_add = function (db, p) {
  auth(db, p.p_token, 'admin');
  var l = p.p_link || {};
  if (!l.label || !l.url) fail('Libellé et adresse requis.');
  db.links.push({ id: uid(), client_id: p.p_client, label: l.label, url: l.url,
    kind: l.kind || 'autre', created_at: now() });
  save(db); return { ok: true };
};
H.qb_admin_link_delete = function (db, p) {
  auth(db, p.p_token, 'admin');
  db.links = db.links.filter(function (x) { return x.id !== p.p_id; }); save(db); return { ok: true };
};
H.qb_admin_settings = function (db, p) {
  auth(db, p.p_token, 'admin');
  Object.assign(db.settings, p.p_patch || {}); save(db); return { ok: true, settings: db.settings };
};

/* ------------------------------------------------------------ Export ---- */
root.QLAB_DEMO = {
  reset: function () { localStorage.removeItem(DB_KEY); },
  call: function (fn, params) {
    var db = load();
    var h = H[fn];
    if (!h) return Promise.reject(new Error('Fonction inconnue : ' + fn));
    return new Promise(function (res) { setTimeout(res, 160 + Math.random() * 180); })
      .then(function () { return h(db, params || {}); });
  }
};
})(window);
