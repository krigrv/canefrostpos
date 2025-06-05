import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  size?: 'sm' | 'md' | 'lg'
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }
  
  const iconSizeClasses = {
    sm: 'h-2.5 w-2.5',
    md: 'h-4 w-4',
    lg: 'h-4 w-4'
  }
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className={iconSizeClasses[size]} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
