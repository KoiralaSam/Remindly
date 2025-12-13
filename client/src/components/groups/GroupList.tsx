import { FC, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useGroups, Group } from "@/context/GroupContext";
import { useSidebar } from "@/context/SidebarContext";
import { apiConfig } from "@/config/api";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { CreateGroupModal } from "./CreateGroupModal";
import { Hash } from "lucide-react";

interface GroupsResponse {
  groups: Group[];
}

export const Groups: FC = () => {
  const { user } = useUser();
  const { groups, setGroups } = useGroups();
  const { selectedGroupId, setSelectedGroupId, setActiveTab } = useSidebar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasFetched, setHasFetched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      // Only fetch once
      if (hasFetched || !user?.token) {
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(apiConfig.groups.list, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(
            (data as { error?: string }).error || "Failed to fetch groups"
          );
          setLoading(false);
          return;
        }

        const groupsData = data as GroupsResponse;
        setGroups(groupsData.groups || []);
        setError("");
        setHasFetched(true);
      } catch (err) {
        setError("Network error. Please try again.");
        console.error("Error fetching groups:", err);
        setHasFetched(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [hasFetched, user?.token, setGroups]);

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading groups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <CreateGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="p-1">
        {groups.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">No groups yet</p>
            <p className="text-xs text-muted-foreground">Click the + button to create a group</p>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <SidebarMenuItem key={group.id}>
                <SidebarMenuButton
                  isActive={selectedGroupId === group.id}
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setActiveTab("groups");
                  }}
                >
                  <Hash className="h-4 w-4" />
                  <span className="text-sm">{group.name.replace("-", " ")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
