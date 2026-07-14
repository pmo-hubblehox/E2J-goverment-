import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  primaryColor: string;
  borderColor: string;
  textColor: string;
}

export default function MultiSelectDropdown({ options, selected, onChange, placeholder, primaryColor, borderColor, textColor }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', height: '42px', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', boxSizing: 'border-box' }}>
        <span style={{ color: selected.length ? textColor : '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
          {selected.length ? selected.join(', ') : placeholder}
        </span>
        <ChevronDown size={14} color="#94A3B8" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: `1px solid ${borderColor}`, borderRadius: '8px', maxHeight: '220px', overflowY: 'auto', zIndex: 30, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}>
          {options.map(opt => {
            const isSelected = selected.includes(opt);
            return (
              <label key={opt}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', fontSize: '13px', color: textColor, cursor: 'pointer', background: isSelected ? '#EEF2FF' : 'transparent' }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggle(opt)}
                  style={{ accentColor: primaryColor, width: '14px', height: '14px', cursor: 'pointer' }} />
                {opt}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
