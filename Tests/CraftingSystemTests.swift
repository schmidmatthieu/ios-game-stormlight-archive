import XCTest
@testable import CosmereChronicles

final class CraftingSystemTests: XCTestCase {

    let craftingSystem = CraftingSystem()

    override func setUp() {
        super.setUp()
        GameManager.shared.startNewGame(name: "Crafter", championClass: .mistborn)
        GameManager.shared.mutateChampion { $0.level = 10; $0.gold = 1000 }
    }

    // MARK: - Recipe Data Integrity

    func testAllRecipesHaveUniqueIDs() {
        var ids = Set<String>()
        for recipe in CraftingSystem.recipes {
            XCTAssertFalse(ids.contains(recipe.id), "Duplicate recipe ID: \(recipe.id)")
            ids.insert(recipe.id)
        }
    }

    func testAllRecipesHaveIngredients() {
        for recipe in CraftingSystem.recipes {
            XCTAssertFalse(recipe.ingredients.isEmpty, "Recipe \(recipe.id) has no ingredients")
        }
    }

    func testAllRecipesHavePositiveGoldCost() {
        for recipe in CraftingSystem.recipes {
            XCTAssertGreaterThan(recipe.goldCost, 0, "Recipe \(recipe.id) should cost gold")
        }
    }

    // MARK: - Crafting Logic

    func testCannotCraftWithInsufficientLevel() {
        GameManager.shared.mutateChampion { $0.level = 1 }
        let highLevelRecipe = CraftingSystem.recipes.first(where: { $0.requiredLevel > 1 })!
        let result = craftingSystem.canCraft(recipe: highLevelRecipe)
        XCTAssertFalse(result.success)
        XCTAssertTrue(result.message.contains("Niveau"))
    }

    func testCannotCraftWithInsufficientGold() {
        GameManager.shared.mutateChampion { $0.gold = 0 }
        let recipe = CraftingSystem.recipes.first!
        let result = craftingSystem.canCraft(recipe: recipe)
        XCTAssertFalse(result.success)
        XCTAssertTrue(result.message.contains("Or"))
    }

    func testCannotCraftWithMissingIngredients() {
        let recipe = CraftingSystem.recipes.first!
        let result = craftingSystem.canCraft(recipe: recipe)
        XCTAssertFalse(result.success)
        XCTAssertTrue(result.message.contains("Manque"))
    }

    // MARK: - Available Recipes

    func testRecipesFilterByStation() {
        let forgeRecipes = craftingSystem.availableRecipes(at: .forge)
        for recipe in forgeRecipes {
            XCTAssertEqual(recipe.requiredStation, .forge)
        }
    }

    func testRecipesFilterByWorld() {
        let scadrialRecipes = craftingSystem.recipesForWorld("scadrial")
        for recipe in scadrialRecipes {
            XCTAssertTrue(recipe.worldID == "scadrial" || recipe.worldID == nil)
        }
    }
}
