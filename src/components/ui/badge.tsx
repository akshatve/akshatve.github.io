import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * shadcn/ui Badge, restyled as an editorial metadata tag — square, hairline,
 * monospaced. Used for project technologies.
 */
const badgeVariants = cva(
  'inline-flex items-center font-mono text-[10px] uppercase tracking-wide2 transition-colors duration-500',
  {
    variants: {
      variant: {
        outline: 'border border-beige-200/20 px-2.5 py-1 text-beige-300',
        plain: 'text-beige-400',
        accent: 'border border-gold/40 px-2.5 py-1 text-gold',
      },
    },
    defaultVariants: { variant: 'plain' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
