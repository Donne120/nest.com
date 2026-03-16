interface NestLogoProps {
  size?: number; // icon size in px, default 28
  showText?: boolean;
  textClassName?: string;
}

export default function NestLogo({ size = 28, showText = true, textClassName = '' }: NestLogoProps) {
  return (
    <span className="flex items-center gap-2 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect width="32" height="32" rx="7" fill="#6366f1" />
        <path d="M5 23 Q16 13 27 23 L25 29 Q16 31.5 7 29 Z" fill="#4338ca" />
        <path d="M7 24.5 Q16 18.5 25 24.5" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 27.5 Q16 23 23.5 27.5" stroke="#818cf8" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M11.5 17.5 Q10.5 22 11 29" stroke="#818cf8" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <path d="M20.5 17.5 Q21.5 22 21 29" stroke="#818cf8" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <ellipse cx="16" cy="19.5" rx="4.2" ry="5.2" fill="#f8fafc" />
        <ellipse cx="14.5" cy="17" rx="1.3" ry="1.8" fill="white" opacity="0.45" />
      </svg>
      {showText && (
        <span className={textClassName || 'font-semibold text-gray-900 dark:text-slate-100 text-sm'}>
          Nest Fledge
        </span>
      )}
    </span>
  );
}
