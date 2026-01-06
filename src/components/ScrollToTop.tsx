import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();

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

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  return null;
}
