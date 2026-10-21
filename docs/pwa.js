// Trove: installable app. Registers the service worker and shows "Install the app" where the browser allows it.
(() => {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const zh = () => (document.documentElement.lang || '').startsWith('zh');
  let deferred = null;
  const buttons = () => document.querySelectorAll('[data-install]');
  const show = on => buttons().forEach(b => { b.hidden = !on; });

  // Chrome, Edge, Samsung Internet and Android: the browser hands us its install prompt.
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; show(true); });
  addEventListener('appinstalled', () => { deferred = null; show(false); });
  // iPhone and iPad have no install prompt; people add it from the Share menu, so we show how.
  if (ios && !standalone) addEventListener('DOMContentLoaded', () => show(true));

  function iosTip() {
    if (document.getElementById('installTip')) return;
    const tip = document.createElement('div');
    tip.id = 'installTip'; tip.setAttribute('role', 'dialog'); tip.setAttribute('aria-label', 'Install Trove');
    tip.style.cssText = 'position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9999;max-width:420px;margin:0 auto;'
      + 'background:#fff;color:#1f2328;border:1px solid #f3dcc6;border-radius:14px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.15);font:15px/1.45 system-ui,sans-serif';
    tip.innerHTML = zh()
      ? '<b>安装 Trove</b><br>点按 Safari 的“分享”按钮，然后选择“添加到主屏幕”。'
      : '<b>Install Trove</b><br>Tap Safari\'s <b>Share</b> button, then <b>Add to Home Screen</b>.';
    const x = document.createElement('button');
    x.type = 'button'; x.textContent = zh() ? '知道了' : 'Got it';
    x.style.cssText = 'display:block;margin-top:10px;padding:8px 14px;border:0;border-radius:999px;background:#ffcb98;color:#3b2410;font:inherit;font-weight:700;cursor:pointer';
    x.onclick = () => tip.remove();
    tip.appendChild(x); document.body.appendChild(tip); x.focus();
  }

  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-install]');
    if (!b) return;
    e.preventDefault();
    const menu = b.closest('details'); if (menu) menu.open = false;
    if (deferred) { deferred.prompt(); const r = await deferred.userChoice.catch(() => null); deferred = null; if (r && r.outcome === 'accepted') show(false); }
    else if (ios) iosTip();
  });
})();
