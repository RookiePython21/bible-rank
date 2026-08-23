"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function OnlineCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | undefined;
    try {
      const client = supabaseBrowser();
      const ch = client.channel("presence:homepage", {
        config: { presence: { key: crypto.randomUUID() } },
      });
      channel = ch;

      ch.on("presence", { event: "sync" }, () => {
        setCount(Object.keys(ch.presenceState()).length);
      }).subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({ online_at: Date.now() });
        }
      });
    } catch {
      // Presence is a nice-to-have — never break the page over it.
    }

    return () => {
      channel?.unsubscribe();
    };
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      <span className="font-semibold text-emerald-700">{count ?? "–"} online</span>
    </span>
  );
}
