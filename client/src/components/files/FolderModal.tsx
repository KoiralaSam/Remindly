import { FC, useState } from "react";
import { X, Folder } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  parentId?: string;
  onSuccess?: () => void;
}

export const FolderModal: FC<FolderModalProps> = ({
  isOpen,
  onClose,
  groupId,
  parentId,
  onSuccess,
}) => {
  const { user } = useUser();
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    setLoading(true);
    setError("");

    if (!user?.token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiConfig.folders.create(groupId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          name: folderName.trim(),
          parent_id: parentId || null,
        }),
      });

      // Check response status first
      if (!response.ok) {
        let errorMessage = "Failed to create folder";
        try {
          const errorData = await response.json();
          errorMessage =
            (errorData as { error?: string }).error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Parse success response (verify it's valid JSON)
      try {
        await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
      }

      setFolderName("");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error creating folder:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 pointer-events-auto">
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-md p-6 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Create Folder
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Folder Name
            </label>
            <Input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !folderName.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
