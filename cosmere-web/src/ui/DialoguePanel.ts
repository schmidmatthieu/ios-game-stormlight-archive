// ─── Dialogue Panel — Barrel Re-exports ─────────────────────────
// This file re-exports from the split modules so existing imports
// like `import { showDialoguePanel, showShopPanel } from './DialoguePanel'`
// continue to work without changes.

export { showDialoguePanel } from './DialogueRenderer';
export type { DialogueChoice, DialogueNode, DialogueTree } from './DialogueData';
export { WORLD_DIALOGUES } from './DialogueData';

// Re-export the world-specific shop from ShopPanel (the canonical implementation).
// Previously this file had its own hardcoded 5-item shop that ignored worldID.
export { showShopPanel } from './ShopPanel';
