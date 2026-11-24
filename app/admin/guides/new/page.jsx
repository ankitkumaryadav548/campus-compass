import GuideForm from "@/components/modules/admin/guides/GuideForm";

export const metadata = {
  title: "New Student Guide | Admin Panel",
};

export default function NewGuidePage() {
  return <GuideForm isNew={true} />;
}
