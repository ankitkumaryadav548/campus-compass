import EmptyState from "@/components/ui/EmptyState";

/**
 * DataTable – responsive data table: standard table on md+ screens,
 * card view on mobile.
 */
export default function DataTable({
  columns,
  data = [],
  keyExtractor = (row) => row._id || row.id,
  emptyMessage = "No items found",
  renderMobileCard,
}) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <EmptyState title={emptyMessage} description="Try adjusting your filters or search terms." />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card View (hidden on md+) */}
      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <div
            key={keyExtractor(row) || idx}
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
          >
            {renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <div className="space-y-1.5 text-sm">
                {columns.map((col, cIdx) => (
                  <div key={cIdx} className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {col.header}
                    </span>
                    <span className="text-right">
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                    col.className || ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((row, idx) => (
              <tr
                key={keyExtractor(row) || idx}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-3.5 align-middle text-slate-700 dark:text-slate-300 ${
                      col.className || ""
                    }`}
                  >
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
