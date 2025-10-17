"use client";
import { useEffect, useState } from "react";

export function useAppSettings() {
  const [locale, setLocale] = useState<string>(() => {
    if (typeof window === "undefined") return "fr";
    return localStorage.getItem("locale") || "fr";
  });
  const [tz, setTz] = useState<string>(() => {
    if (typeof window === "undefined") return "Europe/Paris";
    return localStorage.getItem("site.tz") || "Europe/Paris";
  });
  const [orgId, setOrgId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("org.current") || "";
  });

  useEffect(() => {
    const onLocale = () =>
      setLocale(localStorage.getItem("locale") || "fr");

    const onTz = (e: any) =>
      setTz(e?.detail || localStorage.getItem("site.tz") || "Europe/Paris");

    const onOrg = () =>
      setOrgId(localStorage.getItem("org.current") || "");

    window.addEventListener("locale-change", onLocale);
    window.addEventListener("tz-change", onTz as EventListener);
    window.addEventListener("org-change", onOrg);

    return () => {
      window.removeEventListener("locale-change", onLocale);
      window.removeEventListener("tz-change", onTz as EventListener);
      window.removeEventListener("org-change", onOrg);
    };
  }, []);

  return { locale, tz, orgId };
}
