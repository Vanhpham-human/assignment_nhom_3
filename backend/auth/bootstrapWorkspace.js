const { randomUUID } = require("crypto");
const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");

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

module.exports = { createWorkspaceForUser };
