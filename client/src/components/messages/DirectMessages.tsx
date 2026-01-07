import { FC, useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useGroups, Group } from "@/context/GroupContext";
import { useSidebar } from "@/context/SidebarContext";
import { apiConfig } from "@/config/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
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
  Paperclip,
  Video,
  Mic,
  Calendar,
  Send,
  ChevronDown,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

export const DirectMessages: FC = () => {
  const { user } = useUser();
  const { groups, addGroup } = useGroups();
  const { setSelectedGroupId, setActiveTab } = useSidebar();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSending, setIsSending] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch(apiConfig.users.fromMyGroups, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch users");
          return;
        }

        const data = await response.json();
        setAvailableUsers(data.users || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [user?.token]);

  useEffect(() => {
    if (email.trim() === "") {
      setFilteredUsers([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = availableUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(email.toLowerCase()) ||
        u.name.toLowerCase().includes(email.toLowerCase())
    );
    setFilteredUsers(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [email, availableUsers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUserSelect = (selected: User) => {
    setSelectedUser(selected);
    setEmail(selected.email);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setEmail("");
    setSubject("");
    setMessage("");
    setSelectedUser(null);
    setFilteredUsers([]);
    setShowSuggestions(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser || !user?.token || !user?.name) return;

    try {
      setIsSending(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No auth token found");
      }

      // Format group name: "Recipient first, Sender first"
      const groupName = `${selectedUser.name.split(" ")[0]}, ${
        user.name.split(" ")[0]
      }`;
      const reverseGroupName = `${user.name.split(" ")[0]}, ${
        selectedUser.name.split(" ")[0]
      }`;

      // Check if a direct group already exists between these two users
      let directGroup = groups.find(
        (g) =>
          g.type === "direct" &&
          (g.name === groupName || g.name === reverseGroupName)
      );

      // If no existing group, create a new one
      if (!directGroup) {
        const createGroupResponse = await fetch(apiConfig.groups.create, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: groupName,
            description: `Direct message between ${selectedUser.name} and ${user.name}`,
            type: "direct",
          }),
        });

        if (!createGroupResponse.ok) {
          const errorData = await createGroupResponse.json();
          throw new Error(errorData.error || "Failed to create group");
        }

        const createGroupData = await createGroupResponse.json();
        directGroup = (createGroupData as { group: Group }).group;
        addGroup(directGroup);

        // Add the recipient as a member to the group via invitation
        // This will create an invitation that the recipient can accept
        const addMemberResponse = await fetch(
          apiConfig.groups.members(directGroup.id),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: selectedUser.email,
              user_id: selectedUser.id,
              role: "member",
            }),
          }
        );

        if (!addMemberResponse.ok) {
          const errorData = await addMemberResponse.json();
          console.error("Failed to add recipient:", errorData.error);
        }
      }

      // Send the message via WebSocket endpoint (broadcasts immediately, saves in background)
      const messageContent = subject.trim()
        ? `${subject}\n\n${message.trim()}`
        : message.trim();

      // Clear the form immediately (optimistic UI update)
      const messageToSend = messageContent;
      setMessage("");
      setSubject("");
      setEmail("");
      setSelectedUser(null);

      const sendMessageResponse = await fetch(
        `${apiConfig.baseURL}/api/groups/${directGroup.id}/ws/rooms/${directGroup.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: messageToSend,
          }),
        }
      );

      if (!sendMessageResponse.ok) {
        const errorData = await sendMessageResponse.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      // Navigate to the direct message group (message will appear via WebSocket)
      setSelectedGroupId(directGroup.id);
      setActiveTab("direct-messages");
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const getUserInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">New Message</h2>
      </div>

      {/* Message Composition Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* To Field */}
        <div className="px-6 py-2 border-b border-border">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground w-12 shrink-0">
              To
            </label>
            <div className="flex-1 relative" ref={suggestionsRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Recipient"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => {
                    if (filteredUsers.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="pl-10 pr-10 bg-background border-border text-foreground"
                />
                {email && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {showSuggestions && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                        <span className="text-xs font-medium">
                          {getUserInitials(user.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subject Field */}
        <div className="px-6 py-2 border-b border-border">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground w-12 shrink-0">
              Sub
            </label>
            <Input
              ref={subjectRef}
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-background border-border text-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  messageRef.current?.focus();
                }
              }}
            />
          </div>
        </div>

        {/* Message Body Area */}
        <div className="flex-1 overflow-hidden">
          <textarea
            ref={messageRef}
            placeholder="Compose message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-full px-6 py-4 resize-none border-0 outline-none bg-background text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
        </div>

        {/* Rich Text Editor / Composer */}
        <div className="border-t border-border bg-background">
          <div className="px-6 py-2">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 mb-2 pb-2 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <Bold className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <Italic className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <Underline className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <Strikethrough className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <LinkIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <List className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <ListOrdered className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <Indent className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <Code className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground hover:bg-accent"
              >
                <FileCode className="h-3 w-3" />
              </Button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-accent"
                >
                  <span className="text-xs font-semibold">Aa</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-accent"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-accent"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-accent"
                >
                  😊
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-accent"
                >
                  <Video className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-accent"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-accent"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSending || !message.trim() || !selectedUser}
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
