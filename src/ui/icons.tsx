const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IconToday = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconGrid = () => (
  <svg viewBox="0 0 24 24" {...P}><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></svg>
);
export const IconPath = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M5 19c0-4 3-5 7-5s7-1 7-5" /><circle cx="5" cy="19" r="1.6" /><circle cx="19" cy="9" r="1.6" /><path d="M19 5V3" /></svg>
);
export const IconClose = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...P}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconDelete = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M9 5h10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H9l-6-7z" /><path d="M12 9.5l5 5M17 9.5l-5 5" /></svg>
);
export const IconLock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...P}><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const IconChevron = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...P}><path d="M9 6l6 6-6 6" /></svg>
);
