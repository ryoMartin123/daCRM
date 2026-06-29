"use client";

// ─── useDataVersion ───────────────────────────────────────
// A counter that bumps whenever app data may have changed — another tab wrote to
// storage, this document dispatched a change, or the tab regained focus. Include
// the returned value in a data useMemo's deps to re-read without a refresh:
//   const rev = useDataVersion();
//   const jobs = useMemo(() => getMyJobs(), [rev]);

import { useEffect, useState } from "react";
import { DATA_EVENT } from "./liveData";

export function useDataVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV(x => x + 1);
    const onVis = () => { if (document.visibilityState === "visible") bump(); };
    window.addEventListener("storage", bump);
    window.addEventListener(DATA_EVENT, bump);
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener(DATA_EVENT, bump);
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return v;
}
