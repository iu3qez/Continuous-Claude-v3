import type { SVGAttributes } from "react";
import { cn } from "@/lib/utils";

const Logo = ({ className, ...props }: SVGAttributes<SVGElement> & { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
          <path d="M3 2h12v3H6v3h7v3H6v5H3V2z" fill="#09090b" />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">Forge</span>
    </div>
  );
};

export default Logo;
