import { FC } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { GroupMessages } from "./GroupMessages";

export const MainContent: FC = () => {
  const { activeTab, selectedGroupId } = useSidebar();

  if (activeTab === "groups" && selectedGroupId) {
    return <GroupMessages groupId={selectedGroupId} />;
  }

  // Default empty state
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <p className="text-lg">Select a group to get started</p>
      </div>
    </div>
  );
};
