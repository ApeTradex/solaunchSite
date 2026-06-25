import type { MetadataRoute } from "next";
import { SITE } from "@/features/seo/lib/site";
import { prisma } from "@/lib/prisma";
import { BLOG_POSTS } from "@/app/(marketing)/blog/_data/posts";

/**
 * Dynamic XML sitemap served at /sitemap.xml.
 *
 * Includes:
 *  - All static public routes
 *  - All blog post pages
 *  - Dynamic public player profile pages (up to 1 000 most-recently-active users)
 *
 * Excluded (auth-required or non-indexable):
 *  /auth/*, /dashboard, /billing, /rooms, /brain-training/[gameId], /challenge/[id]
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const u = SITE.url;

  // ── Static public pages ──────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: u,                    lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${u}/play`,          lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${u}/leaderboard`,   lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${u}/puzzle`,        lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${u}/brain-training`,lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${u}/pricing`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${u}/blog`,          lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${u}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${u}/contact`,       lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${u}/privacy`,       lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${u}/terms`,         lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${u}/cookies`,       lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${u}/security`,      lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${u}/refund`,        lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // ── Blog posts ───────────────────────────────────────────────────────────
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${u}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ── Dynamic: public player profiles ─────────────────────────────────────
  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const users = await prisma.user.findMany({
      select: { id: true, updatedAt: true },
      where: { name: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    });
    profileRoutes = users.map((user) => ({
      url: `${u}/profile/${user.id}`,
      lastModified: user.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch {
    // Database unavailable at static build time — omit dynamic routes gracefully
  }

  return [...staticRoutes, ...blogRoutes, ...profileRoutes];
}
