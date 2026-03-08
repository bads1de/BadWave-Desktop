import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      disabled,
      type = "button",
      variant = "default",
      size = "md",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        type={type}
        className={twMerge(
          `relative group flex items-center justify-center rounded-none font-mono uppercase tracking-widest transition-all duration-500 cyber-glitch`,
          variant === "default" &&
            "bg-theme-500/10 border border-theme-500/40 text-theme-300 hover:bg-theme-500/30 hover:text-white hover:shadow-[0_0_20px_rgba(var(--theme-500),0.4)]",
          variant === "outline" &&
            "border border-theme-500/20 bg-transparent hover:border-theme-500/60 hover:bg-theme-500/5 text-theme-500 hover:text-white",
          variant === "ghost" &&
            "bg-transparent hover:bg-theme-500/10 text-theme-500 hover:text-white border border-transparent",
          variant === "success" &&
            "bg-green-500/10 border border-green-500/40 text-green-400 hover:bg-green-500/30 hover:text-white hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]",
          variant === "danger" &&
            "bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
          size === "sm" && "text-[10px] px-3 py-1.5",
          size === "md" && "text-xs px-5 py-2.5",
          size === "lg" && "text-sm px-8 py-3.5",
          size === "icon" && "p-2.5",
          className,
        )}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">{children}</div>

        {/* HUD装飾コーナー (ボタン用) */}
        {variant !== "ghost" && (
          <>
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-theme-500/40 group-hover:border-theme-500 transition-colors" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-theme-500/40 group-hover:border-theme-500 transition-colors" />
          </>
        )}
      </button>
    );
  },
);

// displayName を設定
Button.displayName = "Button";

export default Button;
