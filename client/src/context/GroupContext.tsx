import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface GroupContextType {
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, group: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;
  clearGroups: () => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroups must be used within a GroupProvider");
  }
  return context;
};

interface GroupProviderProps {
  children: ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const [groups, setGroupsState] = useState<Group[]>([]);

  const setGroups = (groupsData: Group[]) => {
    setGroupsState(groupsData);
  };

  const addGroup = (group: Group) => {
    setGroupsState((prev) => [...prev, group]);
  };

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    setGroupsState((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  const removeGroup = (groupId: string) => {
    setGroupsState((prev) => prev.filter((group) => group.id !== groupId));
  };

  const clearGroups = () => {
    setGroupsState([]);
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        setGroups,
        addGroup,
        updateGroup,
        removeGroup,
        clearGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};
