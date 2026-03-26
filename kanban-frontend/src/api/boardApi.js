import api from "./axios";

export const authApi = {
  register: (userData) => api.post("auth/register/", userData),
  login: (credentials) => api.post("auth/login/", credentials),
  getMe: () => api.get("auth/me/"),
};

export const boardApi = {
  // Boards
  getBoards: () => api.get("boards/"),
  getBoard: (id) => api.get(`boards/${id}/`),
  createBoard: (data) => api.post("boards/", data),
  deleteBoard: (id) => api.delete(`boards/${id}/`),

  // Members
  getBoardMembers: (id) => api.get(`boards/${id}/members/`),
  inviteMember: (id, data) => api.post(`boards/${id}/invite/`, data),
  leaveBoard: (id) => api.post(`boards/${id}/leave/`),
  updateMemberRole: (boardId, memberId, role) =>
    api.patch(`boards/${boardId}/members/${memberId}/role/`, { role }),
  removeMember: (boardId, memberId) =>
    api.delete(`boards/${boardId}/members/${memberId}/`),

  // Lists
  createList: (data) => api.post("boards/lists/", data),
  updateList: (id, data) => api.patch(`boards/lists/${id}/`, data),
  moveList: (id, position) =>
    api.patch(`boards/lists/${id}/move/`, { position }),

  // Tasks
  createTask: (data) => api.post("boards/tasks/", data),
  updateTask: (id, data) => api.patch(`boards/tasks/${id}/`, data),
  moveTask: (id, list_id, position) =>
    api.patch(`boards/tasks/${id}/move/`, { list_id, position }),
  deleteTask: (id) => api.delete(`boards/tasks/${id}/`),
};