import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/auth/", "/onboarding/"] }, sitemap: "https://academias.nexawi.com.br/sitemap.xml", host: "https://academias.nexawi.com.br" }; }
