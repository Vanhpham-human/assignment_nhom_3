const WorkspaceMember = require("../models/WorkspaceMember");
const Workspace = require("../models/Workspace");

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

module.exports = {
  getWorkspaceIdsForUser,
  resolveWorkspace,
  listWorkspacesForUser,
};
