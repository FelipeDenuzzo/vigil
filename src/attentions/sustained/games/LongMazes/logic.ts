import type {
  LongMazeLevelConfig,
  MazeData,
  MazeDirection,
  MazePoint,
  MazeSessionResult,
  MazeCellGrid,
} from "./types";

function getNeighbors(
  p: MazePoint,
  grid: MazeCellGrid,
  rows: number,
  cols: number
): MazePoint[] {
  const neighbors: MazePoint[] = [];
  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  for (const d of dirs) {
    const nx = p.x + d.x;
    const ny = p.y + d.y;
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 0) {
      neighbors.push({ x: nx, y: ny });
    }
  }
  return neighbors;
}

// Encontra todas as células que são becos (apenas 1 vizinho livre)
// excluindo start e end
function findDeadEnds(
  grid: MazeCellGrid,
  rows: number,
  cols: number,
  start: MazePoint,
  end: MazePoint
): MazePoint[] {
  const deadEnds: MazePoint[] = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (grid[y][x] !== 0) continue;
      if ((x === start.x && y === start.y) || (x === end.x && y === end.y)) continue;
      const neighbors = getNeighbors({ x, y }, grid, rows, cols);
      if (neighbors.length === 1) {
        deadEnds.push({ x, y });
      }
    }
  }
  return deadEnds;
}

// Estende um beco em uma direção aleatória por minLength células
// usando passos de 2 (DFS style) para manter estrutura de labirinto
function extendDeadEnd(
  grid: MazeCellGrid,
  beco: MazePoint,
  rows: number,
  cols: number,
  minLength: number
): void {
  const dirs = [
    { dx: 0, dy: -2, wx: 0, wy: -1 },
    { dx: 0, dy: 2, wx: 0, wy: 1 },
    { dx: -2, dy: 0, wx: -1, wy: 0 },
    { dx: 2, dy: 0, wx: 1, wy: 0 },
  ];

  let current = beco;
  let extended = 0;

  while (extended < minLength) {
    // Candidatos: células a 2 passos que ainda são paredes
    const candidates = dirs
      .map((d) => ({
        next: { x: current.x + d.dx, y: current.y + d.dy },
        wall: { x: current.x + d.wx, y: current.y + d.wy },
      }))
      .filter(
        ({ next }) =>
          next.x > 0 &&
          next.x < cols - 1 &&
          next.y > 0 &&
          next.y < rows - 1 &&
          grid[next.y][next.x] === 1
      );

    if (candidates.length === 0) break;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    grid[chosen.wall.y][chosen.wall.x] = 0;
    grid[chosen.next.y][chosen.next.x] = 0;
    current = chosen.next;
    extended += 2;
  }
}

export function generateMaze(level: LongMazeLevelConfig): MazeData {
  const { rows, cols } = level;

  // Inicializa grid com paredes
  const grid: MazeCellGrid = Array.from({ length: rows }, () =>
    Array(cols).fill(1)
  );

  const start: MazePoint = { x: 0, y: 0 };
  const end: MazePoint = { x: cols - 1, y: rows - 1 };

  grid[start.y][start.x] = 0;

  // DFS Randomizado — gera labirinto com caminho único garantido
  const stack: MazePoint[] = [start];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  const dirs = [
    { dx: 0, dy: -2, wx: 0, wy: -1 },
    { dx: 0, dy: 2, wx: 0, wy: 1 },
    { dx: -2, dy: 0, wx: -1, wy: 0 },
    { dx: 2, dy: 0, wx: 1, wy: 0 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { p: MazePoint; wall: MazePoint }[] = [];

    for (const d of dirs) {
      const nx = current.x + d.dx;
      const ny = current.y + d.dy;
      if (
        nx >= 0 &&
        nx < cols &&
        ny >= 0 &&
        ny < rows &&
        !visited.has(`${nx},${ny}`)
      ) {
        neighbors.push({
          p: { x: nx, y: ny },
          wall: { x: current.x + d.wx, y: current.y + d.wy },
        });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[next.wall.y][next.wall.x] = 0;
      grid[next.p.y][next.p.x] = 0;
      visited.add(`${next.p.x},${next.p.y}`);
      stack.push(next.p);
    } else {
      stack.pop();
    }
  }

  // Garante que end está acessível
  grid[end.y][end.x] = 0;
  if (end.x > 0) grid[end.y][end.x - 1] = 0;
  if (end.y > 0) grid[end.y - 1][end.x] = 0;

  // Extende becos deliberadamente para enganar o usuário
  // Não quebra paredes aleatórias — mantém estrutura controlada
  const deadEnds = findDeadEnds(grid, rows, cols, start, end);
  const extensionLength = level.id === 1 ? 4 : level.id === 2 ? 6 : 10;
  for (const beco of deadEnds) {
    extendDeadEnd(grid, beco, rows, cols, extensionLength);
  }

  // BFS para calcular caminho mínimo real
  let shortestPathLength = 0;
  const bfsQueue: { p: MazePoint; dist: number }[] = [{ p: start, dist: 0 }];
  const bfsVisited = new Set<string>();
  bfsVisited.add(`${start.x},${start.y}`);

  let pathFound = false;
  while (bfsQueue.length > 0) {
    const { p, dist } = bfsQueue.shift()!;
    if (p.x === end.x && p.y === end.y) {
      shortestPathLength = dist;
      pathFound = true;
      break;
    }
    const neighbors = getNeighbors(p, grid, rows, cols);
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (!bfsVisited.has(key)) {
        bfsVisited.add(key);
        bfsQueue.push({ p: n, dist: dist + 1 });
      }
    }
  }

  if (!pathFound) {
    shortestPathLength =
      Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
  }

  return { grid, start, end, shortestPathLength };
}

export function movePlayer(
  grid: MazeCellGrid,
  player: MazePoint,
  direction: MazeDirection
): { blocked: boolean; position: MazePoint } {
  let nx = player.x;
  let ny = player.y;

  if (direction === "up") ny -= 1;
  else if (direction === "down") ny += 1;
  else if (direction === "left") nx -= 1;
  else if (direction === "right") nx += 1;

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 0) {
    return { blocked: false, position: { x: nx, y: ny } };
  }

  return { blocked: true, position: player };
}

export function hasReachedEnd(position: MazePoint, end: MazePoint): boolean {
  return position.x === end.x && position.y === end.y;
}

export function isTimeExpired(
  elapsedMs: number,
  timeLimitSec: number
): boolean {
  return elapsedMs >= timeLimitSec * 1000;
}

export function registerVisit(
  visited: Set<string>,
  position: MazePoint
): boolean {
  const key = `${position.x}-${position.y}`;
  if (visited.has(key)) return true;
  visited.add(key);
  return false;
}

export function buildResult(params: {
  success: boolean;
  level: LongMazeLevelConfig;
  elapsedMs: number;
  steps: number;
  revisits: number;
  shortestPathLength: number;
}): MazeSessionResult {
  const { success, level, elapsedMs, steps, revisits, shortestPathLength } = params;
  const efficiency = shortestPathLength > 0 ? steps / shortestPathLength : 0;
  return {
    levelId: level.id,
    success,
    elapsedMs,
    steps,
    revisits,
    shortestPathLength,
    efficiency,
  };
}

export function buildSessionLog(
  result: MazeSessionResult,
  pathLog: MazePoint[]
): object {
  return {
    timestamp: new Date().toISOString(),
    result,
    pathLogCount: pathLog.length,
  };
}

export function saveSessionLog(log: object): void {
  console.log("Log de sessão de Labirintos Prolongados:", log);
}
