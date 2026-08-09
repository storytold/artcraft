import { forwardRef } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

/**
 * Icons with no Lucide equivalent, drawn in Lucide's stroke style so they sit
 * next to real Lucide icons without looking foreign.
 */

function createBadgeIcon(displayName: string, label: string): LucideIcon {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(
    ({ size, width, height, className, ...rest }, ref) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        width={width ?? size ?? '1em'}
        height={height ?? size ?? '1em'}
        className={className ? `lucide ${className}` : 'lucide'}
        {...rest}
      >
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <text
          x="12"
          y="15.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          fill="currentColor"
          stroke="none"
        >
          {label}
        </text>
      </svg>
    )
  );
  Icon.displayName = displayName;
  return Icon as LucideIcon;
}

/** "HD" quality badge. */
export const HighDefinitionIcon = createBadgeIcon('HighDefinitionIcon', 'HD');

/** "SD" quality badge. */
export const StandardDefinitionIcon = createBadgeIcon('StandardDefinitionIcon', 'SD');
