import Badge from "@/components/ui/Badge";

const STATUS_CONFIGS = {
  // Guide statuses
  draft: { label: "Draft", variant: "warning" },
  published: { label: "Published", variant: "success" },
  archived: { label: "Archived", variant: "neutral" },

  // Report statuses
  open: { label: "Open", variant: "danger" },
  reviewed: { label: "Reviewed", variant: "neutral" },

  // User statuses
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "danger" },

  // Food diet labels
  pure_veg: { label: "Pure Veg", variant: "success" },
  veg_and_nonveg: { label: "Veg & Non-Veg", variant: "warning" },
  nonveg_only: { label: "Non-Veg Only", variant: "danger" },
  unlabelled: { label: "Unlabelled", variant: "neutral" },
};

export default function StatusBadge({ status, className }) {
  const config = STATUS_CONFIGS[status] || { label: status || "Unknown", variant: "neutral" };
  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
}
