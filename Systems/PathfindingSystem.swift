import Foundation
import GameplayKit

/// Pathfinding A* sur grille isométrique
final class PathfindingSystem {

    // MARK: - Grille de navigation

    private var grid: [[Bool]] = []  // true = passable, false = obstacle
    private var width: Int = 0
    private var height: Int = 0

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

            for neighbor in neighbors(of: current.pos) {
                guard !closedSet.contains(neighbor) else { continue }

                let tentativeG = gScore[current.pos, default: .max] + 1

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
        abs(a.col - b.col) + abs(a.row - b.row) // Distance Manhattan
    }

    private func neighbors(of pos: GridPosition) -> [GridPosition] {
        let directions = [
            GridPosition(col: 0, row: -1),  // haut
            GridPosition(col: 0, row: 1),   // bas
            GridPosition(col: -1, row: 0),  // gauche
            GridPosition(col: 1, row: 0),   // droite
            GridPosition(col: -1, row: -1), // diag haut-gauche
            GridPosition(col: 1, row: -1),  // diag haut-droite
            GridPosition(col: -1, row: 1),  // diag bas-gauche
            GridPosition(col: 1, row: 1)    // diag bas-droite
        ]

        return directions.compactMap { dir in
            let next = GridPosition(col: pos.col + dir.col, row: pos.row + dir.row)
            return isValid(next) && grid[next.row][next.col] ? next : nil
        }
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
