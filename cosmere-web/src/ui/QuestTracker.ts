import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { QuestManager } from '../game/QuestManager';
import { gameData } from '../data/DataLoader';
import { getLayoutInfo, fontSize, scaled, questTrackerPosition, panelRadius, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

export class QuestTracker extends Container {
  private bg: Graphics;
  private questTitle: Text;
  private objectiveTexts: Text[] = [];
  private navElements: Container;
  private layout: LayoutInfo;
  private panelW: number;
  private panelX: number;
  private panelY: number;
  private collapsed = false;
  private isMobile = false;
  private expandIcon: Text | null = null;

  /** Index of the currently displayed quest within activeQuests */
  private displayIndex = 0;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.layout = getLayoutInfo(screenWidth, screenHeight);
    this.isMobile = this.layout.device === 'mobile';
    this.collapsed = this.isMobile; // Start collapsed on mobile

    const pos = questTrackerPosition(this.layout);
    this.panelW = this.isMobile ? Math.min(160, pos.panelWidth) : pos.panelWidth;
    this.panelX = pos.x + (this.isMobile ? pos.panelWidth - this.panelW : 0);
    this.panelY = pos.y;

    // Background panel
    this.bg = new Graphics();
    this.addChild(this.bg);

    // Nav elements container (prev/next buttons, quest count)
    this.navElements = new Container();
    this.addChild(this.navElements);

    // Quest title
    this.questTitle = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: fontSize(this.isMobile ? 9 : 11, this.layout),
        fill: UI_COLORS.textGold,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: this.panelW - 20,
      }),
    });
    this.questTitle.x = this.panelX + 10;
    this.questTitle.y = this.panelY + 8;
    this.addChild(this.questTitle);

    // Expand/collapse icon on mobile
    if (this.isMobile) {
      this.expandIcon = new Text({
        text: '\u25BC',
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: fontSize(8, this.layout),
          fill: UI_COLORS.textMuted,
        }),
      });
      this.expandIcon.anchor.set(1, 0);
      this.expandIcon.x = this.panelX + this.panelW - 6;
      this.expandIcon.y = this.panelY + 10;
      this.addChild(this.expandIcon);

      // Make tappable to expand/collapse
      this.bg.eventMode = 'static';
      this.bg.cursor = 'pointer';
      this.bg.on('pointerdown', () => {
        this.collapsed = !this.collapsed;
        if (this.expandIcon) {
          this.expandIcon.text = this.collapsed ? '\u25BC' : '\u25B2';
        }
        this.refresh();
      });
    }
  }

  /** Switch to next active quest */
  nextQuest(): void {
    const count = QuestManager.shared.getActiveQuests().length;
    if (count <= 1) return;
    this.displayIndex = (this.displayIndex + 1) % count;
    this.refresh();
  }

  /** Switch to previous active quest */
  prevQuest(): void {
    const count = QuestManager.shared.getActiveQuests().length;
    if (count <= 1) return;
    this.displayIndex = (this.displayIndex - 1 + count) % count;
    this.refresh();
  }

  /** Get the currently displayed quest ID */
  getDisplayedQuestID(): string | null {
    const active = QuestManager.shared.getActiveQuests();
    if (active.length === 0) return null;
    const idx = Math.min(this.displayIndex, active.length - 1);
    return active[idx]?.quest.id ?? null;
  }

  refresh(): void {
    // Clear old objective texts
    for (const t of this.objectiveTexts) {
      t.destroy();
    }
    this.objectiveTexts = [];
    this.navElements.removeChildren();

    const activeQuests = QuestManager.shared.getActiveQuests();
    if (activeQuests.length === 0) {
      this.bg.clear();
      this.questTitle.text = '';
      return;
    }

    // Clamp display index
    if (this.displayIndex >= activeQuests.length) this.displayIndex = 0;

    const { quest, state } = activeQuests[this.displayIndex];
    if (!quest) return;

    // Quest navigation bar (if multiple quests)
    let navHeight = 0;
    if (activeQuests.length > 1 && !(this.isMobile && this.collapsed)) {
      navHeight = scaled(20, this.layout);
      const navY = this.panelY + 4;
      const navFontSize = fontSize(this.isMobile ? 7 : 8, this.layout);

      // Previous button
      const prevBtn = new Graphics();
      prevBtn.roundRect(this.panelX + 4, navY, 20, navHeight - 2, 3)
        .fill({ color: 0x222233, alpha: 0.8 });
      prevBtn.eventMode = 'static';
      prevBtn.cursor = 'pointer';
      prevBtn.on('pointerdown', (e) => { e.stopPropagation(); this.prevQuest(); });
      this.navElements.addChild(prevBtn);

      const prevLabel = new Text({
        text: '\u25C0',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: navFontSize, fill: UI_COLORS.textSecondary }),
      });
      prevLabel.anchor.set(0.5);
      prevLabel.x = this.panelX + 14;
      prevLabel.y = navY + (navHeight - 2) / 2;
      this.navElements.addChild(prevLabel);

      // Quest counter
      const counterText = new Text({
        text: `${this.displayIndex + 1}/${activeQuests.length}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: navFontSize, fill: UI_COLORS.textMuted }),
      });
      counterText.anchor.set(0.5);
      counterText.x = this.panelX + this.panelW / 2;
      counterText.y = navY + (navHeight - 2) / 2;
      this.navElements.addChild(counterText);

      // Next button
      const nextBtn = new Graphics();
      nextBtn.roundRect(this.panelX + this.panelW - 24, navY, 20, navHeight - 2, 3)
        .fill({ color: 0x222233, alpha: 0.8 });
      nextBtn.eventMode = 'static';
      nextBtn.cursor = 'pointer';
      nextBtn.on('pointerdown', (e) => { e.stopPropagation(); this.nextQuest(); });
      this.navElements.addChild(nextBtn);

      const nextLabel = new Text({
        text: '\u25B6',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: navFontSize, fill: UI_COLORS.textSecondary }),
      });
      nextLabel.anchor.set(0.5);
      nextLabel.x = this.panelX + this.panelW - 14;
      nextLabel.y = navY + (navHeight - 2) / 2;
      this.navElements.addChild(nextLabel);
    }

    // Quest title
    const titleY = this.panelY + 8 + navHeight;
    this.questTitle.y = titleY;
    const maxTitleLen = this.isMobile ? 18 : 30;
    this.questTitle.text = quest.name.length > maxTitleLen
      ? quest.name.substring(0, maxTitleLen - 2) + '\u2026'
      : quest.name;

    // Quest type badge
    const typeBadge = quest.type === 'main' ? '[P]' : quest.type === 'side' ? '[S]' : '[H]';
    const typeColor = quest.type === 'main' ? UI_COLORS.textGold : quest.type === 'side' ? 0x88aaff : 0xaa88ff;
    const badgeText = new Text({
      text: typeBadge,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(this.isMobile ? 7 : 8, this.layout), fill: typeColor }),
    });
    badgeText.x = this.panelX + 10;
    badgeText.y = titleY + this.questTitle.height + 1;
    this.addChild(badgeText);
    this.objectiveTexts.push(badgeText);

    // Level indicator
    const lvlText = new Text({
      text: `Nv.${quest.requiredLevel}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(this.isMobile ? 7 : 8, this.layout), fill: UI_COLORS.textMuted }),
    });
    lvlText.x = badgeText.x + badgeText.width + 6;
    lvlText.y = badgeText.y;
    this.addChild(lvlText);
    this.objectiveTexts.push(lvlText);

    // On mobile when collapsed, show just the title + badge
    if (this.isMobile && this.collapsed) {
      const panelH = titleY - this.panelY + this.questTitle.height + badgeText.height + 10;
      const radius = panelRadius(this.layout);
      this.bg.clear();
      this.bg.roundRect(this.panelX, this.panelY, this.panelW, panelH, radius)
        .fill({ color: UI_COLORS.panelBg, alpha: 0.7 })
        .stroke({ color: 0x443355, width: 1, alpha: UI_ALPHA.panelBorder });
      return;
    }

    let yOffset = badgeText.y + badgeText.height + 4;

    const objStyle = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(9, this.layout),
      fill: UI_COLORS.textSecondary,
      wordWrap: true,
      wordWrapWidth: this.panelW - 28,
    });

    const doneStyle = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(9, this.layout),
      fill: UI_COLORS.success,
      wordWrap: true,
      wordWrapWidth: this.panelW - 28,
    });

    for (const obj of quest.objectives) {
      const progress = state.objectiveProgress[obj.id] ?? 0;
      const done = progress >= obj.requiredCount;
      const checkmark = done ? '\u2713' : '\u25CB';
      const countStr = obj.requiredCount > 1 ? ` (${progress}/${obj.requiredCount})` : '';

      const t = new Text({
        text: `${checkmark} ${obj.description}${countStr}`,
        style: done ? doneStyle : objStyle,
      });
      t.x = this.panelX + 14;
      t.y = yOffset;
      this.addChild(t);
      this.objectiveTexts.push(t);
      yOffset += t.height + 4;
    }

    // Rewards preview
    const rewards = quest.rewards;
    if (rewards) {
      const rewardParts: string[] = [];
      if (rewards.xp) rewardParts.push(`${rewards.xp} XP`);
      if (rewards.gold) rewardParts.push(`${rewards.gold} or`);
      if (rewards.itemIDs?.length) rewardParts.push(`${rewards.itemIDs.length} objet${rewards.itemIDs.length > 1 ? 's' : ''}`);

      if (rewardParts.length > 0) {
        const rewardText = new Text({
          text: `\u2605 ${rewardParts.join(', ')}`,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, this.layout), fill: 0xccaa44 }),
        });
        rewardText.x = this.panelX + 14;
        rewardText.y = yOffset;
        this.addChild(rewardText);
        this.objectiveTexts.push(rewardText);
        yOffset += rewardText.height + 4;
      }
    }

    // Completion hint
    if (QuestManager.shared.checkQuestCompletion(quest.id)) {
      const completeText = new Text({
        text: '\u25B6 Qu\u00eate pr\u00eate \u00e0 rendre!',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, this.layout), fill: UI_COLORS.warning, fontWeight: 'bold' }),
      });
      completeText.x = this.panelX + 14;
      completeText.y = yOffset;
      this.addChild(completeText);
      this.objectiveTexts.push(completeText);
      yOffset += scaled(16, this.layout);
    }

    // Draw background with proper styling
    const panelH = yOffset - this.panelY + 10;
    const radius = panelRadius(this.layout);
    this.bg.clear();
    this.bg.roundRect(this.panelX, this.panelY, this.panelW, panelH, radius)
      .fill({ color: UI_COLORS.panelBg, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: UI_ALPHA.panelBorder });
  }
}
