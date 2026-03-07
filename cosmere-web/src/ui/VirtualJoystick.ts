import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';

export class VirtualJoystick extends Container {
  private base: Graphics;
  private thumb: Graphics;
  private baseRadius = 50;
  private thumbRadius = 20;
  private deadzone = 0.1;

  // Output
  direction: { x: number; y: number } = { x: 0, y: 0 };
  magnitude = 0;
  active = false;

  private pointerId: number | null = null;

  constructor() {
    super();

    // Base circle
    this.base = new Graphics();
    this.base.circle(0, 0, this.baseRadius)
      .fill({ color: 0xffffff, alpha: 0.08 })
      .stroke({ color: 0xffffff, alpha: 0.2, width: 2 });
    this.addChild(this.base);

    // Thumb
    this.thumb = new Graphics();
    this.thumb.circle(0, 0, this.thumbRadius).fill({ color: 0xffffff, alpha: 0.25 });
    this.addChild(this.thumb);

    this.eventMode = 'static';
    this.hitArea = { contains: (x: number, y: number) => {
      return x * x + y * y <= (this.baseRadius * 1.5) ** 2;
    }};

    this.on('pointerdown', this.onDown, this);
    this.on('globalpointermove', this.onMove, this);
    this.on('pointerup', this.onUp, this);
    this.on('pointerupoutside', this.onUp, this);
  }

  private onDown(e: FederatedPointerEvent): void {
    this.pointerId = e.pointerId;
    this.active = true;
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
    this.thumb.x = 0;
    this.thumb.y = 0;
    this.direction = { x: 0, y: 0 };
    this.magnitude = 0;
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
  }
}
