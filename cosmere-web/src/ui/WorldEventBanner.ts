import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { WorldEventManager } from '../game/WorldEvents';
import { getLayoutInfo, fontSize, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import type { WorldEventDef } from '../game/WorldEvents';

// ─── World Event Banner ──────────────────────────────────────

export function createWorldEventBanner(
  uiContainer: Container,
  screenW: number,
): {
  update: (dt: number) => void;
} {
  const banner = new Container();
  banner.zIndex = 980;
  banner.y = -40; // Start off-screen
  const layout = getLayoutInfo(screenW, screenW); // Approximate layout for banner sizing
  uiContainer.addChild(banner);

  let activeBanner: Container | null = null;
  let phase: 'idle' | 'announce' | 'active' | 'ending' = 'idle';
  let phaseTimer = 0;

  function showAnnouncement(event: WorldEventDef): void {
    if (activeBanner) {
      banner.removeChild(activeBanner);
      activeBanner.destroy({ children: true });
    }

    const container = new Container();
    const bannerW = Math.min(screenW - 20, 320);
    const bannerH = 36;
    const bx = (screenW - bannerW) / 2;

    // Background
    const bg = new Graphics();
    bg.roundRect(bx, 0, bannerW, bannerH, 6)
      .fill({ color: UI_COLORS.panelBgAlt, alpha: UI_ALPHA.barBg })
      .stroke({ color: event.color, width: 2, alpha: 0.8 });
    container.addChild(bg);

    // Icon
    const icon = new Text({
      text: event.icon,
      style: new TextStyle({ fontSize: 14 }),
    });
    icon.x = bx + 8;
    icon.y = 6;
    container.addChild(icon);

    // Name
    const name = new Text({
      text: event.name,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(10, layout), fontWeight: 'bold', fill: event.color }),
    });
    name.x = bx + 28;
    name.y = 4;
    container.addChild(name);

    // Description
    const desc = new Text({
      text: event.description.length > 50 ? event.description.slice(0, 47) + '...' : event.description,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: UI_COLORS.textSecondary }),
    });
    desc.x = bx + 28;
    desc.y = 18;
    container.addChild(desc);

    // Timer
    const timer = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textSecondary }),
    });
    timer.anchor.set(1, 0);
    timer.x = bx + bannerW - 8;
    timer.y = 4;
    container.addChild(timer);

    banner.addChild(container);
    activeBanner = container;
    phase = 'announce';
    phaseTimer = 0;

    // Store timer text for updates
    (container as any)._timerText = timer;
  }

  function updateBannerTimer(): void {
    if (!activeBanner || !(activeBanner as any)._timerText) return;
    const timer = (activeBanner as any)._timerText as Text;
    const em = WorldEventManager.shared;
    timer.text = em.timeRemainingFormatted;
  }

  return {
    update(dt: number) {
      const em = WorldEventManager.shared;

      // Check for new announcements
      const announcement = em.popAnnouncement();
      if (announcement) {
        showAnnouncement(announcement);
      }

      phaseTimer += dt;

      if (phase === 'announce') {
        // Slide in
        const progress = Math.min(1, phaseTimer * 2.5);
        banner.y = -40 + 80 * easeOutCubic(progress);
        if (progress >= 1) {
          phase = 'active';
          phaseTimer = 0;
        }
      } else if (phase === 'active') {
        updateBannerTimer();
        // Stay visible while event is active
        if (!em.activeEvent) {
          phase = 'ending';
          phaseTimer = 0;
        }
      } else if (phase === 'ending') {
        // Slide out
        const progress = Math.min(1, phaseTimer * 2);
        banner.y = 40 - 80 * progress;
        if (progress >= 1) {
          if (activeBanner) {
            banner.removeChild(activeBanner);
            activeBanner.destroy({ children: true });
            activeBanner = null;
          }
          phase = 'idle';
          phaseTimer = 0;
        }
      }
    },
  };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
