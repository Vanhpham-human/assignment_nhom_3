function userPublic(u) {
  return {
    id: u._id,
    email: u.email,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
  };
}

module.exports = { userPublic };
