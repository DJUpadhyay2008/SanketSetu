import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center gap-8 text-center"
      aria-label="Page not found"
    >
      {/* Glowing error icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-3xl scale-150 pointer-events-none" />
        <div className="relative h-24 w-24 rounded-3xl bg-slate-900 border border-orange-500/30 flex items-center justify-center shadow-xl">
          <AlertTriangle className="h-12 w-12 text-orange-400" />
        </div>
      </div>

      <div className="space-y-3 max-w-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">Error 404</p>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm font-semibold text-slate-500 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back to learning ISL.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-sm font-black transition-all hover:bg-slate-800 dark:hover:bg-slate-700 shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <Home className="h-4 w-4" /> Back to Home
        </Link>
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-black transition-all hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Go to Learn
        </Link>
      </div>

      {/* Decorative bottom text */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-700">
        Sanket Setu · ISL-Ready India
      </p>
    </div>
  );
}
