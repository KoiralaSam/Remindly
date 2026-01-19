import { FC, useState } from "react";
import { X, Link as LinkIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onSuccess?: () => void;
}

export const LinkModal: FC<LinkModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onSuccess,
}) => {
  const { user } = useUser();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("URL is required");
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
      const response = await fetch(apiConfig.links.create(groupId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || null,
          description: description.trim() || null,
        }),
      });

      // Check response status first
      if (!response.ok) {
        let errorMessage = "Failed to create link";
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

      setUrl("");
      setTitle("");
      setDescription("");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error creating link:", err);
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
            <LinkIcon className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Add Link</h2>
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
              URL <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Title (optional)
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Link title"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Link description"
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
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? "Adding..." : "Add Link"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
