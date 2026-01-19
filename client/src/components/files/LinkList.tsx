import { FC, useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Trash2, ExternalLink, Loader2 } from "lucide-react";

interface LinkType {
  id: string;
  url: string;
  title?: string;
  description?: string;
  preview_image_url?: string;
  created_at: string;
  created_by: string;
}

interface LinkListProps {
  groupId: string;
  refreshTrigger?: number;
}

export const LinkList: FC<LinkListProps> = ({ groupId, refreshTrigger }) => {
  const { user } = useUser();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLinks = async () => {
    if (!user?.token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = apiConfig.links.list(groupId);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch links";
        try {
          const errorData = await response.json();
          errorMessage =
            (errorData as { error?: string }).error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      setLinks((data as { links: LinkType[] }).links || []);
    } catch (err) {
      console.error("Error fetching links:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [groupId, user?.token, refreshTrigger]);

  const handleDelete = async (linkId: string) => {
    if (!user?.token) return;

    if (!confirm("Are you sure you want to delete this link?")) {
      return;
    }

    setDeletingId(linkId);

    try {
      const response = await fetch(apiConfig.links.delete(groupId, linkId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete link";
        try {
          const errorData = await response.json();
          errorMessage =
            (errorData as { error?: string }).error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        alert(errorMessage);
        return;
      }

      // Remove link from list
      setLinks(links.filter((l) => l.id !== linkId));
    } catch (err) {
      console.error("Error deleting link:", err);
      alert("Failed to delete link");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-foreground" />
        <span className="ml-2 text-foreground">Loading links...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 dark:text-red-400">
        <p>{error}</p>
        <Button onClick={fetchLinks} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <LinkIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No links found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <div
          key={link.id}
          className="flex items-start justify-between p-3 border border-border rounded-lg bg-background hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <LinkIcon className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0 flex-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground hover:underline truncate flex items-center gap-1"
              >
                {link.title || link.url}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              {link.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {link.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(link.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(link.id)}
            disabled={deletingId === link.id}
            className="h-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 shrink-0"
          >
            {deletingId === link.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};
