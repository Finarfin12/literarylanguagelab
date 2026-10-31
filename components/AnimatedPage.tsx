"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AnimatedPage({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    async function loadPref() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('preferences').eq('id', user.id).single();
        if (data?.preferences?.display?.enable_animations === false) {
          setAnimationsEnabled(false);
        }
      }
    }
    loadPref();
  }, []);

  if (!animationsEnabled || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
