import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from './GameManager';

// ─── Reputation Ranks ────────────────────────────────────────────

export interface ReputationRank {
  name: string;
  minRep: number;
  color: number;
  perks: string[];
}

const RANKS: ReputationRank[] = [
  { name: 'Inconnu', minRep: 0, color: 0x888888, perks: [] },
  { name: 'Reconnu', minRep: 25, color: 0x66aa44, perks: ['shop_discount_5'] },
  { name: 'Respecté', minRep: 60, color: 0x4488cc, perks: ['shop_discount_10', 'bonus_xp_10'] },
  { name: 'Honoré', minRep: 120, color: 0xaa66dd, perks: ['shop_discount_15', 'bonus_xp_15', 'bonus_loot'] },
  { name: 'Champion', minRep: 200, color: 0xee9911, perks: ['shop_discount_20', 'bonus_xp_20', 'bonus_loot', 'special_dialogue'] },
  { name: 'Légende', minRep: 350, color: 0xff4444, perks: ['shop_discount_25', 'bonus_xp_25', 'bonus_loot', 'special_dialogue', 'world_blessing'] },
];

// World-specific reputation titles
const WORLD_RANK_NAMES: Record<string, string[]> = {
  scadrial: ['Inconnu', 'Allié skaa', 'Brûleur reconnu', 'Héritier de Kelsier', 'Survivant', 'Seigneur des Brumes'],
  roshar: ['Inconnu', 'Écuyer', 'Radieux fidèle', 'Porteur d\'Éclats', 'Héraut', 'Chevalier Radieux'],
  nalthis: ['Inconnu', 'Terne', 'Deuxième Souffle', 'Biochromiste', 'Revenu', 'Divin'],
  taldain: ['Inconnu', 'Apprenti', 'Maître du Sable', 'Seigneur Solaire', 'Archéologue', 'Ombre du Sable'],
  sel: ['Inconnu', 'Initié', 'Scribe Aon', 'Maître du Dor', 'Élantrien béni', 'Sage de Sel'],
  komashi: ['Inconnu', 'Rêveur', 'Peintre initié', 'Chasseur de cauchemars', 'Gardien', 'Maître des Songes'],
  shadesmar: ['Inconnu', 'Voyageur', 'Négociant', 'Marchand des Perles', 'Navigateur', 'Seigneur Cognitif'],
};

// ─── Core Functions ──────────────────────────────────────────────

export function getReputation(worldID: string): number {
  const champ = GameManager.shared.champion;
  if (!champ) return 0;
  return champ.reputation[worldID] ?? 0;
}

export function addReputation(worldID: string, amount: number): { newTotal: number; rankUp: boolean; rankName: string } {
  const champ = GameManager.shared.champion;
  if (!champ) return { newTotal: 0, rankUp: false, rankName: '' };

  const oldRep = champ.reputation[worldID] ?? 0;
  const oldRank = getRankForRep(oldRep);
  const newRep = oldRep + amount;
  champ.reputation[worldID] = newRep;
  const newRank = getRankForRep(newRep);

  const worldNames = WORLD_RANK_NAMES[worldID];
  const rankName = worldNames ? worldNames[newRank.idx] ?? newRank.rank.name : newRank.rank.name;

  return {
    newTotal: newRep,
    rankUp: newRank.idx > oldRank.idx,
    rankName,
  };
}

function getRankForRep(rep: number): { rank: ReputationRank; idx: number } {
  let idx = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (rep >= RANKS[i].minRep) { idx = i; break; }
  }
  return { rank: RANKS[idx], idx };
}

export function getCurrentRank(worldID: string): { rank: ReputationRank; idx: number; name: string } {
  const rep = getReputation(worldID);
  const { rank, idx } = getRankForRep(rep);
  const worldNames = WORLD_RANK_NAMES[worldID];
  const name = worldNames ? worldNames[idx] ?? rank.name : rank.name;
  return { rank, idx, name };
}

export function getNextRank(worldID: string): { rank: ReputationRank; repNeeded: number } | null {
  const rep = getReputation(worldID);
  const { idx } = getRankForRep(rep);
  if (idx >= RANKS.length - 1) return null;
  const next = RANKS[idx + 1];
  return { rank: next, repNeeded: next.minRep - rep };
}

// ─── Perk Helpers ────────────────────────────────────────────────

export function getShopDiscount(worldID: string): number {
  const { rank } = getCurrentRank(worldID);
  for (const perk of rank.perks) {
    const m = perk.match(/^shop_discount_(\d+)$/);
    if (m) return parseInt(m[1]) / 100;
  }
  return 0;
}

export function getBonusXPMultiplier(worldID: string): number {
  const { rank } = getCurrentRank(worldID);
  for (const perk of rank.perks) {
    const m = perk.match(/^bonus_xp_(\d+)$/);
    if (m) return 1 + parseInt(m[1]) / 100;
  }
  return 1;
}

export function hasBonusLoot(worldID: string): boolean {
  const { rank } = getCurrentRank(worldID);
  return rank.perks.includes('bonus_loot');
}

// ─── Reputation HUD Badge ────────────────────────────────────────

export function createReputationBadge(
  uiContainer: Container,
  screenW: number,
  worldID: string,
): { container: Container; refresh: () => void } {
  const container = new Container();
  container.zIndex = 8000;

  const badgeW = 130;
  const badgeH = 28;
  const x = screenW - badgeW - 12;
  const y = 6;

  const bg = new Graphics();
  container.addChild(bg);

  const rankText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 8, fill: 0xcccccc, fontWeight: 'bold' }),
  });
  rankText.x = x + 6;
  rankText.y = y + 3;
  container.addChild(rankText);

  const repBar = new Graphics();
  container.addChild(repBar);

  const repText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x999999 }),
  });
  repText.anchor.set(1, 0);
  repText.x = x + badgeW - 6;
  repText.y = y + 3;
  container.addChild(repText);

  function refresh(): void {
    const { rank, name } = getCurrentRank(worldID);
    const rep = getReputation(worldID);
    const next = getNextRank(worldID);

    bg.clear();
    bg.roundRect(x, y, badgeW, badgeH, 6)
      .fill({ color: 0x0a0a1a, alpha: 0.6 })
      .stroke({ color: rank.color, width: 1, alpha: 0.5 });

    rankText.text = name;
    rankText.style.fill = rank.color;

    repBar.clear();
    const barY = y + 17;
    const barW = badgeW - 12;
    repBar.roundRect(x + 6, barY, barW, 5, 2).fill({ color: 0x111122, alpha: 0.8 });

    if (next) {
      const prevMin = rank.minRep;
      const progress = (rep - prevMin) / (next.rank.minRep - prevMin);
      if (progress > 0) {
        repBar.roundRect(x + 6, barY, barW * Math.min(1, progress), 5, 2).fill({ color: rank.color, alpha: 0.7 });
      }
      repText.text = `${rep}/${next.rank.minRep}`;
    } else {
      repBar.roundRect(x + 6, barY, barW, 5, 2).fill({ color: rank.color, alpha: 0.7 });
      repText.text = `${rep} MAX`;
    }
  }

  refresh();
  uiContainer.addChild(container);

  return { container, refresh };
}

// ─── Rank Up Effect ──────────────────────────────────────────────

export function showRankUpEffect(
  uiContainer: Container,
  screenW: number, screenH: number,
  rankName: string, worldID: string,
): void {
  const container = new Container();
  container.zIndex = 15000;

  const { rank } = getCurrentRank(worldID);

  // Full-screen flash
  const flash = new Graphics();
  flash.rect(0, 0, screenW, screenH).fill({ color: rank.color, alpha: 0.15 });
  container.addChild(flash);

  // Banner
  const bannerH = 60;
  const bannerY = screenH / 2 - bannerH / 2;
  const banner = new Graphics();
  banner.roundRect(20, bannerY, screenW - 40, bannerH, 8)
    .fill({ color: 0x0a0815, alpha: 0.92 })
    .stroke({ color: rank.color, width: 2, alpha: 0.8 });
  container.addChild(banner);

  const title = new Text({
    text: 'RÉPUTATION AUGMENTÉE!',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 12, fill: rank.color, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = bannerY + 16;
  container.addChild(title);

  const rankLabel = new Text({
    text: `Nouveau rang: ${rankName}`,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' }),
  });
  rankLabel.anchor.set(0.5);
  rankLabel.x = screenW / 2;
  rankLabel.y = bannerY + 38;
  container.addChild(rankLabel);

  uiContainer.addChild(container);

  // Fade out
  let elapsed = 0;
  let repLast = performance.now();
  const anim = () => {
    if (container.destroyed) return;
    const now = performance.now();
    const dtSec = (now - repLast) / 1000;
    repLast = now;
    elapsed += dtSec;
    if (elapsed > 1.5) {
      container.alpha = Math.max(0, 1 - (elapsed - 1.5) / 0.5);
    }
    if (elapsed < 2) requestAnimationFrame(anim);
    else container.destroy({ children: true });
  };
  requestAnimationFrame(anim);
}
