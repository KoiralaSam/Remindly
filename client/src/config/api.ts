// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
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
      const protocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
      const host = API_BASE_URL.replace(/^https?:\/\//, "");
      // Use groupId as roomId if roomId not provided (they're the same in our case)
      const finalRoomId = roomId || groupId;
      return `${protocol}://${host}/api/groups/${groupId}/ws/signaling/${finalRoomId}`;
    },
  },
};
