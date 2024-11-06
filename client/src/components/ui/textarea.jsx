import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full bg-transparent border-none text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none py-4 px-4 overflow-y-auto",
        // Modern scrollbar styling with both webkit and standard
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#4a4b53]",
        "hover:scrollbar-thumb-[#5a5b63]",
        "[&::-webkit-scrollbar]:w-2",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-[#4a4b53]",
        "[&::-webkit-scrollbar-thumb]:rounded-md",
        "[&::-webkit-scrollbar-thumb:hover]:bg-[#5a5b63]",
        // Firefox
        "scrollbar-w-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
