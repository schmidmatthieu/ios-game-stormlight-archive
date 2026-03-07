import Foundation
import GameplayKit

/// Pathfinding A* sur grille isométrique
final class PathfindingSystem {

    // MARK: - Grille de navigation

    private var grid: [[Bool]] = []  // true = passable, false = obstacle
    private var width: Int = 0
    private var height: Int = 0

    /// Coût orthogonal (x10 pour éviter les flottants)
    private let orthogonalCost = 10
    /// Coût diagonal ≈ 1.414 * 10
    private let diagonalCost = 14

    func setupGrid(width: Int, height: Int, obstacles: Set<GridPosition>) {
        self.width = width
        self.height = height
        self.grid = Array(
            repeating: Array(repeating: true, count: width),
            count: height
        )

        for obs in obstacles {
            if isValid(obs) {
                grid[obs.row][obs.col] = false
            }
        }
    }

    // MARK: - A* Pathfinding

    func findPath(from start: GridPosition, to end: GridPosition) -> [GridPosition] {
        guard isValid(start), isValid(end),
              grid[end.row][end.col] else { return [] }

        var openSet: Set<Node> = [Node(pos: start)]
        var closedSet: Set<GridPosition> = []
        var cameFrom: [GridPosition: GridPosition] = [:]
        var gScore: [GridPosition: Int] = [start: 0]
        var fScore: [GridPosition: Int] = [start: heuristic(start, end)]

        while !openSet.isEmpty {
            let current = openSet.min(by: { fScore[$0.pos, default: .max] < fScore[$1.pos, default: .max] })!
            openSet.remove(current)

            if current.pos == end {
                return reconstructPath(cameFrom: cameFrom, current: end)
            }

            closedSet.insert(current.pos)

            for (neighbor, cost) in neighbors(of: current.pos) {
                guard !closedSet.contains(neighbor) else { continue }

                let tentativeG = (gScore[current.pos] ?? .max).addingReportingOverflow(cost).partialValue
                guard tentativeG >= 0 else { continue }

                if tentativeG < gScore[neighbor, default: .max] {
                    cameFrom[neighbor] = current.pos
                    gScore[neighbor] = tentativeG
                    fScore[neighbor] = tentativeG + heuristic(neighbor, end)

                    openSet.insert(Node(pos: neighbor))
                }
            }
        }

        return [] // Pas de chemin trouvé
    }

    // MARK: - Helpers

    private func heuristic(_ a: GridPosition, _ b: GridPosition) -> Int {
        // Octile distance (scaled x10)
        let dx = abs(a.col - b.col)
        let dy = abs(a.row - b.row)
        return orthogonalCost * (dx + dy) + (diagonalCost - 2 * orthogonalCost) * min(dx, dy)
    }

    private func neighbors(of pos: GridPosition) -> [(GridPosition, Int)] {
        let orthogonal = [
            GridPosition(col: 0, row: -1),
            GridPosition(col: 0, row: 1),
            GridPosition(col: -1, row: 0),
            GridPosition(col: 1, row: 0)
        ]
        let diagonal = [
            GridPosition(col: -1, row: -1),
            GridPosition(col: 1, row: -1),
            GridPosition(col: -1, row: 1),
            GridPosition(col: 1, row: 1)
        ]

        var result: [(GridPosition, Int)] = []

        for dir in orthogonal {
            let next = GridPosition(col: pos.col + dir.col, row: pos.row + dir.row)
            if isValid(next) && grid[next.row][next.col] {
                result.append((next, orthogonalCost))
            }
        }

        for dir in diagonal {
            let next = GridPosition(col: pos.col + dir.col, row: pos.row + dir.row)
            // Diagonale : vérifier que les deux cases adjacentes sont aussi passables
            let adj1 = GridPosition(col: pos.col + dir.col, row: pos.row)
            let adj2 = GridPosition(col: pos.col, row: pos.row + dir.row)
            if isValid(next) && grid[next.row][next.col]
                && isValid(adj1) && grid[adj1.row][adj1.col]
                && isValid(adj2) && grid[adj2.row][adj2.col] {
                result.append((next, diagonalCost))
            }
        }

        return result
    }

    private func isValid(_ pos: GridPosition) -> Bool {
        pos.col >= 0 && pos.col < width && pos.row >= 0 && pos.row < height
    }

    private func reconstructPath(cameFrom: [GridPosition: GridPosition], current: GridPosition) -> [GridPosition] {
        var path = [current]
        var node = current
        while let prev = cameFrom[node] {
            path.insert(prev, at: 0)
            node = prev
        }
        return path
    }
}

// MARK: - Node wrapper pour Set

private struct Node: Hashable {
    let pos: GridPosition
}

extension GridPosition: Hashable {}
