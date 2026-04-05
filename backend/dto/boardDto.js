function themeFromCoverUrl(cover_url) {
  if (cover_url && typeof cover_url === "string" && cover_url.startsWith("theme:")) {
    return cover_url.slice("theme:".length) || "gradient-blue";
  }
  return "gradient-blue";
}

function boardToListItem(boardDoc, workspaceName, opts = {}) {
  const b = boardDoc.toObject ? boardDoc.toObject() : boardDoc;
  const starred =
    typeof opts.starred === "boolean" ? opts.starred : Boolean(b.is_starred);
  const last_viewed_at = opts.last_viewed_at ?? undefined;
  const out = {
    _id: b._id,
    title: b.name,
    name: b.name,
    starred,
    background: themeFromCoverUrl(b.cover_url),
    cover_url: b.cover_url,
    workspace: workspaceName,
    workspace_id: b.workspace_id,
    updated_at: b.updated_at,
  };
  if (last_viewed_at) out.last_viewed_at = last_viewed_at;
  return out;
}

function coverUrlFromTheme(theme) {
  if (!theme || typeof theme !== "string") return "theme:gradient-blue";
  return `theme:${theme}`;
}

module.exports = { boardToListItem, themeFromCoverUrl, coverUrlFromTheme };
