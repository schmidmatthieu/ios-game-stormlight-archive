import Foundation

/// Système de Craft / Forge — combine des matériaux pour créer des items plus puissants
/// Chaque monde a ses recettes de craft uniques basées sur son système magique
final class CraftingSystem {

    // MARK: - Recipe Data

    struct CraftingRecipe: Codable, Identifiable {
        let id: String
        let name: String
        let description: String
        let worldID: WorldID?          // nil = recette universelle
        let requiredLevel: Int
        let ingredients: [Ingredient]
        let resultItemID: String
        let resultQuantity: Int
        let goldCost: Int
        let craftingTime: TimeInterval  // Secondes (0 = instantané)
        let requiredStation: CraftingStation?
    }

    struct Ingredient: Codable {
        let itemID: String
        let quantity: Int
    }

    enum CraftingStation: String, Codable {
        case forge          // Scadrial — forge d'armures et d'armes
        case gemcutter      // Roshar — taille de gemmes
        case loom           // Nalthis — tissage enchant
        case aonTable       // Sel — table de glyphes
        case sandKiln       // Taldain — four à sable (cristallisation)
        case inkBrewer      // Komashi — préparation d'encre
        case cosmericAnvil  // Shadesmar — enclume cosmique (items cosmérique)
    }

    // MARK: - All Recipes

    static let recipes: [CraftingRecipe] = [
        // --- SCADRIAL ---
        CraftingRecipe(
            id: "craft_allomantic_vial_set",
            name: "Set de Fioles Allomantiques",
            description: "Un coffret de 8 fioles contenant chaque métal de base",
            worldID: "scadrial", requiredLevel: 2,
            ingredients: [
                Ingredient(itemID: "steel_vial", quantity: 2),
                Ingredient(itemID: "iron_vial", quantity: 2),
                Ingredient(itemID: "tin_vial", quantity: 2),
                Ingredient(itemID: "pewter_vial", quantity: 2)
            ],
            resultItemID: "allomantic_vial_set",
            resultQuantity: 1, goldCost: 50,
            craftingTime: 5.0, requiredStation: .forge
        ),
        CraftingRecipe(
            id: "craft_obsidian_blade",
            name: "Lame d'Obsidienne Allomantique",
            description: "Lame forgée dans l'atium impur. Non-métallique, invisible aux Allomanciens.",
            worldID: "scadrial", requiredLevel: 4,
            ingredients: [
                Ingredient(itemID: "koloss_blade_shard", quantity: 1),
                Ingredient(itemID: "wraith_bone", quantity: 2)
            ],
            resultItemID: "obsidian_blade",
            resultQuantity: 1, goldCost: 150,
            craftingTime: 10.0, requiredStation: .forge
        ),

        // --- ROSHAR ---
        CraftingRecipe(
            id: "craft_stormlight_battery",
            name: "Batterie de Lumière d'Orage",
            description: "Gemme parfaitement taillée qui retient la Lumière d'Orage plus longtemps",
            worldID: "roshar", requiredLevel: 4,
            ingredients: [
                Ingredient(itemID: "stormlight_broam", quantity: 2),
                Ingredient(itemID: "gemheart_fragment", quantity: 1)
            ],
            resultItemID: "stormlight_battery",
            resultQuantity: 1, goldCost: 200,
            craftingTime: 8.0, requiredStation: .gemcutter
        ),
        CraftingRecipe(
            id: "craft_carapace_fullplate",
            name: "Armure Complète de Carapace",
            description: "Armure lourde assemblée à partir de carapaces de Grandfossoyeur",
            worldID: "roshar", requiredLevel: 6,
            ingredients: [
                Ingredient(itemID: "carapace_plate", quantity: 2),
                Ingredient(itemID: "carapace_armor_piece", quantity: 3)
            ],
            resultItemID: "carapace_fullplate",
            resultQuantity: 1, goldCost: 350,
            craftingTime: 15.0, requiredStation: .gemcutter
        ),

        // --- TALDAIN ---
        CraftingRecipe(
            id: "craft_sandmaster_staff",
            name: "Bâton de Maître du Sable",
            description: "Bâton cristallisé qui amplifie le contrôle du sable",
            worldID: "taldain", requiredLevel: 4,
            ingredients: [
                Ingredient(itemID: "sandling_carapace", quantity: 1),
                Ingredient(itemID: "white_sand_pouch", quantity: 5),
                Ingredient(itemID: "wyrm_scale", quantity: 1)
            ],
            resultItemID: "sandmaster_staff",
            resultQuantity: 1, goldCost: 180,
            craftingTime: 10.0, requiredStation: .sandKiln
        ),

        // --- KOMASHI ---
        CraftingRecipe(
            id: "craft_master_brush",
            name: "Pinceau de Maître",
            description: "Pinceau enchanté qui ne manque jamais d'encre pendant 5 combats",
            worldID: "komashi", requiredLevel: 5,
            ingredients: [
                Ingredient(itemID: "nightmare_ink", quantity: 5),
                Ingredient(itemID: "hion_shard", quantity: 2),
                Ingredient(itemID: "shadow_fabric", quantity: 1)
            ],
            resultItemID: "master_brush",
            resultQuantity: 1, goldCost: 200,
            craftingTime: 8.0, requiredStation: .inkBrewer
        ),

        // --- COSMERIC ---
        CraftingRecipe(
            id: "craft_worldhopper_cloak",
            name: "Cape du Salteur",
            description: "Cape tissée entre les mondes. +10% toutes stats dans tous les mondes.",
            worldID: nil, requiredLevel: 8,
            ingredients: [
                Ingredient(itemID: "shadow_fabric", quantity: 2),
                Ingredient(itemID: "wyrm_scale", quantity: 1),
                Ingredient(itemID: "voidspren_essence", quantity: 1),
                Ingredient(itemID: "dark_sand_core", quantity: 1)
            ],
            resultItemID: "worldhopper_cloak",
            resultQuantity: 1, goldCost: 500,
            craftingTime: 30.0, requiredStation: .cosmericAnvil
        )
    ]

    // MARK: - Crafting Logic

    func canCraft(recipe: CraftingRecipe) -> CraftResult {
        guard let champion = GameManager.shared.champion else {
            return CraftResult(success: false, message: "Pas de champion")
        }

        // Level check
        guard champion.level >= recipe.requiredLevel else {
            return CraftResult(success: false, message: "Niveau \(recipe.requiredLevel) requis (actuel: \(champion.level))")
        }

        // Gold check
        guard champion.gold >= recipe.goldCost else {
            return CraftResult(success: false, message: "Or insuffisant (\(champion.gold)/\(recipe.goldCost))")
        }

        // Ingredients check
        let inventory = champion.inventoryItemIDs
        for ingredient in recipe.ingredients {
            let count = inventory.filter { $0 == ingredient.itemID }.count
            if count < ingredient.quantity {
                let itemName = GameManager.shared.allItems[ingredient.itemID]?.name ?? ingredient.itemID
                return CraftResult(success: false, message: "Manque \(ingredient.quantity - count)× \(itemName)")
            }
        }

        return CraftResult(success: true, message: "Prêt à forger !")
    }

    func craft(recipe: CraftingRecipe) -> CraftResult {
        let check = canCraft(recipe: recipe)
        guard check.success else { return check }

        guard var champion = GameManager.shared.champion else {
            return CraftResult(success: false, message: "Erreur")
        }

        // Consommer les ingrédients
        for ingredient in recipe.ingredients {
            var remaining = ingredient.quantity
            champion.inventoryItemIDs.removeAll { itemID in
                if itemID == ingredient.itemID && remaining > 0 {
                    remaining -= 1
                    return true
                }
                return false
            }
        }

        // Consommer l'or
        champion.gold -= recipe.goldCost

        // Ajouter le résultat
        for _ in 0..<recipe.resultQuantity {
            champion.inventoryItemIDs.append(recipe.resultItemID)
        }

        GameManager.shared.champion = champion

        let itemName = GameManager.shared.allItems[recipe.resultItemID]?.name ?? recipe.resultItemID
        return CraftResult(success: true, message: "\(itemName) forgé !")
    }

    struct CraftResult {
        let success: Bool
        let message: String
    }

    // MARK: - Available Recipes

    func availableRecipes(at station: CraftingStation?) -> [CraftingRecipe] {
        Self.recipes.filter { recipe in
            if let required = recipe.requiredStation {
                return required == station
            }
            return station == nil  // Recettes sans station = n'importe où
        }
    }

    func recipesForWorld(_ worldID: WorldID) -> [CraftingRecipe] {
        Self.recipes.filter { $0.worldID == worldID || $0.worldID == nil }
    }
}
