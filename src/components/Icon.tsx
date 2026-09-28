const P: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  bagPlus: <><path d="M5 8h14l-.6 7.5M12 21H6L5 8" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /><circle cx="17.5" cy="18.5" r="3.5" /><path d="M17.5 17v3M16 18.5h3" /></>,
  left: <path d="m15 5-7 7 7 7" />,
  right: <path d="m9 5 7 7-7 7" />,
  down: <path d="m5 9 7 7 7-7" />,
  up: <path d="m5 15 7-7 7 7" />,
  back: <><path d="M20 12H4" /><path d="m10 6-6 6 6 6" /></>,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8L3 12Z" /><circle cx="7.5" cy="8" r="1.3" /></>,
  ticket: <><path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Z" /><path d="M9 7v10" strokeDasharray="2 2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  rupee: <path d="M7 5h10M7 9h10M12 5c5 0 5 8 0 8H8l7 7" />,
  swap: <><path d="M7 4 4 7l3 3" /><path d="M4 7h11a4 4 0 0 1 4 4" /><path d="m17 20 3-3-3-3" /><path d="M20 17H9a4 4 0 0 1-4-4" /></>,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  home: <><path d="M4 11 12 4l8 7v9H4v-9Z" /><path d="M10 20v-5h4v5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sort: <path d="M4 7h16M4 12h10M4 17h6" />,
  check: <path d="m5 12 5 5 9-10" />,
  arrowUp: <><path d="M12 20V5" /><path d="m6 11 6-6 6 6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4Z" />,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  play: <path d="M8 5v14l11-7L8 5Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
};

export function Icon({ name, size = 24, className = "", stroke = 1.6 }: { name: keyof typeof P | string; size?: number; className?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {P[name]}
    </svg>
  );
}

export const Whatsapp = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="12" fill="#25D366" /><path fill="#fff" d="M12 5.5a6.4 6.4 0 0 0-5.5 9.7L5.6 18.5l3.4-.9A6.4 6.4 0 1 0 12 5.5Zm3.7 9c-.2.4-.9.8-1.3.8-.3 0-.8.1-2.5-.6-2.1-.9-3.4-3-3.5-3.2-.1-.1-.8-1.1-.8-2.1s.5-1.5.7-1.7c.2-.2.4-.2.5-.2h.4c.1 0 .3 0 .4.3l.6 1.4c.1.1.1.3 0 .4l-.3.4-.2.3c.1.2.5.9 1.1 1.4.8.7 1.4.9 1.6 1l.3-.1.5-.6c.1-.2.3-.2.4-.1l1.3.6c.2.1.3.2.4.2 0 .2 0 .6-.2 1Z" /></svg>
);

export const Facebook = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M14 8h3V4h-3c-2.8 0-4 1.7-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6Z" /></svg>
);

export const Instagram = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
);

export const Star = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#111" aria-hidden><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3-4.7-4.4 6.4-.8L12 2.8Z" /></svg>
);
