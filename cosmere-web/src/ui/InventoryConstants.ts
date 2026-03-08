import { Text, TextStyle } from 'pixi.js';
import type { EquipmentSlot } from '../data/types';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import { fontSize } from '../ui/ResponsiveLayout';

export const SLOT_LABELS: Record<string, string> = {
  helmet: 'Casque', shoulders: 'Épaul.', chest: 'Torse', cape: 'Cape',
  gloves: 'Gants', belt: 'Ceint.', legs: 'Jamb.', boots: 'Bottes',
  mainWeapon: 'Arme', offhand: 'M.gauche', amulet: 'Amul.', ring1: 'Ann.1', ring2: 'Ann.2',
};

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'helmet', 'shoulders', 'chest', 'cape', 'mainWeapon',
  'offhand', 'gloves', 'belt', 'legs', 'boots', 'amulet', 'ring1', 'ring2',
];

export const STAT_LABELS: Record<string, string> = {
  vigor: 'VIG', strength: 'FOR', agility: 'AGI', spirit: 'ESP', luck: 'CHA', investiture: 'INV',
};

export function txt(text: string, size: number, fill: number, layout: LayoutInfo, bold = false): Text {
  return new Text({ text, style: new TextStyle({
    fontFamily: 'sans-serif', fontSize: fontSize(size, layout), fill, fontWeight: bold ? 'bold' : 'normal',
  }) });
}
