// src/components/UtmHiddenFields.tsx
import { useMemo } from "react";
import { readUtm } from "../lib/utm";

export default function UtmHiddenFields() {
  const utm = useMemo(readUtm, []);
  return (
    <>
      <input type="hidden" name="utm_source"   defaultValue={utm.utm_source} />
      <input type="hidden" name="utm_medium"   defaultValue={utm.utm_medium} />
      <input type="hidden" name="utm_campaign" defaultValue={utm.utm_campaign} />
      <input type="hidden" name="utm_content"  defaultValue={utm.utm_content} />
      <input type="hidden" name="utm_term"     defaultValue={utm.utm_term} />
      <input type="hidden" name="landing_page" defaultValue={utm.landing_page} />
      <input type="hidden" name="referrer"     defaultValue={utm.referrer} />
      <input type="hidden" name="first_utm"    defaultValue={utm.first_utm} />
      <input type="hidden" name="last_utm"     defaultValue={utm.last_utm} />
    </>
  );
}
