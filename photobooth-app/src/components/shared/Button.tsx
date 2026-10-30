import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
}

const variants = {
  primary: 'bg-sway-text text-sway-bg hover:bg-sway-muted active:bg-sway-dim',
  accent:  'bg-sway-accent text-white hover:brightness-110 active:brightness-90',
  ghost:   'bg-transparent border border-sway-border text-sway-muted hover:border-sway-dim hover:text-sway-text',
  danger:  'bg-red-600 text-white hover:bg-red-700',
}

const sizes = {
  sm: 'h-9  px-4  text-[11px]',
  md: 'h-11 px-6  text-[12px]',
  lg: 'h-14 px-8  text-[15px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-grotesk font-bold uppercase tracking-widest',
        'rounded transition-all duration-150 cursor-pointer',
        'min-h-[44px]',
        'flex items-center justify-center gap-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'active:scale-95 select-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
