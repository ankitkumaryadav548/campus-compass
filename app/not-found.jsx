import Link from "next/link";
import Button from "@/components/ui/Button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 shadow-sm">
        <Compass size={36} />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        404 – Page Not Found
      </h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 text-sm">
        The page you are looking for does not exist, has been removed, or is temporarily unavailable.
      </p>
      <Button as={Link} href="/" variant="primary">
        Return Home
      </Button>
    </div>
  );
}
