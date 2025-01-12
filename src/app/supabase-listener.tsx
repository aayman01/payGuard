"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSupabase } from "./supabase-provider";

export default function SupabaseListener() {
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.refresh();
      if (event === "SIGNED_OUT") router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null;
}
