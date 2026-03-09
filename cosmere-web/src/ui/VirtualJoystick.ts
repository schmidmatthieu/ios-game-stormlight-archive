import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { joystickRadius, UI_COLORS } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

export class VirtualJoystick extends Container {
  private base: Graphics;
  private innerRing: Graphics;
  private thumb: Graphics;
  private activeGlow: Graphics;
  private baseRadius: number;
  private thumbRadius: number;
  private deadzone = 0.1;

  // Output
  direction: { x: number; y: number } = { x: 0, y: 0 };
  magnitude = 0;
  active = false;

  private pointerId: number | null = null;

  constructor(layout?: LayoutInfo) {
    super();

    const defaultBase = 50;
    const defaultThumb = 20;
    if (layout) {
      this.baseRadius = joystickRadius(layout);
      this.thumbRadius = defaultThumb * (this.baseRadius / defaultBase);
    } else {
      this.baseRadius = defaultBase;
      this.thumbRadius = defaultThumb;
    }

    // Outer ring — more visible with better contrast
    this.base = new Graphics();
    this.base.circle(0, 0, this.baseRadius)
      .fill({ color: 0x0c0c1e, alpha: 0.45 })
      .stroke({ color: 0x556677, alpha: 0.6, width: 2.5 });
    this.addChild(this.base);

    // Active glow (visible when pressed)
    this.activeGlow = new Graphics();
    this.activeGlow.circle(0, 0, this.baseRadius + 4)
      .stroke({ color: 0x6688aa, alpha: 0.4, width: 2 });
    this.activeGlow.alpha = 0;
    this.addChild(this.activeGlow);

    // Inner ring guide — deadzone indicator
    this.innerRing = new Graphics();
    this.innerRing.circle(0, 0, this.baseRadius * this.deadzone)
      .fill({ color: 0x334455, alpha: 0.08 });
    this.innerRing.circle(0, 0, this.baseRadius * 0.5)
      .stroke({ color: 0x3a4a5a, alpha: 0.25, width: 1 });
    this.addChild(this.innerRing);

    // Direction markers — chevrons instead of dots for clarity
    const markers = new Graphics();
    const markerDist = this.baseRadius * 0.78;
    const markerSize = 3;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
      const mx = Math.cos(angle) * markerDist;
      const my = Math.sin(angle) * markerDist;

      // Small triangle pointing outward
      const perpAngle = angle;
      const tip = { x: mx + Math.cos(perpAngle) * markerSize, y: my + Math.sin(perpAngle) * markerSize };
      const left = { x: mx + Math.cos(perpAngle + 2.5) * markerSize * 0.7, y: my + Math.sin(perpAngle + 2.5) * markerSize * 0.7 };
      const right = { x: mx + Math.cos(perpAngle - 2.5) * markerSize * 0.7, y: my + Math.sin(perpAngle - 2.5) * markerSize * 0.7 };
      markers.poly([tip, left, right]).fill({ color: 0x667788, alpha: 0.4 });
    }
    this.addChild(markers);

    // Thumb — more visible with gradient-like effect
    this.thumb = new Graphics();
    // Outer ring
    this.thumb.circle(0, 0, this.thumbRadius)
      .fill({ color: 0x556677, alpha: 0.6 })
      .stroke({ color: 0x8899aa, alpha: 0.5, width: 1.5 });
    // Inner bright spot
    this.thumb.circle(0, -this.thumbRadius * 0.15, this.thumbRadius * 0.6)
      .fill({ color: 0x99aabb, alpha: 0.4 });
    // Center dot
    this.thumb.circle(0, 0, this.thumbRadius * 0.2)
      .fill({ color: 0xbbccdd, alpha: 0.5 });
    this.addChild(this.thumb);

    this.eventMode = 'static';
    this.hitArea = {
      contains: (x: number, y: number) => {
        return x * x + y * y <= (this.baseRadius * 1.5) ** 2;
      },
    };

    this.on('pointerdown', this.onDown, this);
    this.on('globalpointermove', this.onMove, this);
    this.on('pointerup', this.onUp, this);
    this.on('pointerupoutside', this.onUp, this);
  }

  /** Remove event listeners to prevent memory leaks on scene change. */
  override destroy(): void {
    this.off('pointerdown', this.onDown, this);
    this.off('globalpointermove', this.onMove, this);
    this.off('pointerup', this.onUp, this);
    this.off('pointerupoutside', this.onUp, this);
    super.destroy({ children: true });
  }

  private onDown(e: FederatedPointerEvent): void {
    this.pointerId = e.pointerId;
    this.active = true;
    this.activeGlow.alpha = 1;
    this.updateThumb(e);
  }

  private onMove(e: FederatedPointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.updateThumb(e);
  }

  private onUp(e: FederatedPointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.active = false;
    this.activeGlow.alpha = 0;
    // Smooth return to center
    this.animateThumbReturn();
    this.direction = { x: 0, y: 0 };
    this.magnitude = 0;
  }

  private returning = false;

  private animateThumbReturn(): void {
    this.returning = true;
  }

  /**
   * Call from game loop ticker each frame to animate thumb return.
   * Replaces recursive requestAnimationFrame for synchronization.
   */
  update(): void {
    if (!this.returning) return;
    this.thumb.x += (0 - this.thumb.x) * 0.35;
    this.thumb.y += (0 - this.thumb.y) * 0.35;
    if (Math.abs(this.thumb.x) <= 0.5 && Math.abs(this.thumb.y) <= 0.5) {
      this.thumb.x = 0;
      this.thumb.y = 0;
      this.returning = false;
    }
  }

  private updateThumb(e: FederatedPointerEvent): void {
    const local = this.toLocal(e.global);
    const dist = Math.sqrt(local.x * local.x + local.y * local.y);
    const maxDist = this.baseRadius;

    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(local.y, local.x);

    this.thumb.x = Math.cos(angle) * clampedDist;
    this.thumb.y = Math.sin(angle) * clampedDist;

    this.magnitude = clampedDist / maxDist;
    if (this.magnitude < this.deadzone) {
      this.magnitude = 0;
      this.direction = { x: 0, y: 0 };
    } else {
      this.direction = { x: Math.cos(angle), y: Math.sin(angle) };
    }

    // Pulse glow intensity based on magnitude
    this.activeGlow.alpha = 0.3 + this.magnitude * 0.7;
  }
}
