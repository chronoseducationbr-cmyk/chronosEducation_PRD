import { useState, useRef, useEffect, useCallback } from "react";

const civilStatusOptions = [
  "Casado(a)",
  "Divorciado(a)",
  "Solteiro(a)",
  "União Estável",
  "Viúvo(a)",
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CivilStatusCombobox = ({ value, onChange, className = "" }: Props) => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const handleSelect = useCallback(
    (option: string) => {
      onChange(option);
      setOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, civilStatusOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0 && highlightIndex < civilStatusOptions.length) {
      e.preventDefault();
      handleSelect(civilStatusOptions[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={`${className} text-left flex items-center justify-between`}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Selecione..."}
        </span>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
        >
          {civilStatusOptions.map((option, idx) => (
            <li
              key={option}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                highlightIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
              } ${option === value ? "font-semibold" : ""}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CivilStatusCombobox;
