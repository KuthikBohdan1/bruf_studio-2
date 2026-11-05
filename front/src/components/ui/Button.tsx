import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

import { Link } from '@/components/ui/Link'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'inverse' | 'outline' | 'ghost'
type Size = 'md' | 'lg' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground',
  inverse: 'bg-inverse text-inverse-foreground',
  outline: 'border border-foreground/25 hover:border-foreground',
  ghost: 'hover:bg-muted',
}

const SIZES: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
  icon: 'h-11 w-11',
}

const BASE =
  'group/button relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium ' +
  'transition-[transform,background-color,border-color] duration-300 active:scale-[0.97] ' +
  'disabled:pointer-events-none disabled:opacity-60 select-none'

function classes(variant: Variant, size: Size, className?: string): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className)
}

/**
 * Label that rolls up on hover: the text is stacked twice and the stack shifts
 * by one line. Only for filled buttons, where the motion reads as a press.
 */
function RollingLabel({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-flex flex-col overflow-hidden leading-[1.4]">
      <span className="flex items-center gap-2 transition-transform duration-500 ease-out-expo group-hover/button:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex translate-y-full items-center gap-2 transition-transform duration-500 ease-out-expo group-hover/button:translate-y-0"
      >
        {children}
      </span>
    </span>
  )
}

interface CommonProps {
  variant?: Variant
  size?: Size
  children: ReactNode
}

function content(variant: Variant, size: Size, children: ReactNode) {
  return variant === 'primary' || variant === 'inverse' ? (
    size === 'icon' ? children : <RollingLabel>{children}</RollingLabel>
  ) : (
    children
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes(variant, size, className)} {...props}>
      {content(variant, size, children)}
    </button>
  )
}

/** A button-styled link. Same-site paths navigate without reloading. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link className={classes(variant, size, className)} {...props}>
      {content(variant, size, children)}
    </Link>
  )
}
