import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { QuestManager, ACT_INFO } from '../game/QuestManager';
import { MusicManager } from '../game/MusicSystem';
import { getLayoutInfo, fontSize, scaled } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

// ─── Quest Journal Panel (full-screen overlay) ─────────────────

const TYPE_ICONS: Record<string, string> = {
  main: '⚔',
  side: '◆',
  hidden: '✦',
};

const STATUS_COLORS: Record<string, number> = {
  completed: 0x44aa44,
  active: 0xe6cc66,
  available: 0x6688cc,
  locked: 0x444455,
};

export function showQuestJournal(
  uiContainer: Container,
  screenW: number,
  screenH: number,
  onClose: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const panel = new Container();
  panel.zIndex = 12000;

  // Dark overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.6 });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  // Journal panel
  const panelW = Math.min(scaled(400, layout), screenW - 20);
  const panelH = Math.min(scaled(500, layout), screenH - 40);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const bg = new Graphics();
  bg.roundRect(px, py, panelW, panelH, 12)
    .fill({ color: 0x080816, alpha: 0.95 })
    .stroke({ color: 0x665533, width: 2, alpha: 0.8 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  // Title
  const title = new Text({
    text: 'JOURNAL DE QUÊTES',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(16, layout),
      fill: 0xe6cc66,
      fontWeight: 'bold',
    }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + scaled(18, layout);
  panel.addChild(title);

  // Progress summary
  const summary = QuestManager.shared.getProgressSummary();
  const summaryText = new Text({
    text: `Principales: ${summary.completedMain}/${summary.totalMain}  Secondaires: ${summary.completedSide}/${summary.totalSide}  Cachées: ${summary.completedHidden}/${summary.totalHidden}`,
    style: new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(8, layout),
      fill: 0x888899,
    }),
  });
  summaryText.anchor.set(0.5);
  summaryText.x = screenW / 2;
  summaryText.y = py + scaled(34, layout);
  panel.addChild(summaryText);

  // Scrollable content area
  const contentMask = new Graphics();
  contentMask.rect(px + 4, py + scaled(44, layout), panelW - 8, panelH - scaled(80, layout))
    .fill(0xffffff);
  panel.addChild(contentMask);

  const scrollContent = new Container();
  scrollContent.mask = contentMask;
  panel.addChild(scrollContent);

  // Build journal content
  const journal = QuestManager.shared.getQuestJournal();
  let yOffset = py + scaled(48, layout);
  const contentX = px + scaled(12, layout);
  const maxTextW = panelW - scaled(30, layout);

  for (const actGroup of journal) {
    const actInfo = ACT_INFO[actGroup.act];
    // Act header
    const actHeader = new Text({
      text: actGroup.actName,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: fontSize(12, layout),
        fill: 0xddaa44,
        fontWeight: 'bold',
      }),
    });
    actHeader.x = contentX;
    actHeader.y = yOffset;
    scrollContent.addChild(actHeader);
    yOffset += scaled(16, layout);

    // Act description
    if (actInfo) {
      const actDesc = new Text({
        text: actInfo.subtitle,
        style: new TextStyle({
          fontFamily: 'Georgia, serif',
          fontSize: fontSize(8, layout),
          fill: 0x887744,
          fontStyle: 'italic',
          wordWrap: true,
          wordWrapWidth: maxTextW,
        }),
      });
      actDesc.x = contentX;
      actDesc.y = yOffset;
      scrollContent.addChild(actDesc);
      yOffset += scaled(14, layout);
    }

    // Separator line
    const sep = new Graphics();
    sep.moveTo(contentX, yOffset).lineTo(contentX + maxTextW, yOffset)
      .stroke({ color: 0x443322, width: 1, alpha: 0.4 });
    scrollContent.addChild(sep);
    yOffset += scaled(6, layout);

    for (const entry of actGroup.quests) {
      const quest = entry.quest;
      const status = entry.status;
      const statusColor = STATUS_COLORS[status];
      const icon = TYPE_ICONS[quest.type] ?? '◆';

      // Quest name row
      const statusIcon = status === 'completed' ? '✓' : status === 'active' ? '▶' : status === 'available' ? '○' : '🔒';
      const questRow = new Text({
        text: `${statusIcon} ${icon} ${quest.name}`,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: fontSize(9, layout),
          fill: statusColor,
          fontWeight: status === 'active' ? 'bold' : 'normal',
          wordWrap: true,
          wordWrapWidth: maxTextW - scaled(10, layout),
        }),
      });
      questRow.x = contentX + scaled(4, layout);
      questRow.y = yOffset;
      scrollContent.addChild(questRow);
      yOffset += questRow.height + scaled(2, layout);

      // Show world + level
      const metaText = new Text({
        text: `${getWorldName(quest.worldID)} — Nv.${quest.requiredLevel}`,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: fontSize(7, layout),
          fill: 0x555566,
        }),
      });
      metaText.x = contentX + scaled(16, layout);
      metaText.y = yOffset;
      scrollContent.addChild(metaText);
      yOffset += scaled(10, layout);

      // Show objectives for active quests
      if (status === 'active' && entry.progress) {
        for (const obj of quest.objectives) {
          const progress = entry.progress.objectiveProgress[obj.id] ?? 0;
          const done = progress >= obj.requiredCount;
          const countStr = obj.requiredCount > 1 ? ` (${progress}/${obj.requiredCount})` : '';
          const objText = new Text({
            text: `  ${done ? '✓' : '○'} ${obj.description}${countStr}`,
            style: new TextStyle({
              fontFamily: 'sans-serif',
              fontSize: fontSize(7, layout),
              fill: done ? 0x44aa44 : 0x8899aa,
            }),
          });
          objText.x = contentX + scaled(12, layout);
          objText.y = yOffset;
          scrollContent.addChild(objText);
          yOffset += scaled(10, layout);
        }
      }

      // Show description for available quests
      if (status === 'available') {
        const descText = new Text({
          text: quest.description.substring(0, 80) + (quest.description.length > 80 ? '...' : ''),
          style: new TextStyle({
            fontFamily: 'sans-serif',
            fontSize: fontSize(7, layout),
            fill: 0x556677,
            fontStyle: 'italic',
            wordWrap: true,
            wordWrapWidth: maxTextW - scaled(20, layout),
          }),
        });
        descText.x = contentX + scaled(16, layout);
        descText.y = yOffset;
        scrollContent.addChild(descText);
        yOffset += descText.height + scaled(2, layout);
      }

      yOffset += scaled(4, layout);
    }

    yOffset += scaled(8, layout);
  }

  // Enable scrolling via drag
  const scrollBounds = { minY: py + scaled(48, layout), maxY: yOffset };
  const visibleH = panelH - scaled(80, layout);
  const totalContentH = scrollBounds.maxY - scrollBounds.minY;
  let scrollY = 0;
  let dragStartY = 0;
  let dragging = false;

  bg.on('pointerdown', (e) => {
    dragging = true;
    dragStartY = e.globalY - scrollY;
  });
  bg.on('pointermove', (e) => {
    if (!dragging) return;
    const newScrollY = e.globalY - dragStartY;
    const maxScroll = Math.max(0, totalContentH - visibleH);
    scrollY = Math.max(-maxScroll, Math.min(0, newScrollY));
    scrollContent.y = scrollY;
  });
  bg.on('pointerup', () => { dragging = false; });
  bg.on('pointerupoutside', () => { dragging = false; });

  // Close button
  const closeBtnW = scaled(80, layout);
  const closeBtnH = scaled(26, layout);
  const closeBg = new Graphics();
  closeBg.roundRect(px + panelW / 2 - closeBtnW / 2, py + panelH - scaled(34, layout), closeBtnW, closeBtnH, 6)
    .fill({ color: 0x332222, alpha: 0.9 })
    .stroke({ color: 0x664433, width: 1 });
  closeBg.eventMode = 'static';
  closeBg.cursor = 'pointer';
  closeBg.on('pointerdown', () => {
    MusicManager.shared.playSFX('close_menu');
    onClose();
  });
  panel.addChild(closeBg);

  const closeLabel = new Text({
    text: 'Fermer',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: 0xeeddcc }),
  });
  closeLabel.anchor.set(0.5);
  closeLabel.x = px + panelW / 2;
  closeLabel.y = py + panelH - scaled(21, layout);
  panel.addChild(closeLabel);

  MusicManager.shared.playSFX('open_menu');
  uiContainer.addChild(panel);
  return panel;
}

function getWorldName(worldID: string): string {
  const names: Record<string, string> = {
    scadrial: 'Scadrial',
    roshar: 'Roshar',
    taldain: 'Taldain',
    komashi: 'Komashi',
    nalthis: 'Nalthis',
    sel: 'Sel',
    shadesmar: 'Shadesmar',
    threnody: 'Thrénodie',
  };
  return names[worldID] ?? worldID;
}
