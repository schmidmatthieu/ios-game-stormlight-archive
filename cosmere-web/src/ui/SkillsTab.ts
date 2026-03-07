// ─── Skills Tab (Inventory Panel) ───────────────────────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';

export function renderSkills(
  contentContainer: Container,
  cx: number, cy: number, cw: number, ch: number,
  onRefresh: () => void,
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;

  let y = cy;

  // Header
  const header = new Text({
    text: `Points de compétence: ${champ.skillPoints}`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xe6cc66, fontWeight: 'bold' }),
  });
  header.x = cx + 14;
  header.y = y;
  contentContainer.addChild(header);
  y += 18;

  // Equipped skills
  const equippedLabel = new Text({
    text: 'Compétences équipées:',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xaaaacc }),
  });
  equippedLabel.x = cx + 14;
  equippedLabel.y = y;
  contentContainer.addChild(equippedLabel);
  y += 14;

  for (let i = 0; i < 4; i++) {
    if (y > cy + ch - 20) break;
    const skillID = champ.equippedSkillIDs[i];
    const skill = skillID ? gameData.skill(skillID) : null;

    const row = new Graphics();
    row.roundRect(cx + 8, y, cw - 16, 26, 4)
      .fill({ color: skill ? 0x1a2228 : 0x1a1528, alpha: 0.6 })
      .stroke({ color: 0x334455, width: 0.5, alpha: 0.4 });
    contentContainer.addChild(row);

    const slotNum = new Text({
      text: `[${i + 1}]`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x6688aa, fontWeight: 'bold' }),
    });
    slotNum.x = cx + 14;
    slotNum.y = y + 3;
    contentContainer.addChild(slotNum);

    if (skill) {
      const nameL = new Text({
        text: skill.name,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xddddcc }),
      });
      nameL.x = cx + 36;
      nameL.y = y + 3;
      contentContainer.addChild(nameL);

      const detailL = new Text({
        text: `DMG: ${skill.baseDamage} | INV: ${skill.investitureCost} | CD: ${skill.cooldown}s`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x888888 }),
      });
      detailL.x = cx + 36;
      detailL.y = y + 15;
      contentContainer.addChild(detailL);
    } else {
      const emptyL = new Text({
        text: '- vide -',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x555555 }),
      });
      emptyL.x = cx + 36;
      emptyL.y = y + 6;
      contentContainer.addChild(emptyL);
    }

    y += 28;
  }

  // Available skills
  y += 6;
  const availLabel = new Text({
    text: 'Compétences disponibles:',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xaaaacc }),
  });
  availLabel.x = cx + 14;
  availLabel.y = y;
  contentContainer.addChild(availLabel);
  y += 14;

  for (const skillID of champ.unlockedSkillIDs) {
    if (y > cy + ch - 20) break;
    if (champ.equippedSkillIDs.includes(skillID)) continue;
    const skill = gameData.skill(skillID);
    if (!skill) continue;

    const row = new Graphics();
    row.roundRect(cx + 8, y, cw - 16, 22, 4)
      .fill({ color: 0x1a1528, alpha: 0.5 })
      .stroke({ color: 0x332244, width: 0.5, alpha: 0.3 });
    row.eventMode = 'static';
    row.cursor = 'pointer';
    row.on('pointerdown', () => {
      const emptyIdx = champ.equippedSkillIDs.findIndex(id => !id);
      if (emptyIdx >= 0) {
        champ.equippedSkillIDs[emptyIdx] = skillID;
      } else if (champ.equippedSkillIDs.length < 4) {
        champ.equippedSkillIDs.push(skillID);
      } else {
        champ.equippedSkillIDs[3] = skillID;
      }
      onRefresh();
    });
    contentContainer.addChild(row);

    const nameL = new Text({
      text: `${skill.name} (Nv.${skill.requiredLevel})`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0xddddcc }),
    });
    nameL.x = cx + 14;
    nameL.y = y + 4;
    contentContainer.addChild(nameL);

    const equipHint = new Text({
      text: 'Équiper',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x66cc44 }),
    });
    equipHint.anchor.set(1, 0);
    equipHint.x = cx + cw - 14;
    equipHint.y = y + 4;
    contentContainer.addChild(equipHint);

    y += 24;
  }
}
