import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  'brutal-border inline-flex items-center justify-center gap-2 font-mono font-black uppercase tracking-[0.12em] shadow-shadow transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:translate-x-boxShadowX enabled:hover:translate-y-boxShadowY enabled:hover:shadow-none active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none',
  {
    variants: {
      variant: {
        primary: 'bg-correction text-paper',
        secondary: 'bg-mustard text-ink',
        neutral: 'bg-white text-ink hover:bg-mustard',
        ghost: 'bg-paper text-ink shadow-nav hover:bg-mustard',
        dark: 'bg-ink text-paper',
        success: 'bg-moss text-paper',
      },
      size: {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-3 text-sm',
        lg: 'px-5 py-4 text-base',
        icon: 'h-12 w-12 p-0 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export default function Button({
  as: Component = 'button',
  children,
  className = '',
  size,
  type,
  variant,
  ...props
}) {
  return (
    <Component
      type={Component === 'button' ? type || 'button' : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
