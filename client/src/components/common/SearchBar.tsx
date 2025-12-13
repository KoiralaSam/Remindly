import { FC, useState, useEffect, useRef } from "react";
import { Search, X, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/context/SidebarContext";
import { useUser } from "@/context/UserContext";
import { useGroups } from "@/context/GroupContext";
import { useMessages } from "@/context/MessageContext";
import { useNavigate } from "react-router-dom";

export const SearchBar: FC = () => {
  const { activeTab, setSearchQuery, searchQuery } = useSidebar();
  const { user, logout } = useUser();
  const { clearGroups } = useGroups();
  const { clearAllMessages } = useMessages();
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    // Clear all context data
    clearGroups();
    clearAllMessages();

    // Call logout which clears user data and localStorage
    await logout();

    // Navigate to home page
    navigate("/");
  };

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
      <div className="relative flex items-center justify-between max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center flex-1 relative">
          <div className="absolute left-3 flex items-center pointer-events-none z-10">
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
              className="absolute right-3 flex items-center justify-center w-5 h-5 rounded hover:bg-accent transition-colors z-10"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* User Icon with Dropdown */}
        <div className="relative ml-4" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors text-foreground"
            aria-label="User menu"
          >
            <User className="h-5 w-5" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
              {/* User Info */}
              {user && (
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              )}

              {/* Logout Option */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
