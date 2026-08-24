import type { MetadataRoute } from "next";
const base = "https://academias.nexawi.com.br";
export default function sitemap(): MetadataRoute.Sitemap { return ["","/plataforma","/site-da-academia","/planos","/faq","/sobre","/demonstracao","/privacidade","/termos","/cookies","/contrato","/academia/aurea-performance"].map((path,index)=>({ url:`${base}${path}`, changeFrequency:index===0?"weekly":"monthly" as const, priority:index===0?1:path.startsWith("/academia/")?.9:.7 })); }
