"use client";

import { twMerge } from "tailwind-merge";

interface BoxProps {
  children: React.ReactNode;
  className?: string;
}

const Box: React.FC<BoxProps> = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        `
        relative
        rounded-none
        bg-[#0a0a0f]/60
        backdrop-blur-xl
        border
        border-theme-500/20
        shadow-[inset_0_0_15px_rgba(var(--theme-500),0.05)]
        transition-all
        duration-500
        hover:shadow-[0_0_20px_rgba(var(--theme-500),0.15)]
        hover:border-theme-500/40
        group/box
        `,
        className,
      )}
    >
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-theme-500/0 group-hover/box:border-theme-500/20 transition-all duration-500 pointer-events-none rounded-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-theme-500/0 group-hover/box:border-theme-500/20 transition-all duration-500 pointer-events-none rounded-none" />
      {children}
    </div>
  );
};

export default Box;
