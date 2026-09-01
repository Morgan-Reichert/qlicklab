/* ==========================================================================
   QlickLab — Configuration du backend
   La clé « publishable » est publique par nature : elle ne donne accès à rien
   par elle-même. Toutes les vérifications de sécurité sont faites côté
   Supabase (RLS sans policy + fonctions SECURITY DEFINER).
   Voir backend-supabase/schema.sql et backend-supabase/SETUP.md.
   ========================================================================== */
window.QLAB_CONFIG = {
  supabaseUrl:     'https://dqqhoaviihpxqlrqefwm.supabase.co',
  supabaseAnonKey: 'sb_publishable_d2g7me4Gu5I4Ry_X81tjag_w8Kkt9Im'
};
