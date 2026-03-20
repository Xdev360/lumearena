import { clsx } from 'clsx'

type Props = {
  label: string
  variant?: 'open' | 'full' | 'locked' | 'pending' | 'confirmed' | 'failed' | 'completed'
}

const styles = {
  open:      'bg-[#003E31] text-[#BEFF00] border border-[#005544]',
  full:      'bg-[#1a1000] text-[#EF9F27] border border-[#332000]',
  locked:    'bg-[#111] text-[#444] border border-[#1A1A1A]',
  pending:   'bg-[#1a1000] text-[#EF9F27] border border-[#332200]',
  confirmed: 'bg-[#003E31] text-[#BEFF00] border border-[#005544]',
  failed:    'bg-[#1a0000] text-[#E24B4A] border border-[#330000]',
  completed: 'bg-[#111] text-[#555] border border-[#222]',
}

export default function Badge({ label, variant = 'open' }: Props) {
  return (
    <span className={clsx(
      'inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded',
      styles[variant]
    )}>
      {label}
    </span>
  )
}
