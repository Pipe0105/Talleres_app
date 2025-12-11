import type { CSSProperties } from "react";

export type FadeUpStyle = CSSProperties & {
  "--fade-up-delay"?: string;
};

export const fadeUpDelayStyle = (delayMs: number): FadeUpStyle => ({
  "--fade-up-delay": `${delayMs}ms`,
});
