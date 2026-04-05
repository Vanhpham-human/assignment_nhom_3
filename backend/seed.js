const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Workspace = require("./models/Workspace");
const WorkspaceMember = require("./models/WorkspaceMember");
const Board = require("./models/Board");
const BoardMember = require("./models/BoardMember");
const BoardList = require("./models/BoardList");
const Card = require("./models/Card");
const Label = require("./models/Label");
const CardLabel = require("./models/CardLabel");
const Checklist = require("./models/Checklist");
const ChecklistItem = require("./models/ChecklistItem");
const Activity = require("./models/Activity");
const UserBoardStar = require("./models/UserBoardStar");
const UserBoardRecent = require("./models/UserBoardRecent");

async function seedIfEmpty() {
  if ((await User.countDocuments()) > 0) return;

  const password_hash = await bcrypt.hash("Demo123!", 10);
  const user = await User.create({
    email: "demo@example.com",
    password_hash,
    full_name: "Văn Phạm",
    status: "active",
    email_verified: true,
  });

  const workspace = await Workspace.create({
    name: "Nhóm 3 — Không gian làm việc",
    slug: "nhom3-khong-gian-lam-viec",
    description: "Không gian chính (seed)",
    owner_id: user._id,
    visibility: "private",
  });

  await WorkspaceMember.create({
    workspace_id: workspace._id,
    user_id: user._id,
    role: "owner",
    status: "active",
    joined_at: new Date(),
  });

  const workspace2 = await Workspace.create({
    name: "Workspace Nhóm 3",
    slug: "nhom3-workspace",
    owner_id: user._id,
    visibility: "private",
  });

  await WorkspaceMember.create({
    workspace_id: workspace2._id,
    user_id: user._id,
    role: "owner",
    status: "active",
    joined_at: new Date(),
  });

  const boardSeeds = [
    { name: "Thông tin của nhóm", theme: "gradient-slate", is_starred: false },
    { name: "eproject", theme: "gradient-sunset", is_starred: false },
    { name: "Bảng Nhóm 3", theme: "gradient-purple", is_starred: true },
    { name: "Kế hoạch dự án", theme: "gradient-blue", is_starred: true },
  ];

  const boards = [];
  for (const s of boardSeeds) {
    const board = await Board.create({
      workspace_id: workspace._id,
      name: s.name,
      visibility: "workspace",
      created_by: user._id,
      cover_url: `theme:${s.theme}`,
      is_starred: s.is_starred,
    });
    boards.push(board);
    await BoardMember.create({
      board_id: board._id,
      user_id: user._id,
      role: "admin",
    });
    await Activity.create({
      workspace_id: workspace._id,
      board_id: board._id,
      actor_id: user._id,
      entity_type: "board",
      action: "board.created",
      new_data: JSON.stringify({ name: board.name }),
    });
  }

  for (const b of boards) {
    if (b.is_starred) {
      await UserBoardStar.create({ user_id: user._id, board_id: b._id });
    }
  }
  const forRecent = boards.slice(0, 3);
  for (let i = 0; i < forRecent.length; i += 1) {
    const t = new Date(Date.now() - (forRecent.length - i) * 60_000);
    await UserBoardRecent.create({
      user_id: user._id,
      board_id: forRecent[i]._id,
      last_viewed_at: t,
    });
  }

  const primary = boards[0];
  const listDefs = [
    { name: "To Do", position: 0 },
    { name: "Doing", position: 1 },
    { name: "Done", position: 2 },
  ];
  const lists = [];
  for (const l of listDefs) {
    lists.push(
      await BoardList.create({
        board_id: primary._id,
        name: l.name,
        position: l.position,
        created_by: user._id,
      })
    );
  }

  const card = await Card.create({
    board_id: primary._id,
    list_id: lists[0]._id,
    title: "Welcome card",
    description: "Sample card matching the DB schema (cards.list_id → board_lists).",
    position: 0,
    priority: "medium",
    created_by: user._id,
  });

  const label = await Label.create({
    board_id: primary._id,
    name: "Sample",
    color: "green",
  });
  await CardLabel.create({
    card_id: card._id,
    label_id: label._id,
  });

  const checklist = await Checklist.create({
    card_id: card._id,
    title: "Kickoff",
    position: 0,
    created_by: user._id,
  });
  await ChecklistItem.create({
    checklist_id: checklist._id,
    content: "Review schema in MongoDB Compass",
    position: 0,
    is_completed: false,
  });

  console.log(
    "Seeded demo user (demo@example.com / Demo123!), 2 workspaces, boards, lists, card."
  );
}

module.exports = { seedIfEmpty };
