import { forwardRef } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

/**
 * Renders an icon chosen at runtime (`icon={active ? PauseIcon : PlayIcon}`,
 * `icon={item.icon}`). Static call sites should render the Lucide component
 * directly instead: `<PlayIcon className="..." />`.
 */

export interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
}

export const DynamicIcon = forwardRef<SVGSVGElement, DynamicIconProps>(
  function DynamicIcon({ icon: IconComponent, ...props }, ref) {
    return <IconComponent ref={ref} {...props} />;
  }
);
