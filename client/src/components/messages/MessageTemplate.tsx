import { FC, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useSidebar } from "@/context/SidebarContext";
import {
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
import { Message } from "@/context/MessageContext";

export interface MessageTemplateProps {
  group: {
    id: string;
    name: string;
    description?: string;
    type?: string; // "private", "direct", or "public"
  };
  messages: Message[];
  message: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (content: string) => Promise<void>;
  isSending?: boolean;
}

export const MessageTemplate: FC<MessageTemplateProps> = ({
  group,
  messages,
  message,
  onMessageChange,
  onSendMessage,
  isSending = false,
}) => {
  const { user } = useUser();
  const { setGroupSubTab } = useSidebar();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [messages.length, isSending]);

  // Get welcome message based on group type
  const getWelcomeMessage = () => {
    const groupType = group.type || "public";

    switch (groupType) {
      case "private":
        return {
          title: "Your personal workspace",
          description:
            "This is your private space. Keep notes, reminders, and personal thoughts here.",
        };
      case "direct":
        return {
          title: `Direct message with ${group.name}`,
          description:
            "This is a private conversation between you and this person.",
        };
      case "public":
      default:
        return {
          title: `Everyone's all here in #${group.name
            .replace(/\s+/g, "-")
            .toLowerCase()}`,
          description:
            group.description ||
            "Share announcements and updates about company news, upcoming events, or teammates who deserve some kudos.",
        };
    }
  };

  const welcome = getWelcomeMessage();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        {/* Welcome Section */}
        <div
          className={`px-6 py-8 ${
            group.type === "direct" ? "dark:bg-background/50" : ""
          }`}
        >
          <h2
            className={`text-2xl font-bold mb-2 text-foreground ${
              group.type === "direct" ? "dark:text-foreground" : ""
            }`}
          >
            {welcome.title}
          </h2>
          <p
            className={`text-muted-foreground mb-6 flex items-center gap-1 ${
              group.type === "direct" ? "dark:text-muted-foreground/80" : ""
            }`}
          >
            {welcome.description}
            {group.type === "public" && (
              <Star className="h-4 w-4 text-muted-foreground" />
            )}
          </p>

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
          {messages.map((msg) => {
            const isCurrentUser = msg.user_id === user?.id;
            const groupType = group.type || "public";

            // For private groups, don't show username since it's just the user
            const showUsername = groupType !== "private" && !isCurrentUser;
            // For direct messages, show avatars differently
            const showAvatar =
              groupType === "direct" ||
              (groupType === "public" && !isCurrentUser);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 mb-4 ${
                  isCurrentUser ? "flex-row-reverse" : ""
                }`}
              >
                {showAvatar && (
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                      groupType === "direct"
                        ? "bg-primary text-primary-foreground dark:bg-primary/90 dark:ring-2 dark:ring-primary/30"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {msg.username?.split(" ")[0]?.charAt(0)}
                    {msg.username?.split(" ")[1]?.charAt(0)}
                  </div>
                )}
                <div
                  className={`flex flex-col ${
                    isCurrentUser ? "items-end" : "items-start"
                  } max-w-[70%]`}
                >
                  {showUsername && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {msg.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {!showUsername && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                      isCurrentUser
                        ? groupType === "private"
                          ? "bg-muted text-foreground border border-border dark:bg-muted/60 dark:border-border/50"
                          : groupType === "direct"
                          ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:shadow-lg dark:shadow-primary/20"
                          : "bg-primary text-primary-foreground"
                        : groupType === "direct"
                        ? "bg-muted text-foreground dark:bg-muted/70 dark:text-foreground dark:border dark:border-border/40 dark:shadow-sm"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm">{msg.content}</p>
                      {msg.content.includes("has created a task") &&
                        groupType !== "private" && (
                          <Button
                            size="sm"
                            variant={isCurrentUser ? "secondary" : "outline"}
                            className={`h-6 px-2 text-xs ${
                              isCurrentUser
                                ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-primary-foreground/30"
                                : ""
                            }`}
                            onClick={() => setGroupSubTab("tasks")}
                          >
                            View
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Invisible div at the end to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Composer */}
      <div
        className={`border-t border-border bg-background p-4 ${
          group.type === "direct"
            ? "dark:bg-background/95 dark:border-border/50"
            : ""
        }`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Formatting Toolbar */}
          <div
            className={`flex items-center gap-1 mb-2 pb-2 border-b border-border ${
              group.type === "direct" ? "dark:border-border/50" : ""
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <Underline className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <Strikethrough className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <LinkIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <List className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <ListOrdered className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <Indent className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <Code className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
            >
              <FileCode className="h-3 w-3" />
            </Button>
          </div>

          {/* Input and Action Bar */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder={
                  group.type === "private"
                    ? "Add a note to yourself..."
                    : group.type === "direct"
                    ? `Message ${group.name}...`
                    : `Message #${group.name
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`
                }
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                className={`min-h-[60px] pr-20 text-foreground placeholder:text-muted-foreground bg-background border-border transition-colors ${
                  group.type === "direct"
                    ? "dark:bg-muted/30 dark:border-border/50 dark:placeholder:text-muted-foreground/70 dark:focus:bg-muted/50 dark:focus:border-primary/50 dark:focus:ring-2 dark:focus:ring-primary/20"
                    : "dark:focus:ring-2 dark:focus:ring-primary/20"
                }`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      onSendMessage(message);
                      onMessageChange("");
                    }
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-foreground hover:text-foreground"
                >
                  <span className="text-xs font-semibold">Aa</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-foreground hover:text-foreground"
                >
                  <AtSign className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-foreground hover:text-foreground"
                >
                  😊
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground hover:text-foreground"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground hover:text-foreground"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground hover:text-foreground"
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="h-9 w-9"
                disabled={isSending}
                onClick={() => {
                  if (message.trim()) {
                    onSendMessage(message);
                    onMessageChange("");
                  }
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground hover:text-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
