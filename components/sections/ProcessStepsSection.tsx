import { Container } from "../primitives/Container";
import { Section } from "../primitives/Section";

type ProcessStepsSectionProps = {
  theme?: "light" | "dark";
  eyebrow: string;
  title: string;
  description: string;
  steps: { title: string; body: string }[];
};

export function ProcessStepsSection({ theme = "light", eyebrow, title, description, steps }: ProcessStepsSectionProps) {
  const isDark = theme === "dark";

  return (
    <Section
      className={`relative overflow-hidden ${isDark ? "bg-black" : "bg-white"}`}
      data-slice-type="process_steps"
      data-slice-variation="default"
    >
      <div className="relative z-10">
        <Container className="section-padding pointer-events-none">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-[50px] lg:gap-0">
            <div className="w-full lg:max-w-[552px] flex flex-col gap-[30px] lg:gap-[50px] pointer-events-auto">
              <div className="flex flex-col gap-[8px] lg:gap-4 w-full text-left items-start">
                <p
                  className={`font-source-code-pro text-[12px] lg:text-[14px] leading-[1.2] lg:leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase ${
                    isDark ? "text-white/70" : "text-accent"
                  }`}
                >
                  {eyebrow}
                </p>
                <h2
                  className={`font-rinter text-[30px] lg:text-[55px] leading-[1.1] tracking-[-1.5px] lg:tracking-[-2.75px] ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  {title}
                </h2>
                <p
                  className={`font-body text-[16px] lg:text-[17px] leading-[1.3] lg:leading-[30px] ${
                    isDark ? "text-white/87" : "text-black/70"
                  }`}
                >
                  {description}
                </p>
              </div>
            </div>

            <div className="w-full lg:max-w-[590px] relative pointer-events-auto">
              <div className="relative">
                <div
                  className={`absolute left-[24px] lg:left-[27px] w-0.5 z-0 origin-top ${isDark ? "bg-accent" : "bg-accent"}`}
                  style={{ top: 24, height: "calc(100% - 48px)", transform: "scaleY(1)" }}
                />
                <div className="space-y-12 lg:space-y-16">
                  {steps.map((step, idx) => (
                    <div key={step.title} className="flex gap-3 lg:gap-4 items-start relative z-30">
                      <div className="relative w-[48px] h-[48px] lg:w-[55px] lg:h-[55px] flex items-center justify-center shrink-0">
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 55 55">
                          <circle
                            cx="27.5"
                            cy="27.5"
                            r="26"
                            fill={isDark ? "black" : "white"}
                            stroke="var(--color-accent)"
                            strokeWidth="2"
                          />
                        </svg>
                        <p
                          className={`relative z-10 font-source-code-pro text-[18px] tracking-[-0.48px] lg:tracking-[-0.54px] ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {idx + 1}
                        </p>
                      </div>
                      <div className="flex-1 flex flex-col gap-2 lg:gap-4">
                        <p
                          className={`font-source-code-pro text-[14px] lg:text-[24px] leading-[20px] lg:leading-[24px] ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p
                          className={`font-body text-[12px] lg:text-[17px] leading-[1.4] lg:leading-[30px] ${
                            isDark ? "text-white/80" : "text-black/70"
                          }`}
                        >
                          {step.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </Section>
  );
}

