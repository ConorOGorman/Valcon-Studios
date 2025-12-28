import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={`w-full max-w-[1500px] mx-auto px-3 lg:px-16 2xl:px-0 ${className ?? ""}`}>
      {children}
    </div>
  );
}

