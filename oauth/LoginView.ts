import { api } from '@/api/client';
import { session } from '@/state/session';

export function LoginView() {
  return `
    <div class="login-wrapper">
      <div class="login-container">
        <a href="#/" style="text-decoration: none;">
          <h1 class="login-main-title">TRANSCENDENCE<br><span>PONG 3D</span></h1>
        </a>
        <div class="login-card">
          <h2>Please Login</h2>
          <form id="login-form" method="post" novalidate>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter email" required />

            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter password" required />

            <button type="submit" class="login-btn">Login</button>

            <!-- Official Google button will render here -->
            <div
              id="google-oauth"
              style="margin-top:14px; padding:0; border:0; background:transparent; box-shadow:none; line-height:0; display:flex; justify-content:center; width:100%;"
            ></div>
          </form>

          <p class="register-text">
            Don't have an account? <a href="#/register">Register</a>
          </p>

          <div id="login-error" style="display: none;" class="login-error"></div>
        </div>
      </div>
    </div>
  `;
}

export function initLoginHandlers() {
  const form = document.getElementById('login-form') as HTMLFormElement | null;
  const errorEl = document.getElementById('login-error');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
      const data = new FormData(form);
      const email = String(data.get('email'));
      const password = String(data.get('password'));
      try {
        const res = await api.login({ email, password });
        if (res?.token && res?.user) {
          session.setAuth(res.token, res.user);
          location.hash = '#/dashboard';
          return;
        }
      } catch (err: any) {
        if (err.message?.toLowerCase().includes('2fa')) {
          sessionStorage.setItem('pendingEmail', email);
          location.hash = '#/login-2fa';
          return;
        }
        if (errorEl) {
          errorEl.textContent = err.message || 'Login failed';
          errorEl.style.display = 'block';
        }
      }
    });
  }

  // Google OAuth button
  const googleBtnEl = document.getElementById('google-oauth') as HTMLDivElement | null;
  if (googleBtnEl) {
    Object.assign(googleBtnEl.style, {
      padding: '0',
      border: '0',
      background: 'transparent',
      boxShadow: 'none',
      lineHeight: '0',
      overflow: 'visible',
      visibility: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    });

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Missing VITE_GOOGLE_CLIENT_ID');
      return;
    }

    ensureGoogleScript()
      .then(() => {
        const w = window as any;
        const googleId = w.google?.accounts?.id;
        if (!googleId) {
          console.error('Google Identity Services not available');
          return;
        }

        if (!w.__gisInitialized) {
          googleId.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              const idToken = response?.credential;
              if (!idToken) return;
              try {
                const res = await api.oauthGoogle(idToken);
                if (res?.token && res?.user) {
                  session.setAuth(res.token, res.user);
                  location.hash = '#/dashboard';
                }
              } catch (err: any) {
                alert(err?.message || 'Google login failed');
              }
            },
          });
          w.__gisInitialized = true;
        }

        googleBtnEl.innerHTML = '';
        googleId.renderButton(googleBtnEl, {
          theme: 'filled_white',
          size: 'large',
          text: 'signin_with',
          shape: 'rect',
          logo_alignment: 'left',
          width: 260,
          locale: 'en',
        });

        googleBtnEl.style.visibility = 'visible';
      })
      .catch((e) => {
        console.error('Failed to load Google Identity Services', e);
      });
  }
}

function ensureGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.google?.accounts?.id) {
      resolve();
      return;
    }
    let script = document.querySelector('script[data-gis]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-gis', '1');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('GIS script failed to load'));
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error('GIS script error')));
    }
  });
}
