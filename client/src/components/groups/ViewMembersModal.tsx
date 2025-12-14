import { FC } from "react";
import { X, User } from "lucide-react";
import { useGroupMembers } from "@/context/GroupMemberContext";
import { Button } from "@/components/ui/button";

interface ViewMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export const ViewMembersModal: FC<ViewMembersModalProps> = ({
  isOpen,
  onClose,
  groupId,
}) => {
  const { getGroupMembers } = useGroupMembers();
  const members = getGroupMembers(groupId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Team Members
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {member.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || <User className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {member.user?.name || "Unknown User"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.user?.email || "No email"}
                    </div>
                  </div>
                  <div className="px-2 py-1 text-xs font-medium rounded bg-muted text-foreground capitalize">
                    {member.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
