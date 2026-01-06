import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Prevent the browser from restoring scroll position on SPA navigations.
    // This is a common cause of "navigated to a new page but I'm still at the footer".
    if ("scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    // If the URL includes a hash, let the browser scroll to that anchor.
    if (location.hash) {
      const id = location.hash.replace(/^#/, "");
      if (!id) return;

      // Defer until after route content renders.
      const handle = window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: "start" });
      }, 0);

      return () => window.clearTimeout(handle);
    }

    // Do an immediate scroll, then another on the next frame to beat late scroll-restoration
    // and layout shifts as the new route content mounts.
    window.scrollTo(0, 0);
    const raf1 = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      window.requestAnimationFrame(() => window.scrollTo(0, 0));
    });

    return () => window.cancelAnimationFrame(raf1);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
