import { FC } from "react";
import { useGroups } from "@/context/GroupContext";
import { useSidebar } from "@/context/SidebarContext";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export const DirectMessagesList: FC = () => {
  const { groups } = useGroups();
  const { selectedGroupId, setSelectedGroupId, setActiveTab, activeTab } =
    useSidebar();

  // Filter groups to only show direct message groups
  const directGroups = groups.filter((group) => group.type === "direct");

  const getUserInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (directGroups.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          No direct messages yet
        </p>
        <p className="text-xs text-muted-foreground">
          Start a conversation to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="p-1">
      {directGroups.map((group) => (
        <SidebarMenuItem key={group.id}>
          <SidebarMenuButton
            isActive={
              selectedGroupId === group.id && activeTab === "direct-messages"
            }
            onClick={() => {
              setSelectedGroupId(group.id);
              setActiveTab("direct-messages");
            }}
          >
            <div className="flex aspect-square size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
              <span className="text-xs font-medium">
                {getUserInitials(group.name)}
              </span>
            </div>
            <span className="text-sm">{group.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </div>
  );
};
