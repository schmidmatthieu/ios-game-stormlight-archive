// ─── Talent Tree Panel — passive talent tree UI ─────────────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { TalentTreeSystem } from '../game/TalentTreeSystem';
import type { Talent, TalentBranch } from '../game/TalentTreeData';
import { getLayoutInfo, fontSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from './ResponsiveLayout';

const BRANCH_COLORS = [0xcc4444, 0x44aacc, 0x88cc44];

export function showTalentTreePanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;
  const layout = getLayoutInfo(screenW, screenH);

  const champ = GameManager.shared.champion;
  if (!champ) { onClose(); return panel; }

  const talentSystem = TalentTreeSystem.load(champ.championClass);
  const tree = talentSystem.getTree();

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: UI_COLORS.overlayDark, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', () => { talentSystem.save(); onClose(); });
  panel.addChild(overlay);

  // Panel
  const panelW = Math.min(screenW - 16, 500);
  const panelH = Math.min(screenH - 24, 560);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panelBg = new Graphics();
  panelBg.roundRect(px, py, panelW, panelH, panelRadius(layout))
    .fill({ color: UI_COLORS.panelBgAlt, alpha: UI_ALPHA.panelBg })
    .stroke({ color: 0xaa88cc, width: 2, alpha: 0.5 });
  panelBg.eventMode = 'static';
  panel.addChild(panelBg);

  // Title
  const title = new Text({
    text: `Talents — ${tree.championClass}`,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(14, layout), fontWeight: 'bold', fill: 0xeeddff }),
  });
  title.anchor.set(0.5, 0);
  title.x = px + panelW / 2;
  title.y = py + 10;
  panel.addChild(title);

  // Points display
  const pointsText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.success }),
  });
  pointsText.anchor.set(0.5, 0);
  pointsText.x = px + panelW / 2;
  pointsText.y = py + 30;
  panel.addChild(pointsText);

  // Reset button
  const resetBtn = new Graphics();
  const resetW = 90;
  const resetH = 22;
  resetBtn.roundRect(px + panelW - resetW - 10, py + 28, resetW, resetH, 6)
    .fill({ color: 0x442222, alpha: 0.8 })
    .stroke({ color: UI_COLORS.danger, width: 1, alpha: 0.5 });
  resetBtn.eventMode = 'static';
  resetBtn.cursor = 'pointer';
  panel.addChild(resetBtn);

  const resetLabel = new Text({
    text: 'Réinitialiser',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.danger }),
  });
  resetLabel.anchor.set(0.5);
  resetLabel.x = px + panelW - resetW / 2 - 10;
  resetLabel.y = py + 28 + resetH / 2;
  panel.addChild(resetLabel);

  // Tree content area
  const treeContainer = new Container();
  const treeMask = new Graphics();
  treeMask.rect(px + 5, py + 54, panelW - 10, panelH - 64);
  treeMask.fill({ color: 0xffffff });
  treeContainer.mask = treeMask;
  panel.addChild(treeMask);
  panel.addChild(treeContainer);

  // Detail tooltip
  const detailContainer = new Container();
  detailContainer.zIndex = 10001;
  panel.addChild(detailContainer);

  let scrollOffset = 0;
  let maxScroll = 0;

  function updatePointsDisplay(): void {
    pointsText.text = `Points disponibles: ${champ!.skillPoints} · Dépensés: ${talentSystem.getPlayerTalents().totalPointsSpent}`;
    pointsText.style.fill = champ!.skillPoints > 0 ? UI_COLORS.success : UI_COLORS.textMuted;
  }

  function renderTree(): void {
    treeContainer.removeChildren();
    detailContainer.removeChildren();
    updatePointsDisplay();

    const branchW = Math.floor((panelW - 30) / 3);
    const baseY = py + 70 - scrollOffset;

    for (let bi = 0; bi < tree.branches.length; bi++) {
      const branch = tree.branches[bi];
      const branchColor = BRANCH_COLORS[bi];
      const branchX = px + 10 + bi * (branchW + 5);

      // Branch header
      const branchLabel = new Text({
        text: branch.name,
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: fontSize(9, layout),
          fontWeight: 'bold',
          fill: branchColor,
          wordWrap: true,
          wordWrapWidth: branchW - 4,
        }),
      });
      branchLabel.anchor.set(0.5, 0);
      branchLabel.x = branchX + branchW / 2;
      branchLabel.y = baseY;
      treeContainer.addChild(branchLabel);

      const descLabel = new Text({
        text: branch.description,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: fontSize(7, layout),
          fill: UI_COLORS.textMuted,
          wordWrap: true,
          wordWrapWidth: branchW - 4,
        }),
      });
      descLabel.anchor.set(0.5, 0);
      descLabel.x = branchX + branchW / 2;
      descLabel.y = baseY + 16;
      treeContainer.addChild(descLabel);

      // Talent nodes
      for (let ti = 0; ti < branch.talents.length; ti++) {
        const talent = branch.talents[ti];
        const nodeY = baseY + 40 + ti * 90;
        const nodeCX = branchX + branchW / 2;

        // Connection line to previous
        if (ti > 0) {
          const line = new Graphics();
          const prevState = talentSystem.getTalentState(branch.talents[ti - 1].id, champ!.skillPoints);
          const lineColor = prevState === 'maxed' || prevState === 'unlocked' ? branchColor : UI_COLORS.borderSubtle;
          line.moveTo(nodeCX, nodeY - 48).lineTo(nodeCX, nodeY - 22)
            .stroke({ color: lineColor, width: 2, alpha: 0.5 });
          treeContainer.addChild(line);
        }

        renderTalentNode(talent, nodeCX, nodeY, branchColor, branchW, bi);
      }
    }

    maxScroll = Math.max(0, 4 * 90 + 80 - (panelH - 100));
  }

  function renderTalentNode(talent: Talent, cx: number, cy: number, branchColor: number, branchW: number, _branchIdx: number): void {
    if (cy + 30 < py + 54 || cy - 30 > py + panelH) return;

    const state = talentSystem.getTalentState(talent.id, champ!.skillPoints);
    const rank = talentSystem.getTalentRank(talent.id);
    const nodeW = branchW - 10;
    const nodeH = 42;

    const nodeBg = new Graphics();
    if (state === 'maxed') {
      nodeBg.roundRect(cx - nodeW / 2, cy - nodeH / 2, nodeW, nodeH, 8)
        .fill({ color: branchColor, alpha: 0.25 })
        .stroke({ color: branchColor, width: 2, alpha: 0.9 });
    } else if (state === 'unlocked') {
      nodeBg.roundRect(cx - nodeW / 2, cy - nodeH / 2, nodeW, nodeH, 8)
        .fill({ color: 0x1a1830, alpha: 0.9 })
        .stroke({ color: branchColor, width: 1.5, alpha: 0.6 });
    } else if (state === 'available') {
      nodeBg.roundRect(cx - nodeW / 2, cy - nodeH / 2, nodeW, nodeH, 8)
        .fill({ color: 0x151220, alpha: 0.9 })
        .stroke({ color: UI_COLORS.success, width: 1.5, alpha: 0.7 });
      // Glow
      nodeBg.roundRect(cx - nodeW / 2 - 2, cy - nodeH / 2 - 2, nodeW + 4, nodeH + 4, 10)
        .stroke({ color: UI_COLORS.success, width: 1, alpha: 0.2 });
    } else {
      nodeBg.roundRect(cx - nodeW / 2, cy - nodeH / 2, nodeW, nodeH, 8)
        .fill({ color: 0x0e0c18, alpha: 0.8 })
        .stroke({ color: UI_COLORS.borderSubtle, width: 1, alpha: 0.4 });
    }
    treeContainer.addChild(nodeBg);

    // Name
    const nameColor = state === 'maxed' || state === 'unlocked' ? branchColor
      : state === 'available' ? UI_COLORS.success : UI_COLORS.textMuted;
    const nameText = new Text({
      text: truncate(talent.name, 16),
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fontWeight: 'bold', fill: nameColor }),
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = cx;
    nameText.y = cy - 16;
    treeContainer.addChild(nameText);

    // Rank display
    const rankStr = `${rank}/${talent.maxRank}`;
    const rankText = new Text({
      text: rankStr,
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: fontSize(8, layout),
        fontWeight: 'bold',
        fill: rank >= talent.maxRank ? 0xffcc44 : rank > 0 ? branchColor : UI_COLORS.textMuted,
      }),
    });
    rankText.anchor.set(0.5, 0);
    rankText.x = cx;
    rankText.y = cy;
    treeContainer.addChild(rankText);

    // Effect preview
    const effectStr = formatEffect(talent);
    const effectText = new Text({
      text: effectStr,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: UI_COLORS.textSecondary }),
    });
    effectText.anchor.set(0.5, 0);
    effectText.x = cx;
    effectText.y = cy + 12;
    treeContainer.addChild(effectText);

    // Interaction
    nodeBg.eventMode = 'static';
    nodeBg.cursor = state === 'available' || state === 'unlocked' ? 'pointer' : 'default';
    nodeBg.on('pointerdown', () => {
      if (state === 'available' || state === 'unlocked') {
        const result = talentSystem.unlockTalent(talent.id, champ!.skillPoints);
        if (result.success) {
          champ!.skillPoints = result.pointsRemaining;
          talentSystem.save();
          renderTree();
        }
      }
    });
    nodeBg.on('pointerover', () => showTalentDetail(talent, cx, cy, branchColor, rank));
    nodeBg.on('pointerout', () => detailContainer.removeChildren());
  }

  function showTalentDetail(talent: Talent, nx: number, ny: number, color: number, rank: number): void {
    detailContainer.removeChildren();

    const detailW = 180;
    const detailH = 80;
    let dx = nx + 60;
    let dy = ny - detailH / 2;

    if (dx + detailW > px + panelW - 5) dx = nx - 60 - detailW;
    if (dy < py + 54) dy = py + 54;
    if (dy + detailH > py + panelH - 5) dy = py + panelH - 5 - detailH;

    const bg = new Graphics();
    bg.roundRect(dx, dy, detailW, detailH, 6)
      .fill({ color: UI_COLORS.panelBg, alpha: 0.95 })
      .stroke({ color: color, width: 1, alpha: 0.5 });
    bg.eventMode = 'static';
    detailContainer.addChild(bg);

    const nameText = new Text({
      text: talent.name,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(10, layout), fontWeight: 'bold', fill: color }),
    });
    nameText.x = dx + 6;
    nameText.y = dy + 4;
    detailContainer.addChild(nameText);

    const descText = new Text({
      text: talent.description,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: UI_COLORS.textSecondary, wordWrap: true, wordWrapWidth: detailW - 12 }),
    });
    descText.x = dx + 6;
    descText.y = dy + 20;
    detailContainer.addChild(descText);

    const currentValue = talent.effect.valuePerRank * rank;
    const nextValue = talent.effect.valuePerRank * (rank + 1);
    const bonusStr = rank < talent.maxRank
      ? `Actuel: ${formatValue(currentValue)} → Suivant: ${formatValue(nextValue)}`
      : `Max: ${formatValue(currentValue)}`;
    const bonusText = new Text({
      text: bonusStr,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: rank >= talent.maxRank ? 0xffcc44 : UI_COLORS.textMuted }),
    });
    bonusText.x = dx + 6;
    bonusText.y = dy + detailH - 16;
    detailContainer.addChild(bonusText);
  }

  // Reset handler
  resetBtn.on('pointerdown', () => {
    const refunded = talentSystem.resetAll();
    champ!.skillPoints += refunded;
    talentSystem.save();
    renderTree();
  });

  // Scroll
  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  panelBg.on('pointerdown', (e) => { isDragging = true; dragStartY = e.globalY; dragStartScroll = scrollOffset; });
  panelBg.on('pointermove', (e) => {
    if (!isDragging) return;
    scrollOffset = Math.max(0, Math.min(maxScroll, dragStartScroll + (dragStartY - e.globalY)));
    renderTree();
  });
  panelBg.on('pointerup', () => { isDragging = false; });
  panelBg.on('pointerupoutside', () => { isDragging = false; });

  // Close button
  const closeBtn = new Graphics();
  closeBtn.circle(px + panelW - 16, py + 16, buttonHeight(layout) / 2)
    .fill({ color: UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: UI_COLORS.danger, width: 1.5, alpha: 0.6 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', () => { talentSystem.save(); onClose(); });
  panel.addChild(closeBtn);

  const closeX = new Text({
    text: '✕',
    style: new TextStyle({ fontSize: fontSize(11, layout), fill: UI_COLORS.danger }),
  });
  closeX.anchor.set(0.5);
  closeX.x = px + panelW - 16;
  closeX.y = py + 16;
  panel.addChild(closeX);

  renderTree();
  uiContainer.addChild(panel);
  return panel;
}

function formatEffect(talent: Talent): string {
  const v = talent.effect.valuePerRank;
  const type = talent.effect.type;
  if (type.includes('Percent') || type.includes('Reduction') || type === 'bonusHP' || type === 'bonusInvestiture') {
    return `${(v * 100).toFixed(0)}% / rang`;
  }
  if (type.includes('PerSecond')) {
    return `${v}/s / rang`;
  }
  return `${v} / rang`;
}

function formatValue(v: number): string {
  if (Math.abs(v) < 1 && v !== 0) return `${(v * 100).toFixed(0)}%`;
  return v.toFixed(1);
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
