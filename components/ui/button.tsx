import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#3370ff] text-white hover:bg-[#2860e1] shadow-sm',
        destructive: 'bg-[#f53f3f] text-white hover:bg-[#d92b2b]',
        outline: 'border border-[#dee0e3] bg-white hover:border-[#3370ff] hover:text-[#3370ff] text-[#1f2329]',
        secondary: 'bg-[#f2f3f5] text-[#1f2329] hover:bg-[#e6e7e9]',
        ghost: 'hover:bg-[#f2f3f5] hover:text-[#1f2329]',
        link: 'text-[#3370ff] underline-offset-4 hover:underline',
        success: 'bg-[#00b365] text-white hover:bg-[#009152]',
        warning: 'bg-[#ff7a45] text-white hover:bg-[#e66a3a]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
