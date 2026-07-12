"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Auth-aware header links. Shows "Sign in" when logged out; shows the user's
// email + Dashboard + Sign out when logged in. Reacts live to login/logout.
export function AuthNav() {
  const [email, setEmail] = useState<string | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setEmail(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    setEmail(null);
    window.location.href = "/";
  }

  // While loading, show nothing to avoid a "Sign in" flicker for logged-in users.
  if (email === undefined) return null;

  if (!email) {
    return (
      <a href="/login" className="hover:text-brand">
        Sign in
      </a>
    );
  }

  return (
    <>
      <a href="/dashboard" className="hover:text-brand">
        Dashboard
      </a>
      <span className="hidden max-w-[160px] truncate text-slate-400 sm:inline" title={email}>
        {email}
      </span>
      <button onClick={signOut} className="hover:text-brand">
        Sign out
      </button>
    </>
  );
}
