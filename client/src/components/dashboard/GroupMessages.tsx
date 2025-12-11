import { FC, useState } from "react";
import { useGroups } from "@/context/GroupContext";
import { useUser } from "@/context/UserContext";
import {
  UserPlus,
  Headphones,
  User,
  Search,
  MoreVertical,
  Plus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Indent,
  Code,
  FileCode,
  AtSign,
  Paperclip,
  Video,
  Mic,
  Calendar,
  Send,
  ChevronDown,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GroupMessagesProps {
  groupId: string;
}

export const GroupMessages: FC<GroupMessagesProps> = ({ groupId }) => {
  const { groups } = useGroups();
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "canvas">("messages");

  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Bar - Channel Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            #{group.name.replace(/\s+/g, "-").toLowerCase()}
          </h1>
          <div className="flex items-center gap-1 border-l border-border pl-4">
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                activeTab === "messages"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab("canvas")}
              className={`px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1 ${
                activeTab === "canvas"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Add canvas
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite teammates
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Headphones className="h-4 w-4" />
            Huddle
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <User className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Welcome Section */}
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            Everyone's all here in #
            {group.name.replace(/\s+/g, "-").toLowerCase()}
          </h2>
          <p className="text-muted-foreground mb-6 flex items-center gap-1">
            {group.description ||
              "Share announcements and updates about company news, upcoming events, or teammates who deserve some kudos."}
            <Star className="h-4 w-4 text-muted-foreground" />
          </p>

          {/* Setup Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors bg-card">
              <div className="text-sm font-medium mb-1 text-foreground">
                Add company handbook
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                Canvas template
              </div>
              <div className="bg-muted text-muted-foreground rounded p-2 text-xs">
                Onboarding checklist
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors bg-card">
              <div className="text-sm font-medium mb-1 text-foreground">
                Personalize a welcome message
              </div>
              <div className="text-xs text-muted-foreground">
                Record a short video clip
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors bg-card">
              <div className="text-sm font-medium mb-1 text-foreground">
                Invite teammates
              </div>
              <div className="text-xs text-muted-foreground">
                Add your whole team
              </div>
            </div>
          </div>

          {/* Date Separator */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 border-t border-border"></div>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              Today
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Message History */}
          <div className="flex items-start gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
              {user?.name?.split(" ")[0]?.charAt(0)}
              {user?.name?.split(" ")[1]?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{user?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground">
                joined #{group.name.replace(/\s+/g, "-").toLowerCase()}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Input - Composer */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 mb-2 pb-2 border-b border-border">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Bold className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Italic className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Underline className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Strikethrough className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <LinkIcon className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <List className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ListOrdered className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Indent className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Code className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <FileCode className="h-3 w-3" />
            </Button>
          </div>

          {/* Input and Action Bar */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder={`Message #${group.name
                  .replace(/\s+/g, "-")
                  .toLowerCase()}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[60px] pr-20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    // Handle send message
                    setMessage("");
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <span className="text-xs font-semibold">Aa</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <AtSign className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  😊
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Calendar className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" className="h-9 w-9">
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
