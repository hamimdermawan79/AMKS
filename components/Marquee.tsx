import { CSSProperties, ReactNode } from 'react';

// ponytail: pure-CSS marquee, transform-only, zero re-renders. Reduced-motion handled in globals.css.
export default function Marquee({
  children,
  duration = 40,
  className = '',
}: {
  children: ReactNode;
  duration?: number;
  className?: string;
}) {
  return (
    <div className={`marquee-mask w-full overflow-hidden ${className}`}>
      <div
        className="marquee-track flex flex-nowrap"
        style={{ animationDuration: `${duration}s` } as CSSProperties}
      >
        <div className="flex flex-nowrap shrink-0 items-center">{children}</div>
        <div className="flex flex-nowrap shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
