"use client";

import { useEffect, useState, use } from "react";
import GuideForm from "@/components/modules/admin/guides/GuideForm";
import AdminLoading from "@/app/admin/loading";

export default function EditGuidePage({ params }) {
  const { id } = use(params);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGuide() {
      try {
        const res = await fetch(`/api/admin/guides/${id}`);
        if (!res.ok) {
          throw new Error("Guide not found");
        }
        const data = await res.json();
        setGuide(data.guide);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadGuide();
  }, [id]);

  if (loading) return <AdminLoading />;
  if (error || !guide) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="font-semibold text-danger-600">{error || "Guide not found"}</p>
      </div>
    );
  }

  return <GuideForm initialData={guide} isNew={false} />;
}
