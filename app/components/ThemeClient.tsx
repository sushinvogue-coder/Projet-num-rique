'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const body = document.body;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    body.style.background = '#0f1115';
    body.style.color = '#eaeaea';
  } else {
    body.style.background = '#ffffff';
    body.style.color = '#000000';
  }
}

export default function ThemeClient() {
  useEffect(() => {
    let applied = false;

    // 1) Essaie d’abord le localStorage (instantané, évite les flashs)
    const ls = (typeof window !== 'undefined' && localStorage.getItem('theme')) as Theme | null;
    if (ls === 'dark' || ls === 'light') {
      applyTheme(ls);
      applied = true;
    }

    // 2) Puis, si pas trouvé en localStorage, on va lire le profil Supabase
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('theme')
          .eq('user_id', user.id)
          .maybeSingle();

        const t = (data?.theme as Theme | null) ?? null;
        if (t === 'light' || t === 'dark') {
          if (!applied) applyTheme(t);
          // garde la préférence côté navigateur aussi
          localStorage.setItem('theme', t);
        }
      } catch { /* ignore */ }
    })();

    // 3) Écoute un event custom au cas où une page voudrait forcer la maj
    const handler = () => {
      const cur = (localStorage.getItem('theme') as Theme | null) ?? 'light';
      if (cur === 'dark' || cur === 'light') applyTheme(cur);
    };
    window.addEventListener('theme:refresh', handler);
    return () => window.removeEventListener('theme:refresh', handler);
  }, []);

  return null;
}
