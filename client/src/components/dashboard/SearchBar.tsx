import { FC, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/context/SidebarContext";

export const SearchBar: FC = () => {
  const { activeTab, setSearchQuery, searchQuery } = useSidebar();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  // Update context when local query changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  // Sync local query when context searchQuery changes externally
  useEffect(() => {
    if (searchQuery !== localQuery) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  const getPlaceholder = () => {
    if (!activeTab) {
      return "Search";
    }

    switch (activeTab) {
      case "messages":
        return "Search messages...";
      case "directories":
        return "Search directories...";
      case "groups":
        return "Search groups...";
      case "direct-messages":
        return "Search direct messages...";
      case "apps":
        return "Search apps...";
      default:
        return "Search...";
    }
  };

  const handleClear = () => {
    setLocalQuery("");
    setSearchQuery("");
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      <div className="relative flex items-center justify-right max-w-5xl mx-auto px-4 py-2">
        <div className="absolute left-6 flex items-center pointer-events-none z-10">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder={getPlaceholder()}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`h-8 pl-9 pr-9 text-sm bg-background border border-input rounded-md placeholder:text-muted-foreground transition-all ${
            isFocused
              ? "ring-2 ring-ring ring-offset-2 ring-offset-background border-ring"
              : ""
          }`}
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-6 flex items-center justify-center w-5 h-5 rounded hover:bg-accent transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
