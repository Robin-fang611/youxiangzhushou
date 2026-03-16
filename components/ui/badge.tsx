import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#3370ff] text-white hover:bg-[#2860e1]',
        secondary:
          'border-transparent bg-[#f2f3f5] text-[#1f2329] hover:bg-[#e6e7e9]',
        destructive:
          'border-transparent bg-[#f53f3f] text-white hover:bg-[#d92b2b]',
        outline: 'text-[#1f2329] border-[#dee0e3]',
        success:
          'border-transparent bg-[#00b365] text-white hover:bg-[#009152]',
        warning:
          'border-transparent bg-[#ff7a45] text-white hover:bg-[#e66a3a]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
