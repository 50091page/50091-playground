import type { ComponentType } from "react";

export const loadObservatoryPreview = import.meta.env.DEV
  ? import.meta.glob<{ default: ComponentType }>("../pages/ObservatoryPage.tsx")["../pages/ObservatoryPage.tsx"]
  : undefined;
