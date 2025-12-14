import { FC, useState, useRef, useEffect } from "react";
import {
  UserPlus,
  Headphones,
  User,
  Search,
  MoreVertical,
  Plus,
  ChevronDown,
  FileText,
  File,
  CheckSquare,
  Folder,
  Link as LinkIcon,
  Layout,
  List,
  Zap,
  Trash2,
  Users,
  LogOut,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/SidebarContext";
import { useGroups } from "@/context/GroupContext";
import { useUser } from "@/context/UserContext";
import { InviteUserModal } from "@/components/groups/InviteUserModal";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import { ViewMembersModal } from "@/components/groups/ViewMembersModal";
import { apiConfig } from "@/config/api";

export const ContentHeader: FC = () => {
  const {
    activeTab,
    selectedGroupId,
    setSelectedGroupId,
    messagesSubTab,
    setMessagesSubTab,
    groupSubTab,
    setGroupSubTab,
  } = useSidebar();
  const { groups, removeGroup } = useGroups();
  const { user } = useUser();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [isViewMembersModalOpen, setIsViewMembersModalOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(event.target as Node)
      ) {
        setIsPlusMenuOpen(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isPlusMenuOpen || isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isPlusMenuOpen, isMoreMenuOpen]);

  const handlePlusMenuAction = (action: string) => {
    setIsPlusMenuOpen(false);

    if (action === "task") {
      setIsAddTaskModalOpen(true);
    } else if (action === "delete-task") {
      setIsDeleteTaskModalOpen(true);
    }
    // Handle other actions here
  };

  const selectedGroup = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId)
    : null;

  const isOwner = selectedGroup?.created_by === user?.id;

  const handleLeaveGroup = async () => {
    if (!selectedGroupId || !user?.id || !user?.token) return;

    if (!confirm("Are you sure you want to leave this group?")) {
      return;
    }

    try {
      const response = await fetch(
        `${apiConfig.groups.byId(selectedGroupId)}/members/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          (data as { error?: string }).error || "Failed to leave group"
        );
      }

      // Remove group from list and clear selection
      removeGroup(selectedGroupId);
      setSelectedGroupId(null);
      setIsMoreMenuOpen(false);
    } catch (err) {
      console.error("Error leaving group:", err);
      alert(err instanceof Error ? err.message : "Failed to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId || !user?.token) return;

    if (
      !confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(apiConfig.groups.byId(selectedGroupId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          (data as { error?: string }).error || "Failed to delete group"
        );
      }

      // Remove group from list and clear selection
      removeGroup(selectedGroupId);
      setSelectedGroupId(null);
      setIsMoreMenuOpen(false);
    } catch (err) {
      console.error("Error deleting group:", err);
      alert(err instanceof Error ? err.message : "Failed to delete group");
    }
  };

  const handleMoreMenuAction = (action: string) => {
    setIsMoreMenuOpen(false);

    switch (action) {
      case "view-members":
        setIsViewMembersModalOpen(true);
        break;
      case "leave-group":
        handleLeaveGroup();
        break;
      case "edit-group":
        // TODO: Implement edit group modal
        alert("Edit group functionality coming soon");
        break;
      case "delete-group":
        handleDeleteGroup();
        break;
      default:
        break;
    }
  };

  // Render different headers based on activeTab
  if (activeTab === "groups" && selectedGroup) {
    return (
      <>
        <InviteUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <AddTaskModal
          isOpen={isAddTaskModalOpen}
          onClose={() => setIsAddTaskModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <DeleteTaskModal
          isOpen={isDeleteTaskModalOpen}
          onClose={() => setIsDeleteTaskModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <ViewMembersModal
          isOpen={isViewMembersModalOpen}
          onClose={() => setIsViewMembersModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              #{selectedGroup.name.replace(/\s+/g, "-").toLowerCase()}
            </h1>
            <div className="flex items-center gap-1 border-l border-border pl-4">
              <button
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  groupSubTab === "messages"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setGroupSubTab("messages")}
              >
                Messages
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  groupSubTab === "tasks"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setGroupSubTab("tasks")}
              >
                Tasks
              </button>
              <div className="relative" ref={plusMenuRef}>
                <button
                  className="px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {isPlusMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={() => handlePlusMenuAction("canvas")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Layout className="h-4 w-4" />
                      <span>Canvas</span>
                    </button>
                    <button
                      onClick={() => handlePlusMenuAction("list")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <List className="h-4 w-4" />
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => handlePlusMenuAction("workflow")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Workflow</span>
                    </button>
                    <button
                      onClick={() => handlePlusMenuAction("file")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <File className="h-4 w-4" />
                      <span>File</span>
                    </button>
                    <button
                      onClick={() => handlePlusMenuAction("document")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Document</span>
                    </button>
                    <button
                      onClick={() => handlePlusMenuAction("task")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <CheckSquare className="h-4 w-4" />
                      <span>Task</span>
                    </button>
                    <button
                      onClick={() => handlePlusMenuAction("folder")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Folder className="h-4 w-4" />
                      <span>Folder</span>
                    </button>
                    <button
                      onClick={() => handlePlusMenuAction("link")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>Link</span>
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => handlePlusMenuAction("delete-task")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Task</span>
                    </button>
                  </div>
                )}
              </div>
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
            <div className="relative" ref={moreMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:text-foreground"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {/* Dropdown Menu */}
              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => handleMoreMenuAction("view-members")}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>View team members</span>
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button
                    onClick={() => handleMoreMenuAction("edit-group")}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit group</span>
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button
                    onClick={() => handleMoreMenuAction("leave-group")}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-accent transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Leave group</span>
                  </button>
                  {isOwner && (
                    <>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => handleMoreMenuAction("delete-group")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-accent transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete group</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (activeTab === "messages") {
    return (
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">Messages</h1>
          <div className="flex items-center gap-1 border-l border-border pl-4">
            <button
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                messagesSubTab === "messages"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMessagesSubTab("messages")}
            >
              Messages
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                messagesSubTab === "invitations"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMessagesSubTab("invitations")}
            >
              Invitations
            </button>
          </div>
        </div>
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
