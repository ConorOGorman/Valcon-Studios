import type { HTMLAttributes, ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section className={className} {...props}>
      {children}
    </section>
  );
}
