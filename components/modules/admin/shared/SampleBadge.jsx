import Badge from "@/components/ui/Badge";

export default function SampleBadge({ isSample }) {
  if (!isSample) return null;
  return (
    <Badge variant="neutral" className="text-[10px] uppercase font-bold tracking-wider">
      Sample data
    </Badge>
  );
}
