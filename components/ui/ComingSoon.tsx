"use client";

/**
 * Wraps a not-yet-functional control so the UI stays honest: the child is
 * dimmed and made non-interactive, and a glass tooltip explains it's upcoming.
 * No fake buttons — anything that can't act says so.
 */
export function ComingSoon({
  children,
  label = "Coming soon",
  className = "",
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <span className={`relative group inline-flex ${className}`}>
      <span
        aria-disabled="true"
        className="opacity-45 cursor-not-allowed pointer-events-none select-none inline-flex"
      >
        {children}
      </span>
      <span
        role="tooltip"
        className="glass-dropdown pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 rounded-md whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-on-surface opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 z-50"
      >
        {label}
      </span>
    </span>
  );
}
