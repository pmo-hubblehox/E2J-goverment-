export default function HubblehoxLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.4 : 1;
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }} className="flex items-center gap-2">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="18,2 26,10 18,10" fill="#3B3BC8" />
        <polygon points="18,10 26,10 26,18" fill="#3B3BC8" opacity="0.7" />
        <polygon points="18,2 18,10 10,10" fill="#22C55E" />
        <polygon points="10,10 18,10 18,18" fill="#22C55E" opacity="0.7" />
        <polygon points="18,18 26,18 26,26" fill="#F59E0B" />
        <polygon points="18,18 18,26 26,26" fill="#F59E0B" opacity="0.7" />
        <polygon points="10,18 18,18 18,26" fill="#EF4444" />
        <polygon points="10,18 10,26 18,26" fill="#EF4444" opacity="0.7" />
      </svg>
      <div>
        <div className="font-bold text-gray-900 text-lg leading-none tracking-tight">HUBBLEHOX</div>
        <div className="text-[9px] text-gray-400 tracking-widest leading-none mt-0.5">LEARN • EARN • GROW</div>
      </div>
    </div>
  );
}
