// ─── Radiant Order Selector (character creation) ────────────────

import { Container, Text, TextStyle } from 'pixi.js';
import type { RadiantOrder } from '../data/types';

const ORDERS: RadiantOrder[] = ['windrunner', 'lightweaver', 'bondsmith', 'edgedancer'];

const ORDER_NAMES: Record<RadiantOrder, string> = {
  windrunner: 'Chevalier du Vent',
  lightweaver: 'Tisseuse de Lumière',
  bondsmith: 'Forgeur de Liens',
  edgedancer: 'Danseuse du Fil',
};

export { ORDERS, ORDER_NAMES };

export function createOrderSelector(
  screenW: number,
  yPosition: number,
  selectedOrder: RadiantOrder,
  onSelect: (order: RadiantOrder) => void,
): Container {
  const container = new Container();
  container.y = yPosition;

  const label = new Text({
    text: 'Ordre Radieux:',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x777777 }),
  });
  label.anchor.set(0.5, 0);
  label.x = screenW / 2;
  container.addChild(label);

  ORDERS.forEach((order, i) => {
    const ox = screenW / 2 + (i - 1.5) * 70;
    const selected = selectedOrder === order;
    const txt = new Text({
      text: ORDER_NAMES[order],
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: 8,
        fill: selected ? 0x66aaff : 0x555555,
        fontWeight: selected ? 'bold' : 'normal',
      }),
    });
    txt.anchor.set(0.5, 0);
    txt.x = ox;
    txt.y = 14;
    txt.eventMode = 'static';
    txt.cursor = 'pointer';
    txt.on('pointerdown', () => onSelect(order));
    container.addChild(txt);
  });

  return container;
}
