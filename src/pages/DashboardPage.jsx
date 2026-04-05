import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createBoard,
  fetchBoards,
  fetchWorkspaces,
  recordBoardView,
  toggleStar,
} from "../api/boardsApi";
import { useAuth } from "../context/AuthContext";
import { BoardCard } from "../components/BoardCard";
import { CreateBoardModal } from "../components/CreateBoardModal";
import { initialsFromName } from "../utils/initials";

const JIRA_BANNER_KEY = "trello_jira_banner_dismissed";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createWorkspaceId, setCreateWorkspaceId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [jiraOpen, setJiraOpen] = useState(
    () => sessionStorage.getItem(JIRA_BANNER_KEY) !== "1"
  );
  const [openWs, setOpenWs] = useState({});

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [b, w] = await Promise.all([fetchBoards(), fetchWorkspaces()]);
      setBoards(b);
      setWorkspaces(w);
    } catch (e) {
      if (e?.response?.status === 401) {
        logout();
        navigate("/", { replace: true });
        return;
      }
      setError(
        e?.response?.data?.error ||
          e?.message ||
          "Không tải được dữ liệu. Hãy chạy API server."
      );
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const boardsByWorkspace = useMemo(() => {
    const map = new Map();
    for (const w of workspaces) {
      map.set(w._id, []);
    }
    for (const b of boards) {
      const list = map.get(b.workspace_id);
      if (list) list.push(b);
    }
    return map;
  }, [boards, workspaces]);

  const recentBoards = useMemo(() => {
    return [...boards]
      .sort((a, b) => {
        const tb = new Date(b.last_viewed_at || b.updated_at || 0);
        const ta = new Date(a.last_viewed_at || a.updated_at || 0);
        return tb - ta;
      })
      .slice(0, 3);
  }, [boards]);

  const starredBoards = useMemo(() => boards.filter((b) => b.starred), [boards]);

  function dismissJira() {
    sessionStorage.setItem(JIRA_BANNER_KEY, "1");
    setJiraOpen(false);
  }

  async function handleToggleStar(id) {
    try {
      const updated = await toggleStar(id);
      setBoards((prev) =>
        prev.map((b) => (b._id === id ? { ...b, ...updated } : b))
      );
    } catch (e) {
      setError(e?.message || "Không đổi được trạng thái sao");
    }
  }

  async function handleCreate(payload) {
    setSaving(true);
    setError(null);
    try {
      const created = await createBoard({
        ...payload,
        workspace_id: createWorkspaceId || undefined,
      });
      setBoards((prev) => [...prev, created]);
      return created;
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Tạo bảng thất bại");
      throw e;
    } finally {
      setSaving(false);
    }
  }

  function openCreate(wsId) {
    setCreateWorkspaceId(wsId);
    setModalOpen(true);
  }

  async function handleOpenBoard(board) {
    try {
      await recordBoardView(board._id);
      await load();
    } catch {
      /* ghi view không bắt buộc để mở bảng */
    }
    window.alert(`Mở bảng: "${board.title || board.name}"`);
  }

  const initials = initialsFromName(user?.full_name);

  return (
    <div className="min-h-screen bg-[#1d2125] text-[#b6c2cf]">
      <DarkTopBar
        initials={initials}
        onCreate={() => {
          const first = workspaces[0]?._id || null;
          openCreate(first);
        }}
        onLogout={() => {
          logout();
          navigate("/", { replace: true });
        }}
      />

      <div className="flex min-h-[calc(100vh-48px)]">
        <DarkSidebar workspaces={workspaces} openWs={openWs} setOpenWs={setOpenWs} />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10">
          {error && (
            <div
              className="mb-4 rounded-[3px] border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
              <button
                type="button"
                onClick={load}
                className="ml-3 font-semibold text-[#579dff] underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {jiraOpen && <JiraPromoBanner onClose={dismissJira} />}

          {loading ? (
            <p className="text-sm text-[#9fadbc]">Đang tải bảng…</p>
          ) : (
            <>
              {starredBoards.length > 0 && (
                <section className="mb-8">
                  <div className="mb-3 flex items-center gap-2 text-[#9fadbc]">
                    <StarIcon />
                    <h2 className="text-sm font-semibold text-[#b6c2cf]">
                      Bảng đã gắn sao
                    </h2>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                    {starredBoards.map((b) => (
                      <BoardCard
                        key={b._id}
                        board={b}
                        onToggleStar={handleToggleStar}
                        onOpen={handleOpenBoard}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="mb-10">
                <div className="mb-3 flex items-center gap-2 text-[#9fadbc]">
                  <ClockIcon />
                  <h2 className="text-sm font-semibold text-[#b6c2cf]">
                    Đã xem gần đây
                  </h2>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                  {recentBoards.map((b) => (
                    <BoardCard
                      key={b._id}
                      board={b}
                      onToggleStar={handleToggleStar}
                      onOpen={handleOpenBoard}
                    />
                  ))}
                </div>
              </section>

              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#9fadbc]">
                Các không gian làm việc của bạn
              </div>

              {workspaces.map((ws, idx) => {
                const list = boardsByWorkspace.get(ws._id) || [];
                const isFirst = idx === 0;
                return (
                  <WorkspaceBoardSection
                    key={ws._id}
                    workspace={ws}
                    boards={list}
                    showUpgrade={!isFirst}
                    onCreateBoard={() => openCreate(ws._id)}
                    onToggleStar={handleToggleStar}
                    onOpenBoard={handleOpenBoard}
                  />
                );
              })}

              <section className="mt-10 border-t border-[#38414a] pt-8">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#9fadbc]">
                  Các không gian làm việc khách
                </div>
                <div className="flex items-center gap-3 rounded-[3px] bg-[#22272b] px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0c66e4] text-xs font-bold text-white">
                    T
                  </div>
                  <span className="text-sm font-medium text-[#b6c2cf]">
                    T2502E-Assignment-NodeJS-Team03
                  </span>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <CreateBoardModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCreateWorkspaceId(null);
        }}
        onCreate={handleCreate}
        busy={saving}
        variant="dark"
      />
    </div>
  );
}

function DarkTopBar({ initials, onCreate, onLogout }) {
  return (
    <header className="flex h-12 items-center gap-2 border-b border-[#38414a] bg-[#22272b] px-3 text-white sm:gap-3 sm:px-4">
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] hover:bg-[#ffffff14]"
        aria-label="Ứng dụng"
      >
        <GridIcon />
      </button>
      <div className="flex shrink-0 items-center gap-1 font-bold tracking-tight">
        <TrelloMark />
        <span className="hidden text-[18px] sm:inline">Nhóm 3</span>
      </div>
      <button
        type="button"
        className="hidden rounded-[3px] px-2 py-1.5 text-sm font-medium hover:bg-[#ffffff14] md:block"
      >
        Không gian làm việc <ChevronDown />
      </button>
      <button
        type="button"
        className="hidden rounded-[3px] px-2 py-1.5 text-sm font-medium hover:bg-[#ffffff14] lg:block"
      >
        Gần đây <ChevronDown />
      </button>
      <button
        type="button"
        className="hidden rounded-[3px] px-2 py-1.5 text-sm font-medium hover:bg-[#ffffff14] xl:block">
        Đã gắn sao <ChevronDown />
      </button>

      <div className="mx-2 hidden min-w-[120px] max-w-md flex-1 sm:mx-4 md:block">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9fadbc]">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Tìm kiếm"
            className="w-full rounded-[3px] border-0 bg-[#1d2125] py-1.5 pl-9 pr-3 text-sm text-[#b6c2cf] placeholder:text-[#738496] focus:bg-[#22272b] focus:outline-none focus:ring-2 focus:ring-[#579dff]/50"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onCreate}
          className="hidden rounded-[3px] bg-[#0c66e4] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0055cc] sm:block"
        >
          Tạo mới
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="flex h-8 w-8 items-center justify-center rounded-[3px] hover:bg-[#ffffff14] sm:hidden"
          aria-label="Tạo mới"
        >
          <PlusIcon />
        </button>
        <button
          type="button"
          className="hidden h-8 w-8 items-center justify-center rounded-[3px] hover:bg-[#ffffff14] md:flex"
          aria-label="Thông báo"
        >
          <MegaphoneIcon />
        </button>
        <button
          type="button"
          className="relative hidden h-8 w-8 items-center justify-center rounded-[3px] hover:bg-[#ffffff14] sm:flex"
          aria-label="Chuông"
        >
          <BellIcon />
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f15b50] px-0.5 text-[10px] font-bold leading-none text-white">
            7
          </span>
        </button>
        <button
          type="button"
          className="hidden h-8 w-8 items-center justify-center rounded-[3px] hover:bg-[#ffffff14] sm:flex"
          aria-label="Trợ giúp"
        >
          <HelpIcon />
        </button>
        <div
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#e34935] text-xs font-bold text-white"
          title={initials}
        >
          {initials}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="ml-1 rounded-[3px] px-2 py-1 text-xs font-medium text-[#9fadbc] hover:bg-[#ffffff14] hover:text-white"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

function DarkSidebar({ workspaces, openWs, setOpenWs }) {
  function toggle(id) {
    setOpenWs((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  useEffect(() => {
    if (!workspaces.length) return;
    setOpenWs((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next = {};
      workspaces.forEach((w, i) => {
        next[w._id] = i === 0;
      });
      return next;
    });
  }, [workspaces, setOpenWs]);

  return (
    <aside className="hidden w-[272px] shrink-0 flex-col border-r border-[#38414a] bg-[#22272b] lg:flex">
      <nav className="p-2 text-sm">
        <SidebarNavItem active icon={<BoardsIcon />} label="Bảng" />
        <SidebarNavItem icon={<TemplatesIcon />} label="Mẫu" />
        <SidebarNavItem icon={<HomeIcon />} label="Trang chủ" />
      </nav>

      <div className="mx-2 border-t border-[#38414a]" />

      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#9fadbc]">
        Các Không gian làm việc
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {workspaces.map((ws, i) => {
          const expanded = openWs[ws._id] !== false;
          const color =
            i === 0
              ? "from-[#8f5de4] to-[#5e4db2]"
              : "from-[#e774bb] to-[#f87462]";
          return (
            <div key={ws._id} className="mb-1">
              <button
                type="button"
                onClick={() => toggle(ws._id)}
                className="flex w-full items-center gap-2 rounded-[3px] px-2 py-2 text-left hover:bg-[#ffffff0d]"
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] bg-gradient-to-br text-[10px] font-bold text-white ${color}`}
                >
                  {ws.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#b6c2cf]">
                  {ws.name}
                </span>
                <ChevronDown
                  className={`shrink-0 text-[#9fadbc] transition ${expanded ? "rotate-180" : ""}`}
                />
              </button>
              {expanded && (
                <div className="ml-2 border-l border-[#38414a] pl-2 pb-2">
                  <SidebarSubLink label="Bảng" />
                  <SidebarSubLink label="Thành viên" plus />
                  <SidebarSubLink label="Cài đặt" />
                  {i === 0 && <SidebarSubLink label="Thanh toán" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-[#38414a] p-3">
        <div className="rounded-lg border border-[#38414a] bg-[#1d2125] p-3">
          <div className="flex gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#8f5de4] to-[#0c66e4]">
              <BriefcaseIcon />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#b6c2cf]">Nhóm 3 Premium</div>
              <p className="mt-0.5 text-xs leading-snug text-[#9fadbc]">
                Nâng cao quyền hạn, quản lý an toàn hơn.
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[#579dff] hover:underline"
              >
                Bắt đầu dùng thử miễn phí
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function WorkspaceBoardSection({
  workspace,
  boards,
  showUpgrade,
  onCreateBoard,
  onToggleStar,
  onOpenBoard,
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-gradient-to-br from-[#8f5de4] to-[#5e4db2] text-[11px] font-bold text-white">
            {workspace.name.slice(0, 1).toUpperCase()}
          </div>
          <h3 className="text-base font-semibold text-[#b6c2cf]">{workspace.name}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button type="button" className="font-medium text-[#9fadbc] hover:text-[#b6c2cf]">
            Bảng
          </button>
          <button type="button" className="font-medium text-[#9fadbc] hover:text-[#b6c2cf]">
            Thành viên
          </button>
          <button type="button" className="font-medium text-[#9fadbc] hover:text-[#b6c2cf]">
            Cài đặt
          </button>
          {showUpgrade && (
            <button
              type="button"
              className="rounded-[3px] bg-[#8f5de4] px-3 py-1 text-xs font-semibold text-white hover:brightness-110"
            >
              Nâng cấp
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {boards.map((b) => (
          <BoardCard
            key={b._id}
            board={b}
            onToggleStar={onToggleStar}
            onOpen={onOpenBoard}
          />
        ))}
        <button
          type="button"
          onClick={onCreateBoard}
          className="flex min-h-[96px] w-full flex-col items-center justify-center rounded-[3px] bg-[#2c333a] px-2 text-center text-[#9fadbc] transition hover:bg-[#38414a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#579dff]"
        >
          <span className="text-2xl font-light leading-none text-[#9fadbc]">+</span>
          <span className="mt-1 text-sm font-medium text-[#b6c2cf]">Tạo bảng mới</span>
          {showUpgrade && (
            <span className="mt-0.5 text-xs text-[#738496]">8 còn lại</span>
          )}
        </button>
      </div>
    </section>
  );
}

function JiraPromoBanner({ onClose }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-lg border border-[#38414a] bg-[#1a1f26]">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-[3px] text-[#9fadbc] hover:bg-white/10"
        aria-label="Đóng"
      >
        ×
      </button>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0c66e4] text-lg font-black text-white">
            J
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Jira</h2>
            <p className="mt-1 max-w-xl text-xs text-[#9fadbc]">
              Kết nối quy trình Agile và theo dõi công việc trực quan hơn.
            </p>
            <button
              type="button"
              className="mt-2 rounded-[3px] bg-[#0c66e4] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0055cc]"
            >
              Dùng thử miễn phí
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            "Quản lý Dự án",
            "Scrum",
            "Theo dõi Lỗi",
            "Quy trình Thiết kế Web",
          ].map((t) => (
            <div
              key={t}
              className="rounded-md bg-gradient-to-br from-[#0c66e4] to-[#09326c] px-2 py-3 text-center text-[11px] font-semibold leading-tight text-white shadow-inner"
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarNavItem({ label, icon, active }) {
  return (
    <button
      type="button"
      className={`mb-0.5 flex w-full items-center gap-3 rounded-[3px] px-3 py-2 text-left font-medium ${
        active
          ? "bg-[#ffffff14] text-[#579dff]"
          : "text-[#b6c2cf] hover:bg-[#ffffff0d]"
      }`}
    >
      <span className="text-[#9fadbc]">{icon}</span>
      {label}
    </button>
  );
}

function SidebarSubLink({ label, plus }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-[3px] px-2 py-1.5 text-left text-sm text-[#9fadbc] hover:bg-[#ffffff0d] hover:text-[#b6c2cf]"
    >
      {label}
      {plus && <span className="text-[#738496]">+</span>}
    </button>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  );
}

function TrelloMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="8" height="18" rx="1.5" fill="white" />
      <rect x="13" y="3" width="8" height="11" rx="1.5" fill="white" opacity="0.85" />
    </svg>
  );
}

function ChevronDown({ className }) {
  return (
    <svg
      className={className || "inline-block"}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 10v4c0 .55.45 1 1 1h3l5 4V5L7 9H4c-.55 0-1 .45-1 1zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function BoardsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9 3h7v4h-7v-4z" />
    </svg>
  );
}

function TemplatesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
