import { useState } from "react";
import ThemeToggle from "../components/common/ThemeToggle";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  ChevronRight,
  ArrowLeftRight,
  Edit,
  Zap,
  Folder,
  MessageCircle,
  UserPlus,
  ChevronDown,
  Plus,
} from "lucide-react";
import { Groups } from "@/components/groups/GroupList";
import { DirectMessagesList } from "@/components/messages/DirectMessagesList";
import { SearchBar } from "@/components/common/SearchBar";
import { MainContent } from "@/components/layout/MainContent";
import { useUser } from "@/context/UserContext";
import { useGroups } from "@/context/GroupContext";
import { useSidebar } from "@/context/SidebarContext";

export default function Dashboard() {
  const { activeTab, setActiveTab, setSelectedGroupId, callType } =
    useSidebar();
  const { user } = useUser();
  const { groups } = useGroups();
  const [expandedSections, setExpandedSections] = useState({
    groups: true,
    directMessages: true,
    apps: true,
  });
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
      <div className="relative z-50 w-full">
        <SearchBar />
      </div>

      <SidebarProvider>
        {/* Main Navigational Sidebar */}
        <Sidebar
          className="w-[260px] border-r pt-12"
          style={{ borderColor: "hsl(var(--sidebar-border))" }}
        >
          <SidebarHeader
            className="border-b"
            style={{ borderColor: "hsl(var(--sidebar-border))" }}
          >
            {/* Workspace Header */}
            <div className="px-3 py-2.5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 group">
                  <span className="font-semibold text-sm text-sidebar-foreground">
                    Remindly
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <ThemeToggle />
                  </div>
                  <button className="w-6 h-6 flex items-center justify-center transition-colors cursor-pointer hover:bg-sidebar-accent rounded text-sidebar-foreground/70 hover:text-sidebar-foreground">
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center transition-colors cursor-pointer hover:bg-sidebar-accent rounded text-sidebar-foreground/70 hover:text-sidebar-foreground">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Upgrade to Pro */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors bg-primary hover:bg-primary/90 text-primary-foreground">
                <Zap className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium flex-1">
                  Upgrade to Pro
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {/* Messages & Directories */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === "messages"}
                      onClick={() => setActiveTab("messages")}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Messages</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === "directories"}
                      onClick={() => setActiveTab("directories")}
                    >
                      <Folder className="h-4 w-4" />
                      <span>Directories</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* User's Private Group */}
            {(() => {
              const privateGroup = groups.find((g) => g.type === "private");
              const getUserInitials = (name: string) => {
                const parts = name.split(" ");
                if (parts.length === 0) return "";
                if (parts.length === 1) return parts[0][0].toUpperCase();
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
              };

              return privateGroup ? (
                <SidebarGroup>
                  <SidebarGroupLabel className="px-2 py-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 group-hover:text-sidebar-foreground">
                      Private
                    </span>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={activeTab === "private-space"}
                          onClick={() => {
                            setSelectedGroupId(privateGroup.id);
                            setActiveTab("private-space");
                          }}
                        >
                          <div className="flex aspect-square size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                            <span className="text-xs font-medium">
                              {getUserInitials(user?.name || "")}
                            </span>
                          </div>
                          <span className="text-sm">{privateGroup.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ) : null;
            })()}

            <SidebarSeparator />

            {/* Groups */}
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={() => {
                      toggleSection("groups");
                      setActiveTab("groups");
                    }}
                    className="flex items-center gap-1.5 flex-1 px-2 py-1.5 hover:bg-sidebar-accent rounded-md transition-colors group"
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform text-sidebar-foreground/60 group-hover:text-sidebar-foreground ${
                        expandedSections.groups ? "rotate-90" : ""
                      }`}
                    />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 group-hover:text-sidebar-foreground">
                      GROUPS
                    </span>
                  </button>
                  <button
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    className="p-1 hover:bg-sidebar-accent rounded text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                    aria-label="Create group"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </SidebarGroupLabel>
              {expandedSections.groups && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    <Groups />
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>
                <button
                  onClick={() => {
                    const directGroups = groups.filter(
                      (g) => g.type === "direct"
                    );
                    toggleSection("directMessages");
                    setActiveTab("direct-messages");
                    // If no direct messages, clear selectedGroupId to show composition area
                    if (directGroups.length === 0) {
                      setSelectedGroupId(null);
                    }
                  }}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-sidebar-accent rounded-md transition-colors group"
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform text-sidebar-foreground/60 group-hover:text-sidebar-foreground ${
                      expandedSections.directMessages ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 group-hover:text-sidebar-foreground">
                    DIRECT MESSAGES
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("direct-messages");
                    setSelectedGroupId(null);
                  }}
                  className="p-1 hover:bg-sidebar-accent rounded text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                  aria-label="Create direct message"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </SidebarGroupLabel>
            </SidebarGroup>
            {/* Direct Messages */}
            {expandedSections.directMessages && (
              <SidebarGroupContent>
                <SidebarMenu>
                  <DirectMessagesList />
                </SidebarMenu>
              </SidebarGroupContent>
            )}

            <SidebarSeparator />

            {/* Apps */}
            <SidebarGroup>
              <SidebarGroupLabel>
                <button
                  onClick={() => {
                    toggleSection("apps");
                    setActiveTab("apps");
                  }}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-sidebar-accent rounded-md transition-colors group"
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform text-sidebar-foreground/60 group-hover:text-sidebar-foreground ${
                      expandedSections.apps ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 group-hover:text-sidebar-foreground">
                    APPS
                  </span>
                </button>
              </SidebarGroupLabel>
              {expandedSections.apps && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeTab === "apps"}
                        onClick={() => setActiveTab("apps")}
                      >
                        <div className="flex aspect-square size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                          <span className="text-xs">R</span>
                        </div>
                        <span className="text-sm">Remindly Bot</span>
                        <div className="ml-auto flex aspect-square size-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-medium shrink-0">
                          1
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter
            className="border-t"
            style={{ borderColor: "hsl(var(--sidebar-border))" }}
          >
            <div className="px-3 py-3">
              <p className="text-xs mb-3 text-sidebar-foreground/50 leading-relaxed">
                Remindly works better when you use it together.
              </p>
              <SidebarMenuButton className="w-full bg-muted hover:bg-accent text-foreground">
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">Invite teammates</span>
              </SidebarMenuButton>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset
          className="bg-background"
          style={{
            marginLeft: "260px",
            marginTop: "48px",
            height: "calc(100vh - 48px)",
            width: "calc(100% - 260px)",
          }}
        >
          <MainContent />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
