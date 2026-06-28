// ─── Shared Boards ────────────────────────────────────────
// Lightweight kanban for team collaboration: boards → columns → cards. Cards can
// carry a colored label and an assignee. localStorage-backed with a seed.

export interface BoardCard { id: string; title: string; label?: string; assignee?: string }
export interface BoardColumn { id: string; title: string; cards: BoardCard[] }
export interface Board { id: string; name: string; columns: BoardColumn[] }

export const LABELS: Record<string, string> = {
  Urgent: "#dc2626", Marketing: "#a855f7", Ops: "#0891b2", Sales: "#16a34a", Office: "#f59e0b", Field: "#2563eb",
};

const KEY = "routiqa-team-boards";
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

function seed(): Board[] {
  return [
    {
      id: "b-ops", name: "Office Ops",
      columns: [
        { id: "c1", title: "To do", cards: [
          { id: "k1", title: "Order new uniforms", label: "Office", assignee: "Dana" },
          { id: "k2", title: "Renew vehicle insurance", label: "Urgent", assignee: "Sam" },
          { id: "k3", title: "Update on-call schedule", label: "Field" },
        ] },
        { id: "c2", title: "In progress", cards: [
          { id: "k4", title: "Migrate phone system", label: "Ops", assignee: "Marcus" },
          { id: "k5", title: "Q2 hiring — 2 techs", label: "Field", assignee: "Priya" },
        ] },
        { id: "c3", title: "Review", cards: [
          { id: "k6", title: "New pricebook draft", label: "Sales", assignee: "Tucker" },
        ] },
        { id: "c4", title: "Done", cards: [
          { id: "k7", title: "Switch to Routiqa dispatch", label: "Ops" },
        ] },
      ],
    },
    {
      id: "b-mktg", name: "Q2 Marketing Push",
      columns: [
        { id: "m1", title: "Ideas", cards: [
          { id: "n1", title: "Spring tune-up promo", label: "Marketing" },
          { id: "n2", title: "Referral bonus relaunch", label: "Marketing", assignee: "Dana" },
        ] },
        { id: "m2", title: "Building", cards: [
          { id: "n3", title: "Review request automation", label: "Marketing", assignee: "Sam" },
        ] },
        { id: "m3", title: "Live", cards: [
          { id: "n4", title: "Google LSA budget bump", label: "Sales" },
        ] },
      ],
    },
  ];
}

let cache: Board[] | null = null;
function load(): Board[] {
  if (cache) return cache;
  if (typeof window === "undefined") return seed();
  try { const raw = localStorage.getItem(KEY); cache = raw ? JSON.parse(raw) : seed(); }
  catch { cache = seed(); }
  return cache!;
}
function persist() { if (typeof window !== "undefined") try { localStorage.setItem(KEY, JSON.stringify(cache ?? [])); } catch { /* quota */ } }
function commit(next: Board[]) { cache = next; persist(); }

export function getBoards(): Board[] { return load(); }

export function addCard(boardId: string, colId: string, title: string, label?: string) {
  commit(load().map(b => b.id !== boardId ? b : { ...b, columns: b.columns.map(c => c.id !== colId ? c : { ...c, cards: [...c.cards, { id: uid("k"), title: title.trim(), label }] }) }));
}
export function deleteCard(boardId: string, cardId: string) {
  commit(load().map(b => b.id !== boardId ? b : { ...b, columns: b.columns.map(c => ({ ...c, cards: c.cards.filter(k => k.id !== cardId) })) }));
}
// Move a card to an adjacent column (dir -1 left / +1 right).
export function moveCard(boardId: string, cardId: string, dir: number) {
  commit(load().map(b => {
    if (b.id !== boardId) return b;
    const ci = b.columns.findIndex(c => c.cards.some(k => k.id === cardId));
    const ti = ci + dir;
    if (ci < 0 || ti < 0 || ti >= b.columns.length) return b;
    const card = b.columns[ci].cards.find(k => k.id === cardId)!;
    const columns = b.columns.map((c, i) =>
      i === ci ? { ...c, cards: c.cards.filter(k => k.id !== cardId) } :
      i === ti ? { ...c, cards: [...c.cards, card] } : c);
    return { ...b, columns };
  }));
}
export function addColumn(boardId: string, title: string) {
  commit(load().map(b => b.id !== boardId ? b : { ...b, columns: [...b.columns, { id: uid("c"), title: title.trim(), cards: [] }] }));
}
export function addBoard(name: string): Board {
  const board: Board = { id: uid("b"), name: name.trim(), columns: [{ id: uid("c"), title: "To do", cards: [] }, { id: uid("c"), title: "In progress", cards: [] }, { id: uid("c"), title: "Done", cards: [] }] };
  commit([...load(), board]); return board;
}
