export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
      <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-slate-500">Loading admin console...</p>
    </div>
  );
}
