// app/guides/[category]/page.jsx
// Detailed step-by-step guide for SIM and Bank.

import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { getGuidesForUser } from "@/lib/guides";
import { noContentNote } from "@/lib/personalization";
import AppShell from "@/components/layout/AppShell";
import GuideDetailClient from "@/components/modules/guides/GuideDetailClient";

export async function generateMetadata({ params }) {
  const { category } = await params;
  const title = category === "sim" ? "SIM Card Guide" : category === "bank" ? "Bank Account Guide" : "Guide";
  return {
    title: `${title} – Campus Compass`,
  };
}

export default async function GuideCategoryPage({ params }) {
  const { category } = await params;

  if (category !== "sim" && category !== "bank") {
    notFound();
  }

  const user = await requireUser(`/guides/${category}`);
  await connectDB();

  const guides = await getGuidesForUser(user, category);

  if (!guides || guides.length === 0) {
    notFound();
  }

  const noContentBannerText = noContentNote(user);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        <GuideDetailClient
          category={category}
          guides={guides}
          userCountry={user.country || "International"}
          noContentBannerText={noContentBannerText}
        />
      </div>
    </AppShell>
  );
}
