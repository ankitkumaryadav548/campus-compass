import Badge from "@/components/ui/Badge";
import { Compass, Calendar } from "lucide-react";

export default function DashboardHeader({ name, country, regionGroup, arrivalInfo }) {
  const firstName = name ? name.split(" ")[0] : "Student";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-6 sm:p-8 text-white shadow-xl">
      <div aria-hidden="true" className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div aria-hidden="true" className="absolute right-1/3 -top-12 w-48 h-48 rounded-full bg-violet-400/20 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {country && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/30">
                <Compass size={13} />
                {country}
              </span>
            )}
            {regionGroup && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/20 text-indigo-100">
                {regionGroup}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-indigo-100 mt-1 max-w-xl">
            Here is your daily snapshot of campus registration steps, home-country guides, and fellow international students.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 self-start md:self-auto shrink-0 shadow-sm">
          <Calendar size={18} className="text-teal-300" />
          <div className="text-left">
            <span className="block text-[10px] text-indigo-100 uppercase tracking-wider font-semibold">
              Arrival Timeline
            </span>
            <span className="text-sm font-bold text-white">
              {arrivalInfo.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

