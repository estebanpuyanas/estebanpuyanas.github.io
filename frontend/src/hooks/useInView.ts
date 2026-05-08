import { useEffect, useRef } from "react";

export function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll<HTMLElement>("[data-inview]");
    if (targets.length === 0) {
      // If the element itself has data-inview
      if (el.hasAttribute("data-inview")) {
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              el.classList.add("is-visible");
              obs.unobserve(el);
            }
          },
          { threshold },
        );
        obs.observe(el);
        return () => obs.disconnect();
      }
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold },
    );

    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, [threshold]);

  return ref;
}
