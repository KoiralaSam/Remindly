import { FC, useState, useRef, useEffect } from "react";
import {
  UserPlus,
  Headphones,
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
  Phone,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/SidebarContext";
import { useGroups } from "@/context/GroupContext";
import { useUser } from "@/context/UserContext";
import { InviteUserModal } from "@/components/groups/InviteUserModal";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import { ViewMembersModal } from "@/components/groups/ViewMembersModal";
import { ViewMediaFilesModal } from "@/components/groups/ViewMediaFilesModal";
import { FileUploadModal } from "@/components/files/FileUploadModal";
import { FolderModal } from "@/components/files/FolderModal";
import { LinkModal } from "@/components/files/LinkModal";
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
    setCallType,
  } = useSidebar();
  const { groups, removeGroup } = useGroups();
  const { user } = useUser();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [isViewMembersModalOpen, setIsViewMembersModalOpen] = useState(false);
  const [isViewMediaFilesModalOpen, setIsViewMediaFilesModalOpen] =
    useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isCallMenuOpen, setIsCallMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const callMenuRef = useRef<HTMLDivElement>(null);

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
      if (
        callMenuRef.current &&
        !callMenuRef.current.contains(event.target as Node)
      ) {
        setIsCallMenuOpen(false);
      }
    };

    if (isPlusMenuOpen || isMoreMenuOpen || isCallMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isPlusMenuOpen, isMoreMenuOpen, isCallMenuOpen]);

  const handlePlusMenuAction = (action: string) => {
    setIsPlusMenuOpen(false);

    switch (action) {
      case "task":
        setIsAddTaskModalOpen(true);
        break;
      case "delete-task":
        setIsDeleteTaskModalOpen(true);
        break;
      case "file":
        setIsFileUploadModalOpen(true);
        break;
      case "folder":
        setIsFolderModalOpen(true);
        break;
      case "link":
        setIsLinkModalOpen(true);
        break;
      default:
        break;
    }
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
      case "view-media-files":
        setIsViewMediaFilesModalOpen(true);
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
  if (activeTab === "direct-messages" && selectedGroup) {
    return (
      <>
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
        <ViewMediaFilesModal
          isOpen={isViewMediaFilesModalOpen}
          onClose={() => setIsViewMediaFilesModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <FileUploadModal
          isOpen={isFileUploadModalOpen}
          onClose={() => setIsFileUploadModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <FolderModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <LinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              {selectedGroup.name}
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
                  </div>
                )}
              </div>
            </div>
          </div>
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
                  <span>View members</span>
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
      </>
    );
  }

  if (activeTab === "private-space" && selectedGroup) {
    return (
      <>
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
        <ViewMediaFilesModal
          isOpen={isViewMediaFilesModalOpen}
          onClose={() => setIsViewMediaFilesModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <FileUploadModal
          isOpen={isFileUploadModalOpen}
          onClose={() => setIsFileUploadModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <FolderModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <LinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              Your personal Workspace
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
        <ViewMediaFilesModal
          isOpen={isViewMediaFilesModalOpen}
          onClose={() => setIsViewMediaFilesModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <FileUploadModal
          isOpen={isFileUploadModalOpen}
          onClose={() => setIsFileUploadModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <FolderModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <LinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
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
            <div className="relative" ref={callMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-foreground hover:text-foreground"
                onClick={() => setIsCallMenuOpen(!isCallMenuOpen)}
              >
                <Headphones className="h-4 w-4" />
                Call
                <ChevronDown className="h-4 w-4" />
              </Button>

              {/* Call Dropdown Menu */}
              {isCallMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setIsCallMenuOpen(false);
                      setCallType("audio");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Audio</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCallMenuOpen(false);
                      setCallType("video");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Video className="h-4 w-4" />
                    <span>Video</span>
                  </button>
                </div>
              )}
            </div>
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
                  <button
                    onClick={() => handleMoreMenuAction("view-media-files")}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View media, files and links</span>
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
                messagesSubTab === "notifications"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMessagesSubTab("notifications")}
            >
              Notifications
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

  if (activeTab === "direct-messages" && selectedGroup) {
    return (
      <>
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
        <ViewMediaFilesModal
          isOpen={isViewMediaFilesModalOpen}
          onClose={() => setIsViewMediaFilesModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <FileUploadModal
          isOpen={isFileUploadModalOpen}
          onClose={() => setIsFileUploadModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <FolderModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <LinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          groupId={selectedGroup.id}
        />
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              {selectedGroup.name}
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
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
