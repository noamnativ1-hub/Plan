
"use client"

import * as React from "react"

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative overflow-auto ${className || ''}`}
    {...props}
  >
    {children}
  </div>
))
ScrollArea.displayName = "ScrollArea"

const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    orientation={orientation}
    className={`
      flex touch-none select-none transition-colors
      ${orientation === "vertical" ?
        "h-full w-2.5 border-l border-l-transparent p-[1px]" :
        "h-2.5 border-t border-t-transparent p-[1px]"
      }
      ${className || ''}
    `}
    {...props}
  >
    <div className="relative flex-1 rounded-full bg-border" />
  </div>
))
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }

// Default export added
export default ScrollArea
