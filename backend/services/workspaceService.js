const { randomUUID } = require("crypto");
const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceIdsForUser(userId) {
  const members = await WorkspaceMember.find({
    user_id: userId,
    status: "active",
    removed_at: null,
  }).sort({ created_at: 1 });
  return [...new Set(members.map((m) => m.workspace_id))];
}

async function resolveWorkspace(userId, workspaceIdOptional) {
  const ids = await getWorkspaceIdsForUser(userId);
  if (ids.length === 0) return null;
  if (workspaceIdOptional && ids.includes(workspaceIdOptional)) {
    return Workspace.findOne({ _id: workspaceIdOptional, deleted_at: null });
  }
  const firstId = ids[0];
  return Workspace.findOne({ _id: firstId, deleted_at: null });
}

async function listWorkspacesForUser(userId) {
  const ids = await getWorkspaceIdsForUser(userId);
  if (ids.length === 0) return [];
  return Workspace.find({ _id: { $in: ids }, deleted_at: null }).sort({ created_at: 1 });
}

async function createWorkspaceForUser(user, { name, slugPrefix = "ws" } = {}) {
  const displayName = name || "Không gian làm việc";
  for (let i = 0; i < 24; i += 1) {
    const slug =
      i === 0
        ? `${slugPrefix}-${randomUUID().slice(0, 10)}`
        : `${slugPrefix}-${randomUUID().slice(0, 12)}`;
    const exists = await Workspace.findOne({ slug });
    if (exists) continue;
    const ws = await Workspace.create({
      name: displayName,
      slug,
      owner_id: user._id,
      visibility: "private",
    });
    await WorkspaceMember.create({
      workspace_id: ws._id,
      user_id: user._id,
      role: "owner",
      status: "active",
      joined_at: new Date(),
    });
    return ws;
  }
  throw new Error("Could not allocate workspace slug");
}

/** CRUD — đọc một workspace theo id (chỉ khi user là thành viên). */
async function getWorkspaceIfMember(userId, workspaceId) {
  const ids = await getWorkspaceIdsForUser(userId);
  if (!ids.includes(workspaceId)) return null;
  return Workspace.findOne({ _id: workspaceId, deleted_at: null });
}

module.exports = {
  getWorkspaceIdsForUser,
  resolveWorkspace,
  listWorkspacesForUser,
  createWorkspaceForUser,
  getWorkspaceIfMember,
};
