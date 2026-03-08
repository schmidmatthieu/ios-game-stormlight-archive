// ─── Auth Panel — Login / Register UI ────────────────────────────
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CloudSaveManager } from '../game/CloudSaveManager';
import { getLayoutInfo, fontSize, scaled, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from './ResponsiveLayout';

type AuthMode = 'login' | 'register';

export function showAuthPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
  onSuccess: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const panel = new Container();
  panel.zIndex = 10000;

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  const radius = panelRadius(layout);
  const panelW = Math.min(scaled(320, layout), screenW - 30);
  const panelH = scaled(340, layout);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const bg = new Graphics();
  bg.roundRect(px, py, panelW, panelH, radius + 2)
    .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.97 })
    .stroke({ color: UI_COLORS.borderGold, width: 2, alpha: 0.8 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  let mode: AuthMode = 'login';

  // Since PixiJS doesn't have text inputs, we use HTML overlays for form fields
  const formContainer = document.createElement('div');
  formContainer.style.cssText = `
    position: fixed; z-index: 100000;
    left: ${px + 20}px; top: ${py + 60}px;
    width: ${panelW - 40}px;
    display: flex; flex-direction: column; gap: 10px;
  `;

  const inputStyle = `
    width: 100%; padding: 10px; border-radius: 6px;
    border: 1px solid #665522; background: #1a1a2e;
    color: #e0d0b0; font-size: 14px; font-family: sans-serif;
    outline: none; box-sizing: border-box;
  `;

  const usernameInput = document.createElement('input');
  usernameInput.placeholder = 'Pseudo';
  usernameInput.style.cssText = inputStyle;
  usernameInput.autocomplete = 'username';

  const emailInput = document.createElement('input');
  emailInput.placeholder = 'Email';
  emailInput.type = 'email';
  emailInput.style.cssText = inputStyle;
  emailInput.autocomplete = 'email';

  const passwordInput = document.createElement('input');
  passwordInput.placeholder = 'Mot de passe';
  passwordInput.type = 'password';
  passwordInput.style.cssText = inputStyle;
  passwordInput.autocomplete = 'current-password';

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'color: #cc4444; font-size: 12px; min-height: 16px; text-align: center;';

  const submitBtn = document.createElement('button');
  submitBtn.style.cssText = `
    width: 100%; padding: 12px; border-radius: 8px;
    border: 1px solid #665522; background: #33264d;
    color: #e6cc66; font-size: 16px; font-family: Georgia, serif;
    font-weight: bold; cursor: pointer;
  `;

  const toggleLink = document.createElement('div');
  toggleLink.style.cssText = `
    text-align: center; color: #776644; font-size: 12px; cursor: pointer;
    text-decoration: underline;
  `;

  function updateFormMode(): void {
    if (mode === 'login') {
      emailInput.style.display = 'none';
      usernameInput.placeholder = 'Pseudo ou email';
      usernameInput.autocomplete = 'username';
      submitBtn.textContent = 'Se connecter';
      toggleLink.textContent = 'Pas encore de compte ? S\'inscrire';
    } else {
      emailInput.style.display = '';
      usernameInput.placeholder = 'Pseudo';
      submitBtn.textContent = 'Créer un compte';
      toggleLink.textContent = 'Déjà un compte ? Se connecter';
    }
    errorDiv.textContent = '';
  }

  toggleLink.addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login';
    updateFormMode();
  });

  submitBtn.addEventListener('click', async () => {
    errorDiv.textContent = '';
    submitBtn.textContent = '...';
    submitBtn.style.opacity = '0.6';

    try {
      const cloud = CloudSaveManager.shared;
      let result: { ok: boolean; error?: string };

      if (mode === 'login') {
        result = await cloud.login(usernameInput.value, passwordInput.value);
      } else {
        result = await cloud.register(usernameInput.value, emailInput.value, passwordInput.value);
      }

      if (result.ok) {
        cleanup();
        onSuccess();
      } else {
        errorDiv.textContent = result.error ?? 'Erreur inconnue';
      }
    } catch (err) {
      errorDiv.textContent = 'Impossible de contacter le serveur';
    }

    updateFormMode();
    submitBtn.style.opacity = '1';
  });

  formContainer.appendChild(usernameInput);
  formContainer.appendChild(emailInput);
  formContainer.appendChild(passwordInput);
  formContainer.appendChild(errorDiv);
  formContainer.appendChild(submitBtn);
  formContainer.appendChild(toggleLink);
  document.body.appendChild(formContainer);
  updateFormMode();

  // Title in Pixi
  const title = new Text({
    text: 'Compte Cosmere',
    style: new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: fontSize(18, layout),
      fill: UI_COLORS.textGold, fontWeight: 'bold',
    }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + scaled(28, layout);
  panel.addChild(title);

  // Close button
  const closeBtnSize = scaled(24, layout);
  const closeBtn = new Graphics();
  closeBtn.circle(px + panelW - 18, py + 18, closeBtnSize / 2)
    .fill({ color: UI_COLORS.btnDanger, alpha: 0.8 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', () => { cleanup(); onClose(); });
  panel.addChild(closeBtn);

  const closeX = new Text({
    text: 'X',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: 0xffffff, fontWeight: 'bold' }),
  });
  closeX.anchor.set(0.5);
  closeX.x = px + panelW - 18;
  closeX.y = py + 18;
  panel.addChild(closeX);

  function cleanup(): void {
    if (formContainer.parentNode) document.body.removeChild(formContainer);
    if (panel.parent) panel.parent.removeChild(panel);
  }

  // Ensure cleanup on external close
  panel.on('destroyed', cleanup);

  uiContainer.addChild(panel);
  return panel;
}

// ─── User Status Widget (for main menu) ──────────────────────────

export function createUserWidget(
  screenW: number, screenH: number,
  onLoginClick: () => void,
  onLogoutClick: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const container = new Container();

  const cloud = CloudSaveManager.shared;

  if (cloud.isLoggedIn && cloud.user) {
    // Logged in — show username
    const userText = new Text({
      text: `${cloud.user.username}`,
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: fontSize(10, layout),
        fill: 0x88cc88,
      }),
    });
    userText.anchor.set(1, 0);
    userText.x = screenW - scaled(16, layout);
    userText.y = scaled(10, layout);
    container.addChild(userText);

    const logoutText = new Text({
      text: 'Déconnexion',
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: fontSize(8, layout),
        fill: 0x776644,
      }),
    });
    logoutText.anchor.set(1, 0);
    logoutText.x = screenW - scaled(16, layout);
    logoutText.y = scaled(24, layout);
    logoutText.eventMode = 'static';
    logoutText.cursor = 'pointer';
    logoutText.on('pointerdown', onLogoutClick);
    container.addChild(logoutText);
  } else {
    // Not logged in — show login button
    const loginText = new Text({
      text: 'Se connecter',
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: fontSize(10, layout),
        fill: 0x776644,
      }),
    });
    loginText.anchor.set(1, 0);
    loginText.x = screenW - scaled(16, layout);
    loginText.y = scaled(10, layout);
    loginText.eventMode = 'static';
    loginText.cursor = 'pointer';
    loginText.on('pointerdown', onLoginClick);
    container.addChild(loginText);
  }

  return container;
}
