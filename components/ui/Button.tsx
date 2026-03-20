import { clsx } from 'clsx'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit'
  className?: string
}

const base = 'inline-flex items-center justify-center font-display font-black tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-md'

const variants = {
  primary:   'bg-[#BEFF00] text-[#080808] hover:bg-[#d4ff4d]',
  secondary: 'bg-transparent border border-[#BEFF00] text-[#BEFF00] hover:bg-[#BEFF00]/10',
  danger:    'bg-transparent border border-[#E24B4A] text-[#E24B4A] hover:bg-[#E24B4A]/10',
  ghost:     'bg-transparent border border-[#1A1A1A] text-[#666] hover:border-[#333] hover:text-white',
}

const sizes = {
  sm: 'text-xs px-4 py-2',
  md: 'text-sm px-6 py-3',
  lg: 'text-base px-8 py-4',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  onClick, disabled, fullWidth, type = 'button', className
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
    >
      {children}
    </button>
  )
}
