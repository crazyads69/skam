"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy.",
  className,
}: ComboboxProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Track intent to prevent outside-click racing with option selection
  const selectingRef = useRef(false);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label,
    [options, value],
  );

  const openDropdown = useCallback(() => {
    setOpen(true);
    setQuery("");
    setHighlightIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlightIndex(-1);
  }, []);

  const selectOption = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  // Close on outside pointerdown (works for mouse + touch)
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      // Skip if we're in the middle of selecting an option
      if (selectingRef.current) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open, closeDropdown]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-combobox-item]");
    items[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          selectOption(filtered[highlightIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
    }
  }

  function handleOptionClick(optionValue: string) {
    selectingRef.current = true;
    selectOption(optionValue);
    // Reset after microtask to allow event to fully propagate
    queueMicrotask(() => {
      selectingRef.current = false;
    });
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface-1 px-3 text-left text-sm leading-5 text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-neon",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selectedLabel && "text-(--text-disabled)",
        )}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 opacity-70 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-lg border border-border bg-surface-1 shadow-md"
          // Prevent any click inside dropdown from blurring the search input
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Search input */}
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3">
              <Search className="size-4 shrink-0 text-(--text-disabled)" />
              <input
                ref={inputRef}
                type="text"
                className="h-9 w-full bg-transparent text-sm text-foreground placeholder:text-(--text-disabled) focus:outline-none"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            role="listbox"
            aria-label={placeholder}
            className="max-h-60 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-(--text-tertiary)">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightIndex;
                return (
                  <li
                    key={option.value}
                    data-combobox-item
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none transition-colors",
                      isHighlighted && "bg-surface-3 text-foreground",
                      !isHighlighted && "text-foreground hover:bg-surface-3/50",
                    )}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => handleOptionClick(option.value)}
                  >
                    <span className="absolute left-2 flex size-4 items-center justify-center">
                      {isSelected && <Check className="size-4 text-neon" />}
                    </span>
                    {option.label}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
