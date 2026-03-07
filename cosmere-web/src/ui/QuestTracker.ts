import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { QuestManager } from '../game/QuestManager';
import { gameData } from '../data/DataLoader';

export class QuestTracker extends Container {
  private bg: Graphics;
  private questTitle: Text;
  private objectiveTexts: Text[] = [];
  private screenWidth: number;
  private readonly PANEL_W = 180;
  private readonly PANEL_X_MARGIN = 8;
  private readonly PANEL_Y = 62;

  constructor(screenWidth: number) {
    super();
    this.screenWidth = screenWidth;

    // Background panel
    this.bg = new Graphics();
    this.addChild(this.bg);

    // Quest title
    this.questTitle = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        fill: 0xe6cc66,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: this.PANEL_W - 16,
      }),
    });
    this.questTitle.x = this.screenWidth - this.PANEL_X_MARGIN - this.PANEL_W + 8;
    this.questTitle.y = this.PANEL_Y + 6;
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

    const panelX = this.screenWidth - this.PANEL_X_MARGIN - this.PANEL_W;
    let yOffset = this.PANEL_Y + 22;

    const objStyle = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: 8,
      fill: 0xaabbcc,
      wordWrap: true,
      wordWrapWidth: this.PANEL_W - 24,
    });

    const doneStyle = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: 8,
      fill: 0x66cc44,
      wordWrap: true,
      wordWrapWidth: this.PANEL_W - 24,
    });

    for (const obj of quest.objectives) {
      const progress = state.objectiveProgress[obj.id] ?? 0;
      const done = progress >= obj.requiredCount;
      const checkmark = done ? '✓' : '○';
      const countStr = obj.requiredCount > 1 ? ` (${progress}/${obj.requiredCount})` : '';

      const t = new Text({
        text: `${checkmark} ${obj.description}${countStr}`,
        style: done ? doneStyle : objStyle,
      });
      t.x = panelX + 12;
      t.y = yOffset;
      this.addChild(t);
      this.objectiveTexts.push(t);
      yOffset += t.height + 3;
    }

    // Completion hint
    if (QuestManager.shared.checkQuestCompletion(quest.id)) {
      const completeText = new Text({
        text: '▶ Quête prête à rendre!',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0xffcc44, fontWeight: 'bold' }),
      });
      completeText.x = panelX + 12;
      completeText.y = yOffset;
      this.addChild(completeText);
      this.objectiveTexts.push(completeText);
      yOffset += 14;
    }

    // Draw background
    const panelH = yOffset - this.PANEL_Y + 8;
    this.bg.clear();
    this.bg.roundRect(panelX, this.PANEL_Y, this.PANEL_W, panelH, 6)
      .fill({ color: 0x0a0a1a, alpha: 0.55 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.4 });
  }
}
