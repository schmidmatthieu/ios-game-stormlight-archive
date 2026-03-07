import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { MusicManager } from '../game/MusicSystem';

// ─── Music & Ambient Sound Indicator ───────────────────────────

export function createMusicIndicator(
  uiContainer: Container,
  screenW: number,
  screenH: number,
): {
  update: (dt: number) => void;
} {
  const container = new Container();
  container.zIndex = 940;
  container.x = 8;
  container.y = screenH - 50;
  uiContainer.addChild(container);

  // Background
  const bg = new Graphics();
  bg.roundRect(0, 0, 120, 40, 6)
    .fill({ color: 0x0a0815, alpha: 0.7 })
    .stroke({ color: 0x334455, width: 1, alpha: 0.4 });
  container.addChild(bg);

  // Music icon
  const musicIcon = new Text({
    text: '🎵',
    style: new TextStyle({ fontSize: 12 }),
  });
  musicIcon.x = 6;
  musicIcon.y = 4;
  container.addChild(musicIcon);

  // Track name
  const trackName = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0xcccccc }),
  });
  trackName.x = 22;
  trackName.y = 4;
  container.addChild(trackName);

  // Ambient label
  const ambientLabel = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 6, fill: 0x888888 }),
  });
  ambientLabel.x = 22;
  ambientLabel.y = 16;
  container.addChild(ambientLabel);

  // Volume bar background
  const volBg = new Graphics();
  volBg.roundRect(6, 30, 60, 4, 2).fill({ color: 0x222233, alpha: 0.5 });
  container.addChild(volBg);

  // Volume bar fill
  const volFill = new Graphics();
  container.addChild(volFill);

  // Mute button
  const muteBtn = new Text({
    text: '🔊',
    style: new TextStyle({ fontSize: 10 }),
  });
  muteBtn.x = 72;
  muteBtn.y = 27;
  muteBtn.eventMode = 'static';
  muteBtn.cursor = 'pointer';
  muteBtn.on('pointertap', () => {
    MusicManager.shared.toggleMute();
  });
  container.addChild(muteBtn);

  // Equalizer bars (visual only, decorative)
  const eqBars: Graphics[] = [];
  for (let i = 0; i < 4; i++) {
    const bar = new Graphics();
    bar.x = 92 + i * 6;
    bar.y = 30;
    container.addChild(bar);
    eqBars.push(bar);
  }

  let eqTimer = 0;

  return {
    update(dt: number) {
      const mm = MusicManager.shared;

      // Track name
      if (mm.currentTrack) {
        musicIcon.text = mm.currentTrack.icon;
        trackName.text = mm.currentTrack.name;
        trackName.style.fill = mm.currentTrack.color;
      }

      // Ambient layers
      if (mm.ambientLayers.length > 0) {
        const labels = mm.ambientLayers.map(a => `${a.icon} ${a.label}`).join('  ');
        ambientLabel.text = labels.length > 28 ? labels.slice(0, 25) + '...' : labels;
      }

      // Volume bar
      volFill.clear();
      const fillW = 60 * mm.volume;
      if (fillW > 0 && !mm.isMuted) {
        volFill.roundRect(6, 30, fillW, 4, 2).fill({ color: 0x5588cc, alpha: 0.7 });
      }

      // Mute icon
      muteBtn.text = mm.isMuted ? '🔇' : '🔊';

      // Animated equalizer bars
      eqTimer += dt;
      for (let i = 0; i < eqBars.length; i++) {
        const bar = eqBars[i];
        bar.clear();
        if (mm.isMuted) continue;
        const h = mm.inCombat
          ? 4 + Math.sin(eqTimer * 8 + i * 1.5) * 4 + Math.random() * 2
          : 2 + Math.sin(eqTimer * 3 + i * 1.2) * 2;
        bar.roundRect(0, -h, 4, h, 1).fill({ color: mm.currentTrack?.color ?? 0x5588cc, alpha: 0.6 });
      }

      // Fade container slightly when idle
      container.alpha = mm.inCombat ? 1.0 : 0.7;
    },
  };
}
