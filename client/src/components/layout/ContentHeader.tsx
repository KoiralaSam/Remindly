import { FC, useState } from "react";
import {
  UserPlus,
  Headphones,
  User,
  Search,
  MoreVertical,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/SidebarContext";
import { useGroups } from "@/context/GroupContext";
import { InviteUserModal } from "@/components/groups/InviteUserModal";

export const ContentHeader: FC = () => {
  const { activeTab, selectedGroupId } = useSidebar();
  const { groups } = useGroups();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const selectedGroup = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId)
    : null;

  // Render different headers based on activeTab
  if (activeTab === "groups" && selectedGroup) {
    return (
      <>
        <InviteUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              #{selectedGroup.name.replace(/\s+/g, "-").toLowerCase()}
            </h1>
            <div className="flex items-center gap-1 border-l border-border pl-4">
              <button className="px-3 py-1 text-sm font-medium transition-colors text-foreground border-b-2 border-foreground">
                Messages
              </button>
              <button className="px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1 text-muted-foreground hover:text-foreground">
                Add canvas
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-foreground hover:text-foreground"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Invite teammates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-foreground hover:text-foreground"
            >
              <Headphones className="h-4 w-4" />
              Huddle
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground hover:text-foreground"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (activeTab === "messages") {
    return (
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <h1 className="text-lg font-semibold text-foreground">Messages</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (activeTab === "directories") {
    return (
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <h1 className="text-lg font-semibold text-foreground">Directories</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (activeTab === "direct-messages") {
    return (
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <h1 className="text-lg font-semibold text-foreground">
          Direct Messages
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (activeTab === "apps") {
    return (
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <h1 className="text-lg font-semibold text-foreground">Apps</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Default empty header
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
      <h1 className="text-lg font-semibold text-foreground">Remindly</h1>
    </div>
  );
};
