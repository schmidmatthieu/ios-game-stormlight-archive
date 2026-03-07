import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import type { Skill, MagicSystemType, ChampionClass } from '../data/types';

// ─── Magic System Config ─────────────────────────────────────

const CLASS_MAGIC: Record<ChampionClass, MagicSystemType> = {
  mistborn: 'allomancy',
  radiant: 'surgebinding',
  awakener: 'awakening',
  elantrian: 'aonDor',
  sandMaster: 'sandMastery',
  nightmarePainter: 'painting',
};

const MAGIC_NAMES: Record<MagicSystemType, string> = {
  allomancy: 'Allomancie',
  surgebinding: 'Liens de Tempête',
  awakening: 'Éveil',
  aonDor: 'Aon Dor',
  sandMastery: 'Maîtrise du Sable',
  painting: 'Peinture',
};

const MAGIC_COLORS: Record<MagicSystemType, number> = {
  allomancy: 0x8899aa,
  surgebinding: 0x4488cc,
  awakening: 0x44cc88,
  aonDor: 0xccaa44,
  sandMastery: 0xddaa55,
  painting: 0xaa55cc,
};

const TARGETING_LABELS: Record<string, string> = {
  singleEnemy: 'Cible unique',
  selfOnly: 'Soi-même',
  aoe: 'Zone',
  allEnemies: 'Tous les ennemis',
};

// ─── Skill Tree Layout ───────────────────────────────────────

interface SkillNode {
  skill: Skill;
  x: number;
  y: number;
  unlocked: boolean;
  equipped: boolean;
  available: boolean; // Can be unlocked (prerequisites met, level met)
}

function buildSkillTree(magic: MagicSystemType, unlockedIDs: string[], equippedIDs: string[], playerLevel: number): SkillNode[] {
  const skills: Skill[] = [];
  gameData.skills.forEach(s => {
    if (s.magicSystem === magic) skills.push(s);
  });

  // Sort by level requirement then by name
  skills.sort((a, b) => a.requiredLevel - b.requiredLevel || a.name.localeCompare(b.name));

  // Group by level tiers for tree layout
  const tiers = new Map<number, Skill[]>();
  for (const s of skills) {
    const tier = s.requiredLevel;
    if (!tiers.has(tier)) tiers.set(tier, []);
    tiers.get(tier)!.push(s);
  }

  const nodes: SkillNode[] = [];
  const sortedTiers = Array.from(tiers.keys()).sort((a, b) => a - b);
  const tierSpacing = 80;
  const nodeSpacing = 90;

  for (let ti = 0; ti < sortedTiers.length; ti++) {
    const tierSkills = tiers.get(sortedTiers[ti])!;
    const tierWidth = (tierSkills.length - 1) * nodeSpacing;

    for (let si = 0; si < tierSkills.length; si++) {
      const skill = tierSkills[si];
      const unlocked = unlockedIDs.includes(skill.id);
      const equipped = equippedIDs.includes(skill.id);

      // Check availability
      let prereqMet = true;
      if (skill.prerequisiteSkillID) {
        prereqMet = unlockedIDs.includes(skill.prerequisiteSkillID);
      }
      const available = !unlocked && prereqMet && playerLevel >= skill.requiredLevel;

      nodes.push({
        skill,
        x: si * nodeSpacing - tierWidth / 2,
        y: ti * tierSpacing,
        unlocked,
        equipped,
        available,
      });
    }
  }

  return nodes;
}

// ─── Skill Tree Panel ────────────────────────────────────────

export function showSkillTreePanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;

  const champ = GameManager.shared.champion;
  if (!champ) { onClose(); return panel; }

  const magic = CLASS_MAGIC[champ.championClass];
  const magicColor = MAGIC_COLORS[magic];

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.6 });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  // Panel
  const panelW = Math.min(screenW - 16, 420);
  const panelH = Math.min(screenH - 24, 520);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panelBg = new Graphics();
  panelBg.roundRect(px, py, panelW, panelH, 12)
    .fill({ color: 0x0a0815, alpha: 0.95 })
    .stroke({ color: magicColor, width: 2, alpha: 0.5 });
  panelBg.eventMode = 'static';
  panel.addChild(panelBg);

  // Title
  const title = new Text({
    text: `✦ ${MAGIC_NAMES[magic]} - Arbre de Compétences`,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 12, fontWeight: 'bold', fill: magicColor }),
  });
  title.x = px + panelW / 2;
  title.anchor.set(0.5, 0);
  title.y = py + 10;
  panel.addChild(title);

  // Skill points display
  const spText = new Text({
    text: `Points de compétence: ${champ.skillPoints}`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: champ.skillPoints > 0 ? 0x66cc44 : 0x888899 }),
  });
  spText.x = px + panelW / 2;
  spText.anchor.set(0.5, 0);
  spText.y = py + 28;
  panel.addChild(spText);

  // Tree content area
  const treeContainer = new Container();
  const treeMask = new Graphics();
  treeMask.rect(px + 5, py + 44, panelW - 10, panelH - 54);
  treeMask.fill({ color: 0xffffff });
  treeContainer.mask = treeMask;
  panel.addChild(treeMask);
  panel.addChild(treeContainer);

  let scrollOffset = 0;
  const maxScroll = { value: 0 };

  // Detail tooltip container
  const detailContainer = new Container();
  detailContainer.zIndex = 10001;
  panel.addChild(detailContainer);

  function renderTree(): void {
    treeContainer.removeChildren();
    detailContainer.removeChildren();

    const nodes = buildSkillTree(magic, champ!.unlockedSkillIDs, champ!.equippedSkillIDs, champ!.level);
    const centerX = px + panelW / 2;
    const baseY = py + 70 - scrollOffset;

    // Draw connection lines first
    const lines = new Graphics();
    for (const node of nodes) {
      if (node.skill.prerequisiteSkillID) {
        const parent = nodes.find(n => n.skill.id === node.skill.prerequisiteSkillID);
        if (parent) {
          const fromX = centerX + parent.x;
          const fromY = baseY + parent.y + 20;
          const toX = centerX + node.x;
          const toY = baseY + node.y - 20;

          lines.moveTo(fromX, fromY)
            .lineTo(fromX, (fromY + toY) / 2)
            .lineTo(toX, (fromY + toY) / 2)
            .lineTo(toX, toY)
            .stroke({ color: node.unlocked ? magicColor : 0x333344, width: 1.5, alpha: node.unlocked ? 0.7 : 0.3 });
        }
      }
    }
    treeContainer.addChild(lines);

    // Draw nodes
    for (const node of nodes) {
      const nx = centerX + node.x;
      const ny = baseY + node.y;

      // Skip if out of visible area
      if (ny + 30 < py + 44 || ny - 30 > py + panelH) continue;

      const nodeContainer = new Container();

      // Node background
      const nodeBg = new Graphics();
      const nodeW = 80;
      const nodeH = 44;

      if (node.equipped) {
        nodeBg.roundRect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, 8)
          .fill({ color: magicColor, alpha: 0.25 })
          .stroke({ color: magicColor, width: 2, alpha: 0.9 });
      } else if (node.unlocked) {
        nodeBg.roundRect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, 8)
          .fill({ color: 0x1a1830, alpha: 0.9 })
          .stroke({ color: magicColor, width: 1.5, alpha: 0.6 });
      } else if (node.available) {
        nodeBg.roundRect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, 8)
          .fill({ color: 0x151220, alpha: 0.9 })
          .stroke({ color: 0x66cc44, width: 1.5, alpha: 0.6 });
        // Pulsing glow for available
        nodeBg.roundRect(nx - nodeW / 2 - 2, ny - nodeH / 2 - 2, nodeW + 4, nodeH + 4, 10)
          .stroke({ color: 0x66cc44, width: 1, alpha: 0.2 });
      } else {
        nodeBg.roundRect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, 8)
          .fill({ color: 0x0e0c18, alpha: 0.8 })
          .stroke({ color: 0x333344, width: 1, alpha: 0.4 });
      }
      nodeContainer.addChild(nodeBg);

      // Skill name
      const nameText = new Text({
        text: truncate(node.skill.name, 12),
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: 7, fontWeight: 'bold',
          fill: node.unlocked ? magicColor : node.available ? 0x66cc44 : 0x666677,
        }),
      });
      nameText.anchor.set(0.5, 0);
      nameText.x = nx;
      nameText.y = ny - 16;
      nodeContainer.addChild(nameText);

      // Level requirement
      const lvlText = new Text({
        text: `Nv.${node.skill.requiredLevel}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 6, fill: 0x888899 }),
      });
      lvlText.anchor.set(0.5, 0);
      lvlText.x = nx;
      lvlText.y = ny - 4;
      nodeContainer.addChild(lvlText);

      // Damage/Cost info
      const infoStr = node.skill.baseDamage > 0
        ? `⚔${node.skill.baseDamage} · 💎${node.skill.investitureCost}`
        : `💎${node.skill.investitureCost}`;
      const infoText = new Text({
        text: infoStr,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 6, fill: 0x999999 }),
      });
      infoText.anchor.set(0.5, 0);
      infoText.x = nx;
      infoText.y = ny + 7;
      nodeContainer.addChild(infoText);

      // Equipped badge
      if (node.equipped) {
        const badge = new Text({
          text: 'E',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fontWeight: 'bold', fill: 0xffffff }),
        });
        badge.x = nx + nodeW / 2 - 10;
        badge.y = ny - nodeH / 2 + 2;
        nodeContainer.addChild(badge);
      }

      // Interaction
      nodeBg.eventMode = 'static';
      nodeBg.cursor = 'pointer';
      nodeBg.on('pointerdown', () => handleNodeClick(node));
      nodeBg.on('pointerover', () => showDetail(node, nx, ny));
      nodeBg.on('pointerout', () => detailContainer.removeChildren());

      treeContainer.addChild(nodeContainer);
    }

    // Calculate max scroll
    const totalH = nodes.length > 0 ? Math.max(...nodes.map(n => n.y)) + 60 : 0;
    maxScroll.value = Math.max(0, totalH - (panelH - 100));
  }

  function showDetail(node: SkillNode, nx: number, ny: number): void {
    detailContainer.removeChildren();

    const detailW = 160;
    const detailH = 70;
    let dx = nx + 50;
    let dy = ny - detailH / 2;

    // Keep within panel bounds
    if (dx + detailW > px + panelW - 5) dx = nx - 50 - detailW;
    if (dy < py + 44) dy = py + 44;
    if (dy + detailH > py + panelH - 5) dy = py + panelH - 5 - detailH;

    const bg = new Graphics();
    bg.roundRect(dx, dy, detailW, detailH, 6)
      .fill({ color: 0x0e0c1a, alpha: 0.95 })
      .stroke({ color: magicColor, width: 1, alpha: 0.5 });
    detailContainer.addChild(bg);

    const nameText = new Text({
      text: node.skill.name,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 9, fontWeight: 'bold', fill: magicColor }),
    });
    nameText.x = dx + 6;
    nameText.y = dy + 4;
    detailContainer.addChild(nameText);

    const descText = new Text({
      text: node.skill.description,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 6, fill: 0xaaaaaa, wordWrap: true, wordWrapWidth: detailW - 12 }),
    });
    descText.x = dx + 6;
    descText.y = dy + 18;
    detailContainer.addChild(descText);

    const targeting = TARGETING_LABELS[node.skill.targeting] ?? node.skill.targeting;
    const statsStr = `${targeting} · CD: ${node.skill.cooldown}s · Portée: ${node.skill.range}`;
    const statsText = new Text({
      text: statsStr,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 6, fill: 0x777788 }),
    });
    statsText.x = dx + 6;
    statsText.y = dy + detailH - 14;
    detailContainer.addChild(statsText);
  }

  function handleNodeClick(node: SkillNode): void {
    if (!champ) return;

    if (node.available && champ.skillPoints > 0) {
      // Unlock skill
      champ.skillPoints--;
      champ.unlockedSkillIDs.push(node.skill.id);

      // Auto-equip if slot available
      if (champ.equippedSkillIDs.length < 4) {
        champ.equippedSkillIDs.push(node.skill.id);
      }

      spText.text = `Points de compétence: ${champ.skillPoints}`;
      renderTree();
    } else if (node.unlocked && !node.equipped) {
      // Equip (replace last slot if full)
      if (champ.equippedSkillIDs.length < 4) {
        champ.equippedSkillIDs.push(node.skill.id);
      } else {
        champ.equippedSkillIDs[3] = node.skill.id;
      }
      renderTree();
    } else if (node.equipped) {
      // Unequip
      champ.equippedSkillIDs = champ.equippedSkillIDs.filter(id => id !== node.skill.id);
      renderTree();
    }
  }

  // Scroll handling
  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  panelBg.on('pointerdown', (e) => {
    isDragging = true;
    dragStartY = e.globalY;
    dragStartScroll = scrollOffset;
  });
  panelBg.on('pointermove', (e) => {
    if (!isDragging) return;
    const dy = dragStartY - e.globalY;
    scrollOffset = Math.max(0, Math.min(maxScroll.value, dragStartScroll + dy));
    renderTree();
  });
  panelBg.on('pointerup', () => { isDragging = false; });
  panelBg.on('pointerupoutside', () => { isDragging = false; });

  // Close button
  const closeBtn = new Graphics();
  closeBtn.circle(px + panelW - 16, py + 16, 10)
    .fill({ color: 0x332222, alpha: 0.8 })
    .stroke({ color: 0x664444, width: 1.5, alpha: 0.6 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', onClose);
  panel.addChild(closeBtn);

  const closeX = new Text({
    text: '✕',
    style: new TextStyle({ fontSize: 10, fill: 0xcc6666 }),
  });
  closeX.anchor.set(0.5);
  closeX.x = px + panelW - 16;
  closeX.y = py + 16;
  panel.addChild(closeX);

  renderTree();
  uiContainer.addChild(panel);
  return panel;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
