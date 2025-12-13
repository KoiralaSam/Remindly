import { FC } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { GroupMessages } from "@/components/groups/GroupMessages";
import { ContentHeader } from "@/components/layout/ContentHeader";

export const MainContent: FC = () => {
  const { selectedGroupId, activeTab } = useSidebar();

  return (
    <div className="flex flex-col h-full">
      <ContentHeader />
      <div className="flex-1 overflow-hidden">
        {activeTab === "groups" && selectedGroupId ? (
          <GroupMessages groupId={selectedGroupId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                No content to display
              </p>
              <p className="text-xs text-muted-foreground">
                {activeTab === "groups"
                  ? "Select a group from the sidebar"
                  : "Content for this section coming soon"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
