import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { QuestManager } from '../game/QuestManager';
import { gameData } from '../data/DataLoader';
import { getLayoutInfo, fontSize, scaled, questTrackerPosition, panelRadius, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

export class QuestTracker extends Container {
  private bg: Graphics;
  private questTitle: Text;
  private objectiveTexts: Text[] = [];
  private layout: LayoutInfo;
  private panelW: number;
  private panelX: number;
  private panelY: number;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.layout = getLayoutInfo(screenWidth, screenHeight);

    const pos = questTrackerPosition(this.layout);
    this.panelW = pos.panelWidth;
    this.panelX = pos.x;
    this.panelY = pos.y;

    // Background panel
    this.bg = new Graphics();
    this.addChild(this.bg);

    // Quest title
    this.questTitle = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: fontSize(11, this.layout),
        fill: UI_COLORS.textGold,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: this.panelW - 20,
      }),
    });
    this.questTitle.x = this.panelX + 10;
    this.questTitle.y = this.panelY + 8;
    this.addChild(this.questTitle);
  }

  refresh(): void {
    // Clear old objective texts
    for (const t of this.objectiveTexts) {
      t.destroy();
    }
    this.objectiveTexts = [];

    const activeQuests = QuestManager.shared.getActiveQuests();
    if (activeQuests.length === 0) {
      this.bg.clear();
      this.questTitle.text = '';
      return;
    }

    // Show first active quest
    const { quest, state } = activeQuests[0];
    if (!quest) return;
    this.questTitle.text = quest.name;

    let yOffset = this.panelY + scaled(24, this.layout);

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
