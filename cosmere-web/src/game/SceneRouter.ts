import { Application, Container } from 'pixi.js';

export type SceneConstructor = new (app: Application, router: SceneRouter) => GameScene;

export interface GameScene extends Container {
  onEnter?(): void;
  onExit?(): void;
  update?(dt: number): void;
}

export class SceneRouter {
  private app: Application;
  private currentScene: GameScene | null = null;

  constructor(app: Application) {
    this.app = app;
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
    this.app.stage.addChild(scene);
    scene.onEnter?.();
  }

  get scene(): GameScene | null {
    return this.currentScene;
  }
}
