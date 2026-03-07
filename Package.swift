// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CosmereChronicles",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "CosmereChronicles", targets: ["CosmereChronicles"])
    ],
    targets: [
        .target(
            name: "CosmereChronicles",
            path: ".",
            exclude: ["GAME_DESIGN.md", "Assets", "TileMaps"],
            sources: ["App", "Core", "Scenes", "Entities", "Systems", "UI", "Data/Models"]
        )
    ]
)
