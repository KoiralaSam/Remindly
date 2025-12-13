import React, { createContext, useContext, useState, ReactNode } from "react";

export type SidebarTab =
  | "messages"
  | "directories"
  | "groups"
  | "direct-messages"
  | "apps"
  | null;

interface SidebarContextType {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <SidebarContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedGroupId,
        setSelectedGroupId,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
