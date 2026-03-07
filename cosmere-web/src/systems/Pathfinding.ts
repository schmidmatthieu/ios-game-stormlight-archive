/**
 * A* Pathfinding system for isometric 2D grids.
 * Supports 8-directional movement with diagonal cost weighting.
 */

interface GridPos { col: number; row: number }

interface PathNode {
  col: number; row: number;
  g: number; h: number; f: number;
  parent: PathNode | null;
}

const SQRT2 = Math.SQRT2;
const DIRECTIONS: readonly { dc: number; dr: number; cost: number }[] = [
  { dc: 0, dr: -1, cost: 1 },      { dc: 1, dr: 0, cost: 1 },
  { dc: 0, dr: 1, cost: 1 },       { dc: -1, dr: 0, cost: 1 },
  { dc: 1, dr: -1, cost: SQRT2 },  { dc: 1, dr: 1, cost: SQRT2 },
  { dc: -1, dr: 1, cost: SQRT2 },  { dc: -1, dr: -1, cost: SQRT2 },
];

/** Min-heap priority queue keyed on PathNode.f */
class MinHeap {
  private items: PathNode[] = [];
  get size(): number { return this.items.length; }

  push(node: PathNode): void {
    this.items.push(node);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): PathNode | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(idx: number): void {
    const items = this.items;
    while (idx > 0) {
      const p = (idx - 1) >> 1;
      if (items[idx].f >= items[p].f) break;
      [items[idx], items[p]] = [items[p], items[idx]];
      idx = p;
    }
  }

  private sinkDown(idx: number): void {
    const items = this.items;
    const len = items.length;
    while (true) {
      let s = idx;
      const l = 2 * idx + 1;
      const r = 2 * idx + 2;
      if (l < len && items[l].f < items[s].f) s = l;
      if (r < len && items[r].f < items[s].f) s = r;
      if (s === idx) break;
      [items[idx], items[s]] = [items[s], items[idx]];
      idx = s;
    }
  }
}

function heuristic(col: number, row: number, gc: number, gr: number): number {
  const dx = Math.abs(col - gc);
  const dy = Math.abs(row - gr);
  return (dx + dy) + (SQRT2 - 2) * Math.min(dx, dy); // Octile distance
}

function keyFor(col: number, row: number): number {
  return row * 65536 + col;
}

function reconstructPath(node: PathNode): GridPos[] {
  const path: GridPos[] = [];
  let cur: PathNode | null = node;
  while (cur !== null) {
    path.push({ col: cur.col, row: cur.row });
    cur = cur.parent;
  }
  path.reverse();
  return path;
}

export class Pathfinder {
  private readonly width: number;
  private readonly height: number;
  private blocked: Set<number> = new Set();

  constructor(gridWidth: number, gridHeight: number) {
    this.width = gridWidth;
    this.height = gridHeight;
  }

  setBlocked(col: number, row: number, blocked: boolean): void {
    const key = keyFor(col, row);
    if (blocked) this.blocked.add(key);
    else this.blocked.delete(key);
  }

  /** Bulk-set blocked tiles from a Set of "col,row" strings. Replaces previous data. */
  setBlockedSet(blockedSet: Set<string>): void {
    this.blocked.clear();
    for (const entry of blockedSet) {
      const sep = entry.indexOf(",");
      const c = parseInt(entry.substring(0, sep), 10);
      const r = parseInt(entry.substring(sep + 1), 10);
      this.blocked.add(keyFor(c, r));
    }
  }

  isBlocked(col: number, row: number): boolean {
    return this.blocked.has(keyFor(col, row));
  }

  private inBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.width && row >= 0 && row < this.height;
  }

  findPath(
    startCol: number, startRow: number,
    goalCol: number, goalRow: number,
    maxNodes: number = 500,
  ): GridPos[] | null {
    if (!this.inBounds(startCol, startRow) || !this.inBounds(goalCol, goalRow)) return null;
    if (this.isBlocked(goalCol, goalRow)) return null;
    if (startCol === goalCol && startRow === goalRow) return [{ col: startCol, row: startRow }];

    const open = new MinHeap();
    const closed = new Set<number>();
    const gScores = new Map<number, number>();
    const startH = heuristic(startCol, startRow, goalCol, goalRow);
    open.push({ col: startCol, row: startRow, g: 0, h: startH, f: startH, parent: null });
    gScores.set(keyFor(startCol, startRow), 0);

    let explored = 0;
    while (open.size > 0 && explored < maxNodes) {
      const current = open.pop()!;
      explored++;

      if (current.col === goalCol && current.row === goalRow) return reconstructPath(current);

      const ck = keyFor(current.col, current.row);
      if (closed.has(ck)) continue;
      closed.add(ck);

      for (const dir of DIRECTIONS) {
        const nc = current.col + dir.dc;
        const nr = current.row + dir.dr;
        if (!this.inBounds(nc, nr)) continue;
        const nk = keyFor(nc, nr);
        if (closed.has(nk) || this.blocked.has(nk)) continue;

        // Prevent diagonal moves through blocked corners
        if (dir.dc !== 0 && dir.dr !== 0) {
          if (this.blocked.has(keyFor(current.col + dir.dc, current.row)) ||
              this.blocked.has(keyFor(current.col, current.row + dir.dr))) continue;
        }

        const tentG = current.g + dir.cost;
        const prevG = gScores.get(nk);
        if (prevG !== undefined && tentG >= prevG) continue;
        gScores.set(nk, tentG);
        const h = heuristic(nc, nr, goalCol, goalRow);
        open.push({ col: nc, row: nr, g: tentG, h, f: tentG + h, parent: current });
      }
    }
    return null;
  }
}

/** Remove collinear waypoints, keeping only direction-change points. */
export function smoothPath(path: GridPos[]): GridPos[] {
  if (path.length <= 2) return path;
  const result: GridPos[] = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1], curr = path[i], next = path[i + 1];
    if (curr.col - prev.col !== next.col - curr.col ||
        curr.row - prev.row !== next.row - curr.row) {
      result.push(curr);
    }
  }
  result.push(path[path.length - 1]);
  return result;
}
