import { api } from "./client";

export async function fetchBoards() {
  const { data } = await api.get("/boards");
  return data;
}

export async function fetchWorkspaces() {
  const { data } = await api.get("/workspaces");
  return data;
}

export async function createBoard(payload) {
  const { data } = await api.post("/boards", payload);
  return data;
}

export async function toggleStar(id) {
  const { data } = await api.patch(`/boards/${id}/star`);
  return data;
}

export async function recordBoardView(id) {
  const { data } = await api.post(`/boards/${id}/view`);
  return data;
}

export async function deleteBoard(id) {
  await api.delete(`/boards/${id}`);
}
