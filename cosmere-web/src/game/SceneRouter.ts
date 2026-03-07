import { Application, Container } from 'pixi.js';
import { getLayoutInfo } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

export type SceneConstructor = new (app: Application, router: SceneRouter) => GameScene;

export interface GameScene extends Container {
  onEnter?(): void;
  onExit?(): void;
  update?(dt: number): void;
  /** Appelé quand la taille de l'écran change (rotation, redimensionnement) */
  onResize?(layout: LayoutInfo): void;
}

export class SceneRouter {
  private app: Application;
  private currentScene: GameScene | null = null;
  private currentSceneClass: SceneConstructor | null = null;

  constructor(app: Application) {
    this.app = app;

    // Écouter les redimensionnements
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 150);
    });
  }

  async goto(SceneClass: SceneConstructor, ...args: unknown[]): Promise<void> {
    // Remove current scene
    if (this.currentScene) {
      this.currentScene.onExit?.();
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
    }

    // Create new scene
    const scene = new SceneClass(this.app, this);
    this.currentScene = scene;
    this.currentSceneClass = SceneClass;
    this.app.stage.addChild(scene);
    scene.onEnter?.();
  }

  get scene(): GameScene | null {
    return this.currentScene;
  }

  get layout(): LayoutInfo {
    return getLayoutInfo(this.app.screen.width, this.app.screen.height);
  }

  private handleResize(): void {
    if (this.currentScene?.onResize) {
      this.currentScene.onResize(this.layout);
    } else if (this.currentScene && this.currentSceneClass) {
      // Si la scène ne supporte pas onResize, la recréer
      this.goto(this.currentSceneClass);
    }
  }
}
