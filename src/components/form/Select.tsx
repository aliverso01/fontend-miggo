import { useState, useEffect, useRef } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onChange(value);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div
        className={`relative w-full cursor-pointer rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs outline-none transition focus:border-brand-300 active:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300 ${isOpen ? 'border-brand-300 ring-2 ring-brand-500/10' : ''
          }`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className={selectedValue ? "text-gray-800 dark:text-white/90" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <svg
            className={`fill-current text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.6921 7.09327C3.91666 6.83119 4.31135 6.80084 4.57343 7.0254L9.99997 11.6768L15.4265 7.0254C15.6886 6.80084 16.0833 6.83119 16.3078 7.09327C16.5324 7.35535 16.502 7.75004 16.24 7.9746L10.4067 12.9746C10.1727 13.1752 9.82728 13.1752 9.59322 12.9746L3.75989 7.9746C3.49781 7.75004 3.46746 7.35535 3.6921 7.09327Z"
              fill=""
            />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-100 dark:border-gray-800">
            <input
              ref={inputRef}
              type="text"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/5 ${selectedValue === option.value
                      ? "bg-brand-50 text-brand-500 dark:bg-white/5 dark:text-white"
                      : "text-gray-700 dark:text-gray-400"
                    }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
