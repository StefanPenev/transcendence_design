import './styles.css';
import { Router } from './router';
import { DashboardView, initDashboardHandlers } from './views/DashboardView';
import { LoginView, initLoginHandlers } from './views/LoginView';
import { RegisterView, initRegisterHandlers } from './views/RegisterView';
import { TwoFALoginVerifyView, initTwoFALoginHandlers } from './views/TwoFAVerifyView';
import { TwoFASetupView, initTwoFASetupHandlers } from './views/TwoFASetupView';
import { ChangePasswordView, initChangePasswordHandlers } from './views/ChangePasswordView';
import { FriendsView, initFriendsHandlers } from './views/FriendsView';
import { LandingView, initLandingHandlers } from './views/LandingView';
import { GameView, initGameHandlers, cleanupGame } from './views/GameView';

//NEW CODE
import { api } from '@/api/client';
import { session } from '@/state/session';

const app = document.getElementById('app')!;
const router = new Router(app);

function mount(html: string) {
  app.innerHTML = html;
}

// Landing page at '/'
router.register({
  path: /^\/$/,
  title: 'Welcome',
  render: () => {
    const html = LandingView();
    queueMicrotask(initLandingHandlers);
    return html;
  },
});

// Keep Dashboard under '/dashboard'
router.register({
  path: /^\/dashboard$/,
  title: 'Dashboard',
  render: () => {
    const html = DashboardView();
    queueMicrotask(initDashboardHandlers);
    return html;
  },
});

router.register({
  path: /^\/login$/,
  title: 'Login',
  render: () => {
    const html = LoginView();
    // queueMicrotask(initLoginHandlers);
    setTimeout(initLoginHandlers, 0);
    return html;
  },
});

router.register({
  path: /^\/register$/,
  title: 'Register',
  render: () => {
    const html = RegisterView();
    queueMicrotask(initRegisterHandlers);
    return html;
  },
});

router.register({
  path: /^\/login-2fa$/,
  title: '2FA Verify',
  render: () => {
    const html = TwoFALoginVerifyView();
    queueMicrotask(initTwoFALoginHandlers);
    return html;
  },
});

router.register({
  path: /^\/twofa$/,
  title: '2FA',
  render: () => {
    const html = TwoFASetupView();
    queueMicrotask(initTwoFASetupHandlers);
    return html;
  },
});

router.register({
  path: /^\/change-password$/,
  title: 'Change Password',
  render: () => {
    const html = ChangePasswordView();
    queueMicrotask(initChangePasswordHandlers);
    return html;
  },
});

router.register({
  path: /^\/friends$/,
  title: 'Friends',
  render: () => {
    const html = FriendsView();
    queueMicrotask(initFriendsHandlers);
    return html;
  },
});

router.register({
  path: /^\/game$/,
  title: 'Pong Game',
  render: () => {
    const html = GameView();
    queueMicrotask(initGameHandlers);
    return html;
  },
  cleanup: cleanupGame,
});

// Navigate to current route on first load
router.navigate();

// NEW CODE
// -------------------- GOOGLE SIGN-IN INIT --------------------
// This tells TypeScript that the global `window` object
// can have a `google` property provided by the Google Identity Services SDK.
// Without this, TypeScript would complain that `window.google` doesn't exist.
declare global {
  interface Window {
    google: any;
  }
}

// This function initializes the Google One Tap / Sign-In SDK
// and sets up the callback to handle the login response.
export async function initGoogleSignIn() {
  // Get the Google Client ID from environment variables.
  // `import.meta.env` is provided by Vite for reading `.env` values at build time.
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Ensure the Google SDK has been loaded before using it.
  if (!window.google) {
    console.warn('Google SDK not yet loaded');
    return;
  }

  // Initialize the Google Identity client with app’s client ID
  // and define what happens when the user successfully logs in.
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: async (response: any) => {
      const idToken = response.credential;
      try {
        const res = await api.oauthGoogle(idToken);
        if (res?.token && res?.user) {
          session.setAuth(res.token, res.user);
          location.hash = '#/dashboard';
        }
      } catch (err: any) {
        alert(err.message || 'Google login failed');
      }
    },
  });
}

// This ensures that the Google Sign-In process is ready
// as soon as your app starts up or the page is refreshed.
initGoogleSignIn();
