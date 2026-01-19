// API Configuration
// In production (App Platform), frontend and backend share the same domain, so use relative URLs
// In development, use localhost:8080
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isProduction =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

const API_BASE_URL =
  // If explicitly set (even if empty string), use it
  VITE_API_BASE_URL !== undefined && VITE_API_BASE_URL !== null
    ? VITE_API_BASE_URL
    : // If in production (not localhost), use relative URLs (empty string)
    isProduction
    ? ""
    : // Default for local development
      "http://localhost:8080";
const API_AUTH_URL = import.meta.env.VITE_API_AUTH_URL || "/api/auth";
const API_GROUP_URL = import.meta.env.VITE_API_GROUP_URL || "/api/groups";

export const apiConfig = {
  baseURL: API_BASE_URL,
  auth: {
    base: `${API_BASE_URL}${API_AUTH_URL}`,
    login: `${API_BASE_URL}${API_AUTH_URL}/login`,
    register: `${API_BASE_URL}${API_AUTH_URL}/register`,
  },
  groups: {
    base: `${API_BASE_URL}${API_GROUP_URL}`,
    list: `${API_BASE_URL}${API_GROUP_URL}`,
    create: `${API_BASE_URL}${API_GROUP_URL}`,
    byId: (groupId: string) => `${API_BASE_URL}${API_GROUP_URL}/${groupId}`,
    members: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/members`,
    tasks: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/tasks`,
    taskById: (groupId: string, taskId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/tasks/${taskId}`,
  },
  users: {
    me: `${API_BASE_URL}/api/users/me`,
    fromMyGroups: `${API_BASE_URL}/api/users/from-my-groups`,
  },
  tasks: {
    user: `${API_BASE_URL}/api/tasks/user`,
  },
  invitations: {
    list: `${API_BASE_URL}/api/invitations`,
    accept: (invitationId: string) =>
      `${API_BASE_URL}/api/invitations/${invitationId}/accept`,
    decline: (invitationId: string) =>
      `${API_BASE_URL}/api/invitations/${invitationId}/decline`,
  },
  websocket: {
    createRoom: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/ws/createRoom`,
    joinRoom: (groupId: string, roomId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/ws/joinRoom/${roomId}`,
    getRooms: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/ws/rooms`,
    getClients: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/ws/rooms/clients`,
    roomMessages: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/ws/rooms/${groupId}/messages`,
    userRoomMessages: (groupId: string, userId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/ws/rooms/${groupId}/messages/${userId}`,
    deleteMessage: (groupId: string, messageId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/ws/messages/${messageId}`,
  },
  signaling: {
    ws: (groupId: string, roomId?: string) => {
      // Use groupId as roomId if roomId not provided (they're the same in our case)
      const finalRoomId = roomId || groupId;
      // If API_BASE_URL is empty (relative URLs), use current origin with wss/ws protocol
      if (!API_BASE_URL || API_BASE_URL === "") {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        return `${protocol}://${window.location.host}/api/groups/${groupId}/ws/signaling/${finalRoomId}`;
      }
      // For absolute URLs (local dev)
      const protocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
      const host = API_BASE_URL.replace(/^https?:\/\//, "");
      return `${protocol}://${host}/api/groups/${groupId}/ws/signaling/${finalRoomId}`;
    },
  },
  files: {
    upload: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/files`,
    list: (groupId: string, folderId?: string) => {
      const base = `${API_BASE_URL}${API_GROUP_URL}/${groupId}/files`;
      return folderId ? `${base}?folder_id=${folderId}` : base;
    },
    info: (groupId: string, fileId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/files/${fileId}`,
    download: (groupId: string, fileId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/files/${fileId}/download`,
    delete: (groupId: string, fileId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/files/${fileId}`,
  },
  folders: {
    create: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/folders`,
    list: (groupId: string, parentId?: string) => {
      const base = `${API_BASE_URL}${API_GROUP_URL}/${groupId}/folders`;
      return parentId ? `${base}?parent_id=${parentId}` : base;
    },
    get: (groupId: string, folderId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/folders/${folderId}`,
    delete: (groupId: string, folderId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/folders/${folderId}`,
  },
  links: {
    create: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/links`,
    list: (groupId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/links`,
    get: (groupId: string, linkId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/links/${linkId}`,
    delete: (groupId: string, linkId: string) =>
      `${API_BASE_URL}${API_GROUP_URL}/${groupId}/links/${linkId}`,
  },
  notifications: {
    list: `${API_BASE_URL}/api/notifications`,
    update: (id: string) => `${API_BASE_URL}/api/notifications/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/notifications/${id}`,
  },
};
