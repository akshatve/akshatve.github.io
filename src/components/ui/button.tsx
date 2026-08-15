'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * shadcn/ui Button, restyled for the editorial system: square corners,
 * hairline borders, beige ink, no shadows or glass.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-metadata transition-colors duration-500 ease-editorial disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        outline:
          'border border-beige-200/25 text-beige-200 hover:border-gold hover:text-gold',
        ghost: 'text-beige-300 hover:text-gold',
        solid: 'bg-beige-200 text-navy-800 hover:bg-gold',
      },
      size: {
        sm: 'h-9 px-4',
        md: 'h-11 px-6',
        lg: 'h-14 px-8',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Slot counts every child slot — including a `false` from a short-circuit —
    // so never render conditional siblings alongside `children` here.
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        data-cursor="button"
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
