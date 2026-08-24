import { cache } from "react";
import { createOperationalClient } from "@/lib/supabase/operational";
import { company, marketingPlans } from "@/lib/marketing-config";

export type AnalyticsSettings = {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  metaPixelId?: string;
  searchConsoleVerification?: string;
  chatWidgetUrl?: string;
};

export type PlatformSiteSettings = {
  company: typeof company & { logoUrl?: string };
  plans: typeof marketingPlans;
  analytics: AnalyticsSettings;
};

const fallback: PlatformSiteSettings = {
  company,
  plans: marketingPlans,
  analytics: {},
};

export const getPlatformSiteSettings = cache(async (): Promise<PlatformSiteSettings> => {
  try {
    const db = await createOperationalClient();
    const { data } = await db
      .from("platform_site_settings")
      .select("company,plans,analytics")
      .eq("id", "main")
      .maybeSingle();

    if (!data) return fallback;

    return {
      company: { ...company, ...((data.company ?? {}) as Partial<PlatformSiteSettings["company"]>) },
      plans: Array.isArray(data.plans) && data.plans.length ? data.plans as typeof marketingPlans : marketingPlans,
      analytics: (data.analytics ?? {}) as AnalyticsSettings,
    };
  } catch {
    return fallback;
  }
});
