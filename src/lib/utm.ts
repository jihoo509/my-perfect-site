// src/lib/utm.ts
export type Utm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
  first_utm?: string;
  last_utm?: string;
};

export function readUtm(): Utm {
  if (typeof window === "undefined") return {};
  const url = new URL(window.location.href);
  const p = url.searchParams;

  const utm: Utm = {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
    utm_content: p.get("utm_content") || "",
    utm_term: p.get("utm_term") || "",
    landing_page: url.href,
    referrer: document.referrer || "",
  };

  try {
    if (!localStorage.getItem("first_utm") && url.search) {
      localStorage.setItem("first_utm", url.search);
    }
    if (url.search) localStorage.setItem("last_utm", url.search);
    utm.first_utm = localStorage.getItem("first_utm") || "";
    utm.last_utm = localStorage.getItem("last_utm") || "";
  } catch {}
  return utm;
}
