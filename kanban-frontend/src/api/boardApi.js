import api from "./axios";

export const authApi = {
  register: (userData) => api.post("auth/register/", userData),
  login: (credentials) => api.post("auth/login/", credentials),
  getMe: () => api.get("auth/me/"),
  updateMe: (data) => api.patch("auth/me/", data),
  changePassword: (data) => api.post("auth/change-password/", data),
};

export const boardApi = {
  // Boards
  getBoards: () => api.get("boards/"),
  getBoard: (id) => api.get(`boards/${id}/`),
  createBoard: (data) => api.post("boards/", data),
  updateBoard: (id, data) => api.patch(`boards/${id}/`, data),
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
  createList: (data) => api.post("lists/", data),
  updateList: (id, data) => api.patch(`lists/${id}/`, data),
  moveList: (id, position) =>
    api.patch(`lists/${id}/move/`, { position }),
  deleteList: (id) => api.delete(`lists/${id}/`),

  // Tasks
  createTask: (data) => api.post("tasks/", data),
  getTask: (id) => api.get(`tasks/${id}/`),
  updateTask: (id, data) => api.patch(`tasks/${id}/`, data),
  moveTask: (id, list_id, position) =>
    api.patch(`tasks/${id}/move/`, { list_id, position }),
  deleteTask: (id) => api.delete(`tasks/${id}/`),

  // Task collaboration
  getTaskComments: (id) => api.get(`tasks/${id}/comments/`),
  addTaskComment: (id, data) => api.post(`tasks/${id}/comments/`, data),
  deleteTaskComment: (taskId, commentId) => api.delete(`tasks/${taskId}/comments/${commentId}/`),
  getTaskChecklist: (id) => api.get(`tasks/${id}/checklist/`),
  addChecklistItem: (id, data) => api.post(`tasks/${id}/checklist/`, data),
  updateChecklistItem: (taskId, itemId, data) => api.patch(`tasks/${taskId}/checklist/${itemId}/`, data),
  deleteChecklistItem: (taskId, itemId) => api.delete(`tasks/${taskId}/checklist/${itemId}/`),
  getTaskAttachments: (id) => api.get(`tasks/${id}/attachments/`),
  addTaskAttachment: (id, formData) =>
    api.post(`tasks/${id}/attachments/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteTaskAttachment: (taskId, attachmentId) => api.delete(`tasks/${taskId}/attachments/${attachmentId}/`),
  getTaskActivity: (id) => api.get(`tasks/${id}/activity/`),
};
