import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
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
  Star,
  MessageCircle,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { Groups } from "@/components/dashboard/groups";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { MainContent } from "@/components/dashboard/MainContent";
import { useSidebar } from "@/context/SidebarContext";
import { useUser } from "@/context/UserContext";

export default function Dashboard() {
  const { activeTab, setActiveTab } = useSidebar();
  const { user } = useUser();
  const [expandedSections, setExpandedSections] = useState({
    groups: true,
    directMessages: true,
    apps: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex flex-col h-screen w-full">
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

            {/* Starred */}
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 py-1.5">
                <Star className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  STARRED
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2 py-2 text-xs text-sidebar-foreground/50">
                  Drag and drop important stuff here
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Groups */}
            <SidebarGroup>
              <SidebarGroupLabel>
                <button
                  onClick={() => {
                    toggleSection("groups");
                    setActiveTab("groups");
                  }}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-sidebar-accent rounded-md transition-colors group"
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

            {/* Direct Messages */}
            <SidebarGroup>
              <SidebarGroupLabel>
                <button
                  onClick={() => {
                    toggleSection("directMessages");
                    setActiveTab("direct-messages");
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
              </SidebarGroupLabel>
              {expandedSections.directMessages && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeTab === "direct-messages"}
                        onClick={() => setActiveTab("direct-messages")}
                      >
                        <div className="flex aspect-square size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                          <span className="text-xs font-medium">
                            {user?.name?.split(" ")[0].charAt(0)}
                            {user?.name?.split(" ")[1].charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm">{user?.name}</span>
                        <span className="ml-auto text-xs text-sidebar-foreground/50">
                          you
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

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
