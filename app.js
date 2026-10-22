'use strict';
// Native scrolling and local assets keep the landing page independent of a CDN.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', '打开导航');
  navLinks.classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  menu.setAttribute('aria-label', expanded ? '关闭导航' : '打开导航');
  navLinks.classList.toggle('is-open', expanded);
});
navLinks.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
});
document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);

// Complete keyboard tab behavior, with no automatic cycling or scroll hijacking.
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const activate = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (list.classList.contains('connection-options')) document.querySelector('.connection-visual').dataset.mode = tab.id.replace('connect-', '');
  };
  activate(tabs[0]);
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      const vertical = list.getAttribute('aria-orientation') === 'vertical';
      let target;
      if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) target = tabs[(index + 1) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (target) { event.preventDefault(); activate(target); target.focus(); }
    });
  });
});

// Real, unretouched App captures; enlarge the same CSS crop without simulating controls.
const screenshotDialog = document.querySelector('.screenshot-dialog');
const screenshotBody = screenshotDialog.querySelector('.screenshot-dialog-body');
const screenshotTitle = document.getElementById('screenshot-title');
let screenshotTrigger;
document.querySelectorAll('[data-screenshot]').forEach(button => {
  button.addEventListener('click', () => {
    screenshotTrigger = button;
    screenshotTitle.textContent = button.dataset.caption;
    const crop = button.querySelector('.app-crop').cloneNode(true);
    crop.querySelector('img').loading = 'eager';
    screenshotBody.replaceChildren(crop);
    screenshotDialog.showModal();
    document.body.classList.add('screenshot-open');
  });
});
screenshotDialog.querySelector('.screenshot-close').addEventListener('click', () => screenshotDialog.close());
screenshotDialog.addEventListener('click', event => {
  if (event.target !== screenshotDialog) return;
  const bounds = screenshotDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) screenshotDialog.close();
});
screenshotDialog.addEventListener('close', () => {
  document.body.classList.remove('screenshot-open');
  screenshotTrigger?.focus({ preventScroll: true });
});

const copyStatus = document.querySelector('.copy-status');
let copyTimer;
document.querySelector('.copy-contact').addEventListener('click', async event => {
  const button = event.currentTarget;
  try { await navigator.clipboard.writeText(button.dataset.copy); copyStatus.textContent = '已复制'; }
  catch { copyStatus.textContent = '请长按号码复制'; }
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copyStatus.textContent = ''; }, 4000);
});
document.getElementById('year').textContent = new Date().getFullYear();
document.documentElement.classList.add('has-js');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: .06, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
  if (!reducedMotion.matches) document.body.classList.add('motion-ready');
  const visualObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
  }, { threshold: .1 });
  visualObserver.observe(document.querySelector('.connection-visual'));
}
document.addEventListener('visibilitychange', () => document.body.classList.toggle('page-hidden', document.hidden));
reducedMotion.addEventListener('change', event => { if (event.matches) document.body.classList.remove('motion-ready'); });
