import { useState, useRef, useEffect, useCallback } from "react";
import { nationalities, type Nationality } from "@/data/nationalities";
import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";

const FlagIcon = ({ code, size = 20 }: { code: string; size?: number }) => {
  const upper = code.toUpperCase();
  if (!upper || !hasFlag(upper)) return <span className="inline-block" style={{ width: size, height: size * 2 / 3 }}>🏳️</span>;
  const FlagComponent = (Flags as any)[upper];
  if (!FlagComponent) return <span className="inline-block" style={{ width: size, height: size * 2 / 3 }}>🏳️</span>;
  return <FlagComponent style={{ width: size, height: size * 2 / 3, borderRadius: 2, objectFit: "cover" }} />;
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

const NationalityCombobox = ({ value, onChange, onBlur, className = "", placeholder = "Pesquisar nacionalidade..." }: Props) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value && !open) setQuery(value);
  }, [value, open]);

  const filtered = query.trim()
    ? nationalities.filter(
        (n) =>
          n.nationality.toLowerCase().includes(query.toLowerCase()) ||
          n.country.toLowerCase().includes(query.toLowerCase())
      )
    : nationalities;

  const handleSelect = useCallback(
    (n: Nationality) => {
      onChange(n.nationality);
      setQuery(n.nationality);
      setOpen(false);
      onBlur?.();
    },
    [onChange, onBlur]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!value) setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value]);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0 && highlightIndex < filtered.length) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectedNationality = nationalities.find((n) => n.nationality === value);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {value && selectedNationality && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            <FlagIcon code={selectedNationality.code} size={20} />
          </span>
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIndex(-1);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={handleKeyDown}
          className={`${className} ${value && selectedNationality ? "pl-10" : ""}`}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-muted-foreground">Nenhuma nacionalidade encontrada</li>
          ) : (
            filtered.map((n, idx) => (
              <li
                key={n.code + n.country}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(n)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-colors ${
                  highlightIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                } ${n.nationality === value ? "font-semibold" : ""}`}
              >
                <span className="shrink-0 flex items-center">
                  <FlagIcon code={n.code} size={20} />
                </span>
                <span className="truncate">
                  <span className="text-foreground">{n.nationality}</span>
                  <span className="text-muted-foreground ml-1.5 text-xs">({n.country})</span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default NationalityCombobox;
