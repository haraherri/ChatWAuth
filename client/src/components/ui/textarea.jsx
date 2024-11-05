import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full bg-transparent border-none text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none py-4 px-4",
        "scrollbar-w-2 overflow-y-auto",
        "[&::-webkit-scrollbar]{width:8px}",
        "[&::-webkit-scrollbar-track]{background:transparent}",
        "[&::-webkit-scrollbar-thumb]{background-color:#4a4b53;border-radius:4px}",
        "[&::-webkit-scrollbar-thumb:hover]{background-color:#5a5b63}",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
