"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnalyticsSettings } from "@/lib/platform-site";

type Consent = "all" | "essential" | null;
const STORAGE_KEY = "nexawi_cookie_consent_v1";

export function ConsentManager({ analytics }: { analytics: AnalyticsSettings }) {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      setConsent(saved === "all" || saved === "essential" ? saved : null);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function choose(value: Exclude<Consent, null>) {
    window.localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  }

  const enabled = ready && consent === "all";
  return <>
    {enabled && analytics.googleTagManagerId && <>
      <Script id="nexawi-gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.googleTagManagerId}');`}</Script>
    </>}
    {enabled && analytics.googleAnalyticsId && <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`} strategy="afterInteractive" />
      <Script id="nexawi-ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${analytics.googleAnalyticsId}',{anonymize_ip:true});`}</Script>
    </>}
    {enabled && analytics.metaPixelId && <Script id="nexawi-meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analytics.metaPixelId}');fbq('track','PageView');`}</Script>}
    {enabled && analytics.chatWidgetUrl && <Script src={analytics.chatWidgetUrl} strategy="lazyOnload" />}
    {ready && consent === null && <aside className="cookie-banner" aria-label="Preferências de cookies">
      <div><strong>Sua privacidade importa.</strong><p>Usamos cookies essenciais para o site funcionar. Com sua autorização, usamos métricas e marketing para melhorar sua experiência.</p><Link href="/cookies">Ver política de cookies</Link></div>
      <div><button type="button" onClick={() => choose("essential")}>Somente essenciais</button><button type="button" className="cookie-accept" onClick={() => choose("all")}>Aceitar todos</button></div>
    </aside>}
  </>;
}
