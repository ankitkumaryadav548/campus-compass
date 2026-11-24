import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startIdx}</span> to{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{endIdx}</span> of{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> items
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          leftIcon={ChevronLeft}
        >
          Previous
        </Button>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-2">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          rightIcon={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
