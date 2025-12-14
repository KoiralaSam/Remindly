import { FC } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { GroupMessages } from "@/components/groups/GroupMessages";
import { GroupTasks } from "@/components/tasks/GroupTasks";
import { InvitationsView } from "@/components/invitations/InvitationsView";
import { ContentHeader } from "@/components/layout/ContentHeader";

export const MainContent: FC = () => {
  const { selectedGroupId, activeTab, messagesSubTab, groupSubTab } =
    useSidebar();

  return (
    <div className="flex flex-col h-full">
      <ContentHeader />
      <div className="flex-1 overflow-hidden">
        {activeTab === "groups" && selectedGroupId ? (
          groupSubTab === "tasks" ? (
            <GroupTasks groupId={selectedGroupId} />
          ) : (
            <GroupMessages groupId={selectedGroupId} />
          )
        ) : activeTab === "messages" ? (
          messagesSubTab === "invitations" ? (
            <InvitationsView />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  No messages to display
                </p>
                <p className="text-xs text-muted-foreground">
                  Messages content coming soon
                </p>
              </div>
            </div>
          )
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
