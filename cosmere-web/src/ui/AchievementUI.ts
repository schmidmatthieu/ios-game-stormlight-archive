import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AchievementManager } from '../game/AchievementSystem';
import { getLayoutInfo, fontSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import type { AchievementDef, AchievementCategory } from '../game/AchievementSystem';
import { MusicManager } from '../game/MusicSystem';

// ─── Category Info ───────────────────────────────────────────

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  combat: 'Combat',
  exploration: 'Exploration',
  collection: 'Collection',
  mastery: 'Maîtrise',
  cosmere: 'Secrets du Cosmere',
};

const CATEGORY_COLORS: Record<AchievementCategory, number> = {
  combat: 0xcc4444,
  exploration: 0x44aa88,
  collection: 0xaaaa44,
  mastery: 0x6688cc,
  cosmere: 0xaa66cc,
};

// ─── Achievement Toast Notification ──────────────────────────

export function createAchievementToast(
  uiContainer: Container,
  screenW: number,
): { update: (dt: number) => void } {
  const toastContainer = new Container();
  toastContainer.zIndex = 9999;
  toastContainer.y = -50; // Start off-screen
  const layout = getLayoutInfo(screenW, screenW); // Approximate layout for toast sizing
  uiContainer.addChild(toastContainer);

  let activeToast: Container | null = null;
  let toastTimer = 0;
  let toastPhase: 'idle' | 'slide_in' | 'display' | 'slide_out' = 'idle';

  function showToast(achievement: AchievementDef): void {
    MusicManager.shared.playSFX('achievement');
    if (activeToast) {
      toastContainer.removeChild(activeToast);
      activeToast.destroy({ children: true });
    }

    const toast = new Container();
    const toastW = Math.min(screenW - 20, 260);
    const toastH = 44;
    const tx = (screenW - toastW) / 2;

    // Background
    const bg = new Graphics();
    bg.roundRect(tx, 0, toastW, toastH, 8)
      .fill({ color: UI_COLORS.panelBgAlt, alpha: UI_ALPHA.panelBg })
      .stroke({ color: CATEGORY_COLORS[achievement.category] ?? 0xaa8844, width: 2, alpha: 0.8 });
    toast.addChild(bg);

    // Icon
    const iconText = new Text({
      text: achievement.icon,
      style: new TextStyle({ fontSize: 18 }),
    });
    iconText.x = tx + 10;
    iconText.y = 8;
    toast.addChild(iconText);

    // "Achievement Unlocked" header
    const header = new Text({
      text: 'Succès Débloqué!',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.warning, fontWeight: 'bold' }),
    });
    header.x = tx + 38;
    header.y = 6;
    toast.addChild(header);

    // Achievement name
    const nameText = new Text({
      text: achievement.name,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: fontSize(11, layout), fontWeight: 'bold',
        fill: CATEGORY_COLORS[achievement.category] ?? UI_COLORS.textGold,
      }),
    });
    nameText.x = tx + 38;
    nameText.y = 18;
    toast.addChild(nameText);

    // Description
    const descText = new Text({
      text: achievement.description,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textSecondary }),
    });
    descText.x = tx + 38;
    descText.y = 32;
    toast.addChild(descText);

    toastContainer.addChild(toast);
    activeToast = toast;
    toastTimer = 0;
    toastPhase = 'slide_in';
  }

  return {
    update(dt: number) {
      // Check for pending notifications
      if (toastPhase === 'idle') {
        const ach = AchievementManager.shared.popNotification();
        if (ach) showToast(ach);
        return;
      }

      toastTimer += dt;

      if (toastPhase === 'slide_in') {
        const progress = Math.min(1, toastTimer * 3);
        toastContainer.y = -50 + 60 * easeOutBack(progress);
        if (progress >= 1) {
          toastPhase = 'display';
          toastTimer = 0;
        }
      } else if (toastPhase === 'display') {
        if (toastTimer > 3) {
          toastPhase = 'slide_out';
          toastTimer = 0;
        }
      } else if (toastPhase === 'slide_out') {
        const progress = Math.min(1, toastTimer * 3);
        toastContainer.y = 10 - 60 * progress;
        if (progress >= 1) {
          if (activeToast) {
            toastContainer.removeChild(activeToast);
            activeToast.destroy({ children: true });
            activeToast = null;
          }
          toastPhase = 'idle';
          toastTimer = 0;
        }
      }
    },
  };
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── Achievement Panel ───────────────────────────────────────

export function showAchievementPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;
  const panelLayout = getLayoutInfo(screenW, screenH);

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: UI_COLORS.overlayDark, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  // Main panel
  const panelW = Math.min(screenW - 20, 400);
  const panelH = Math.min(screenH - 30, 480);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panelBg = new Graphics();
  panelBg.roundRect(px, py, panelW, panelH, panelRadius(panelLayout))
    .fill({ color: UI_COLORS.panelBgAlt, alpha: UI_ALPHA.panelBg })
    .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: UI_ALPHA.panelBorder });
  panelBg.eventMode = 'static';
  panel.addChild(panelBg);

  // Title
  const ach = AchievementManager.shared;
  const title = new Text({
    text: `🏆 Succès (${ach.totalUnlocked}/${ach.totalAchievements})`,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(15, panelLayout), fontWeight: 'bold', fill: UI_COLORS.textGold }),
  });
  title.x = px + panelW / 2 - 70;
  title.y = py + 10;
  panel.addChild(title);

  // Progress bar
  const barW = panelW - 40;
  const barBg = new Graphics();
  barBg.roundRect(px + 20, py + 32, barW, 8, 4).fill({ color: UI_COLORS.panelBg });
  panel.addChild(barBg);

  const fillW = barW * (ach.totalUnlocked / ach.totalAchievements);
  if (fillW > 0) {
    const barFill = new Graphics();
    barFill.roundRect(px + 20, py + 32, fillW, 8, 4).fill({ color: UI_COLORS.textGold });
    panel.addChild(barFill);
  }

  // Category tabs
  const categories: AchievementCategory[] = ['combat', 'exploration', 'collection', 'mastery', 'cosmere'];
  let currentCategory: AchievementCategory = 'combat';
  const tabContainer = new Container();
  tabContainer.y = py + 46;
  panel.addChild(tabContainer);

  // Content
  const contentContainer = new Container();
  const contentMask = new Graphics();
  contentMask.rect(px + 5, py + 68, panelW - 10, panelH - 78);
  contentMask.fill({ color: 0xffffff });
  contentContainer.mask = contentMask;
  panel.addChild(contentMask);
  panel.addChild(contentContainer);

  let scrollOffset = 0;
  const maxScroll = { value: 0 };

  function renderTabs(): void {
    tabContainer.removeChildren();
    let tabX = px + 8;
    for (const cat of categories) {
      const isActive = currentCategory === cat;
      const label = CATEGORY_LABELS[cat];
      const tabW = label.length * 5.5 + 14;
      const color = CATEGORY_COLORS[cat];

      const tabBg = new Graphics();
      tabBg.roundRect(0, 0, tabW, 18, 4)
        .fill({ color: isActive ? color : UI_COLORS.btnSecondary, alpha: isActive ? 0.7 : 0.5 })
        .stroke({ color: isActive ? UI_COLORS.textPrimary : 0x444455, width: 1, alpha: 0.4 });
      tabBg.x = tabX;
      tabBg.eventMode = 'static';
      tabBg.cursor = 'pointer';
      tabBg.on('pointerdown', () => {
        currentCategory = cat;
        scrollOffset = 0;
        renderTabs();
        renderAchievements();
      });

      const tabText = new Text({
        text: label,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, panelLayout), fill: isActive ? 0xffffff : UI_COLORS.textSecondary }),
      });
      tabText.x = tabX + 7;
      tabText.y = 4;
      tabContainer.addChild(tabBg, tabText);
      tabX += tabW + 4;
    }
  }

  function renderAchievements(): void {
    contentContainer.removeChildren();
    const items = ach.getByCategory(currentCategory);
    const cardH = 50;

    let yPos = py + 72 - scrollOffset;
    for (const { def, unlocked } of items) {
      if (yPos + cardH < py + 68 || yPos > py + panelH - 10) {
        yPos += cardH + 4;
        continue;
      }

      // Hidden secrets
      const isHidden = def.secret && !unlocked;

      const card = new Container();
      const bg = new Graphics();
      bg.roundRect(px + 8, yPos, panelW - 16, cardH, 6)
        .fill({ color: unlocked ? 0x151225 : 0x0e0c18, alpha: UI_ALPHA.barBg })
        .stroke({ color: unlocked ? CATEGORY_COLORS[def.category] : UI_COLORS.borderSubtle, width: 1, alpha: unlocked ? 0.6 : UI_ALPHA.subtle });
      card.addChild(bg);

      // Icon
      const iconText = new Text({
        text: isHidden ? '?' : def.icon,
        style: new TextStyle({ fontSize: 16, fill: unlocked ? 0xffffff : 0x555555 }),
      });
      iconText.x = px + 20;
      iconText.y = yPos + 10;
      card.addChild(iconText);

      // Name
      const nameText = new Text({
        text: isHidden ? '???' : def.name,
        style: new TextStyle({
          fontFamily: 'Georgia, serif', fontSize: fontSize(10, panelLayout), fontWeight: 'bold',
          fill: unlocked ? (CATEGORY_COLORS[def.category] ?? UI_COLORS.textGold) : UI_COLORS.textMuted,
        }),
      });
      nameText.x = px + 44;
      nameText.y = yPos + 6;
      card.addChild(nameText);

      // Description
      const descText = new Text({
        text: isHidden ? 'Succès secret - continuez à jouer!' : def.description,
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: fontSize(8, panelLayout),
          fill: unlocked ? UI_COLORS.textSecondary : 0x555566,
          fontStyle: isHidden ? 'italic' : 'normal',
        }),
      });
      descText.x = px + 44;
      descText.y = yPos + 22;
      card.addChild(descText);

      // Checkmark for unlocked
      if (unlocked) {
        const check = new Text({
          text: '✓',
          style: new TextStyle({ fontSize: fontSize(13, panelLayout), fontWeight: 'bold', fill: UI_COLORS.success }),
        });
        check.x = px + panelW - 30;
        check.y = yPos + 14;
        card.addChild(check);
      }

      contentContainer.addChild(card);
      yPos += cardH + 4;
    }

    maxScroll.value = Math.max(0, items.length * (cardH + 4) - (panelH - 90));
  }

  // Scroll
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
    renderAchievements();
  });
  panelBg.on('pointerup', () => { isDragging = false; });
  panelBg.on('pointerupoutside', () => { isDragging = false; });

  // Close button
  const closeBtn = new Graphics();
  closeBtn.circle(px + panelW - 16, py + 16, buttonHeight(panelLayout) / 2)
    .fill({ color: UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: UI_COLORS.danger, width: 1.5, alpha: 0.6 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', onClose);
  panel.addChild(closeBtn);

  const closeX = new Text({
    text: '✕',
    style: new TextStyle({ fontSize: fontSize(11, panelLayout), fill: UI_COLORS.danger }),
  });
  closeX.anchor.set(0.5);
  closeX.x = px + panelW - 16;
  closeX.y = py + 16;
  panel.addChild(closeX);

  renderTabs();
  renderAchievements();

  uiContainer.addChild(panel);
  return panel;
}
