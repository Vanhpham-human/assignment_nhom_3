const { listWorkspacesForUser } = require("../services/workspaceService");

async function list(req, res) {
  try {
    const rows = await listWorkspacesForUser(req.userId);
    res.json(rows.map((w) => ({ _id: w._id, name: w.name, slug: w.slug })));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

module.exports = { list };
