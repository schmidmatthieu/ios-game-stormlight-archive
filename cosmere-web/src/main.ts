import { Application } from 'pixi.js';
import { SceneRouter } from './game/SceneRouter';
import { gameData } from './data/DataLoader';
import { MainMenuScene } from './scenes/MainMenuScene';

async function boot() {
  const loadingFill = document.getElementById('loadingFill') as HTMLDivElement;

  // Load game data
  await gameData.loadAll((pct) => {
    loadingFill.style.width = `${Math.floor(pct * 80)}%`;
  });

  // Initialize PixiJS
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundColor: 0x0a0a1a,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  loadingFill.style.width = '100%';

  // Add canvas to DOM
  document.body.appendChild(app.canvas);

  // Remove loading screen
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.transition = 'opacity 0.5s';
    loadingEl.style.opacity = '0';
    setTimeout(() => loadingEl.remove(), 500);
  }

  // Scene router
  const router = new SceneRouter(app);

  // Game loop — update current scene
  app.ticker.add((ticker) => {
    const scene = router.scene;
    if (scene?.update) {
      scene.update(ticker.deltaTime);
    }
  });

  // Start with main menu
  router.goto(MainMenuScene);
}

boot().catch(console.error);

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — offline mode unavailable
    });
  });
}
