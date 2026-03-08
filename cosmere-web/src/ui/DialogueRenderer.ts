// ─── Dialogue Panel Rendering ───────────────────────────────────
// Renders the dialogue panel UI with NPC dialogue trees and choices.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { addReputation, showRankUpEffect } from '../game/ReputationSystem';
import { getLayoutInfo, fontSize, scaled, dialogueWidth, panelRadius, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { DialogueChoice, DialogueNode } from './DialogueData';
import { WORLD_DIALOGUES } from './DialogueData';

function filterChoices(choices: DialogueChoice[]): DialogueChoice[] {
  const champ = GameManager.shared.champion;
  return choices.filter(c => {
    if (!c.condition || c.condition === 'none') return true;
    if (c.condition === 'high_level' && champ && champ.level >= 5) return true;
    if (c.condition === 'has_gold' && champ && champ.gold >= 50) return true;
    return false;
  });
}

export function showDialoguePanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  worldID: string,
  npcName: string,
  onClose: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const dlgW = dialogueWidth(layout);
  const dlgX = (screenW - dlgW) / 2;

  const panel = new Container();
  panel.zIndex = 10000;

  // Dark overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: UI_ALPHA.overlay - 0.15 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  // Pick a dialogue tree
  const trees = WORLD_DIALOGUES[worldID] ?? WORLD_DIALOGUES.scadrial;
  const tree = trees[Math.floor(Math.random() * trees.length)];
  const nodeMap = new Map<string, DialogueNode>();
  for (const node of tree.nodes) nodeMap.set(node.id, node);

  // State
  let currentNode = nodeMap.get(tree.startNodeID)!;
  const contentContainer = new Container();
  panel.addChild(contentContainer);

  function renderNode(node: DialogueNode): void {
    contentContainer.removeChildren();

    const filteredChoices = filterChoices(node.choices);
    const choiceBtnH = scaled(32, layout);
    const choiceSpacing = scaled(34, layout);
    const panelH = scaled(70, layout) + filteredChoices.length * choiceSpacing;
    const panelY = screenH - panelH - scaled(20, layout);
    const radius = panelRadius(layout);

    // Panel background — glass style
    const bg = new Graphics();
    bg.roundRect(dlgX, panelY, dlgW, panelH, radius + 2)
      .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.94 })
      .stroke({ color: 0x665533, width: 2, alpha: 0.7 });
    bg.eventMode = 'static';
    contentContainer.addChild(bg);

    // NPC name badge
    const nameLabel = new Text({
      text: npcName,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(13, layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
    });
    nameLabel.x = dlgX + scaled(18, layout);
    nameLabel.y = panelY + scaled(10, layout);
    contentContainer.addChild(nameLabel);

    // Dialogue text — better readability
    const dialogueText = new Text({
      text: node.text,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: fontSize(11, layout), fill: UI_COLORS.textPrimary,
        wordWrap: true, wordWrapWidth: dlgW - scaled(36, layout),
        lineHeight: fontSize(11, layout) * 1.4,
      }),
    });
    dialogueText.x = dlgX + scaled(18, layout);
    dialogueText.y = panelY + scaled(30, layout);
    contentContainer.addChild(dialogueText);

    // Choices — bigger touch targets, better styling
    const choiceStartY = panelY + scaled(58, layout);
    filteredChoices.forEach((choice, i) => {
      const choiceY = choiceStartY + i * choiceSpacing;

      const choiceBg = new Graphics();
      choiceBg.roundRect(dlgX + scaled(12, layout), choiceY, dlgW - scaled(24, layout), choiceBtnH, 6)
        .fill({ color: UI_COLORS.btnSecondary, alpha: 0.75 })
        .stroke({ color: 0x443355, width: 1, alpha: UI_ALPHA.panelBorder });
      choiceBg.eventMode = 'static';
      choiceBg.cursor = 'pointer';
      contentContainer.addChild(choiceBg);

      const arrow = new Text({
        text: '\u25B8',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: UI_COLORS.textGold }),
      });
      arrow.x = dlgX + scaled(20, layout);
      arrow.y = choiceY + scaled(6, layout);
      contentContainer.addChild(arrow);

      const choiceText = new Text({
        text: choice.text,
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textPrimary,
          wordWrap: true, wordWrapWidth: dlgW - scaled(80, layout),
        }),
      });
      choiceText.x = dlgX + scaled(36, layout);
      choiceText.y = choiceY + scaled(7, layout);
      contentContainer.addChild(choiceText);

      // Reward hint — more visible
      if (choice.reward) {
        const parts: string[] = [];
        if (choice.reward.xp) parts.push(`+${choice.reward.xp}XP`);
        if (choice.reward.gold) parts.push(`+${choice.reward.gold}or`);
        if (choice.reward.reputation) parts.push(`+${choice.reward.reputation}rep`);
        if (parts.length > 0) {
          const rewardHint = new Text({
            text: parts.join(' '),
            style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.success }),
          });
          rewardHint.anchor.set(1, 0.5);
          rewardHint.x = dlgX + dlgW - scaled(20, layout);
          rewardHint.y = choiceY + choiceBtnH / 2;
          contentContainer.addChild(rewardHint);
        }
      }

      // Touch feedback on choices
      choiceBg.on('pointerover', () => { choiceBg.alpha = 0.9; });
      choiceBg.on('pointerout', () => { choiceBg.alpha = 1; });
      choiceBg.on('pointerdown', () => {
        choiceBg.alpha = 0.7;
        // Grant rewards
        if (choice.reward) {
          const champ = GameManager.shared.champion;
          if (champ) {
            if (choice.reward.xp) GameManager.shared.grantXP(choice.reward.xp);
            if (choice.reward.gold) champ.gold += choice.reward.gold;
            if (choice.reward.reputation) {
              const result = addReputation(worldID, choice.reward.reputation);
              if (result.rankUp) {
                showRankUpEffect(uiContainer, screenW, screenH, result.rankName, worldID);
              }
            }
          }
        }

        // Navigate to next node or close
        if (choice.nextNodeID) {
          const nextNode = nodeMap.get(choice.nextNodeID);
          if (nextNode) {
            currentNode = nextNode;
            renderNode(nextNode);
            return;
          }
        }
        onClose();
      });
    });
  }

  renderNode(currentNode);

  // Close on overlay tap only if no choices visible
  overlay.on('pointerdown', onClose);

  uiContainer.addChild(panel);
  return panel;
}
