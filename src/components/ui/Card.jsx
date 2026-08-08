import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const cardVariants = cva('brutal-border shadow-shadow', {
  variants: {
    surface: {
      paper: 'bg-paper text-ink',
      white: 'bg-white text-ink',
      ink: 'bg-ink text-paper',
      correction: 'bg-correction text-paper',
      mustard: 'bg-mustard text-ink',
      aizome: 'bg-aizome text-paper',
      moss: 'bg-moss text-paper',
      none: '',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
    },
    lift: {
      none: '',
      press: 'transition-all duration-150 ease-out hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none',
    },
  },
  defaultVariants: {
    surface: 'white',
    padding: 'none',
    lift: 'none',
  },
});

export default function Card({
  as: Component = 'section',
  children,
  className = '',
  lift,
  padding,
  surface,
  ...props
}) {
  return (
    <Component className={cn(cardVariants({ surface, padding, lift }), className)} {...props}>
      {children}
    </Component>
  );
}
