// components/layout/AppShell.jsx
// AppShell wraps authenticated module pages with the Sidebar and responsive container.

import Sidebar from "@/components/layout/Sidebar";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}

