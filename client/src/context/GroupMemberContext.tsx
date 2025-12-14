import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { apiConfig } from "@/config/api";
import { useUser } from "./UserContext";
import { useGroups } from "./GroupContext";

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface GroupMembersMap {
  [groupId: string]: GroupMember[];
}

interface GroupMemberContextType {
  groupMembers: GroupMembersMap;
  getGroupMembers: (groupId: string) => GroupMember[];
  fetchGroupMembers: (groupId: string) => Promise<void>;
  refreshGroupMembers: (groupId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const GroupMemberContext = createContext<GroupMemberContextType | undefined>(
  undefined
);

export const useGroupMembers = () => {
  const context = useContext(GroupMemberContext);
  if (context === undefined) {
    throw new Error(
      "useGroupMembers must be used within a GroupMemberProvider"
    );
  }
  return context;
};

interface GroupMemberProviderProps {
  children: ReactNode;
}

export const GroupMemberProvider: React.FC<GroupMemberProviderProps> = ({
  children,
}) => {
  const { user } = useUser();
  const { groups } = useGroups();
  const [groupMembers, setGroupMembers] = useState<GroupMembersMap>({});
  const [fetchedGroups, setFetchedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupMembers = useCallback(
    async (groupId: string) => {
      if (!user?.token) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(apiConfig.groups.members(groupId), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch group members: ${response.statusText}`
          );
        }

        const data = await response.json();
        const members = (data.group_members || []) as GroupMember[];

        setGroupMembers((prev) => ({
          ...prev,
          [groupId]: members,
        }));

        setFetchedGroups((prev) => new Set(prev).add(groupId));

        setIsLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch group members";
        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [user]
  );

  // Fetch members for all groups when groups are loaded
  useEffect(() => {
    if (!user?.token || groups.length === 0) return;

    // Fetch members for groups that haven't been fetched yet
    groups.forEach((group) => {
      if (!fetchedGroups.has(group.id)) {
        fetchGroupMembers(group.id);
      }
    });
  }, [groups, user?.token, fetchedGroups, fetchGroupMembers]);

  const getGroupMembers = useCallback(
    (groupId: string): GroupMember[] => {
      return groupMembers[groupId] || [];
    },
    [groupMembers]
  );

  const refreshGroupMembers = useCallback(
    async (groupId: string) => {
      // Force refresh by removing from fetched set
      setFetchedGroups((prev) => {
        const updated = new Set(prev);
        updated.delete(groupId);
        return updated;
      });
      await fetchGroupMembers(groupId);
    },
    [fetchGroupMembers]
  );

  const value: GroupMemberContextType = {
    groupMembers,
    getGroupMembers,
    fetchGroupMembers,
    refreshGroupMembers,
    isLoading,
    error,
  };

  return (
    <GroupMemberContext.Provider value={value}>
      {children}
    </GroupMemberContext.Provider>
  );
};
