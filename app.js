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

const comparison = document.querySelector('.comparison');
const compareSlider = document.getElementById('compare-slider');
function updateComparison() {
  comparison.style.setProperty('--split', `${compareSlider.value}%`);
  compareSlider.setAttribute('aria-valuetext', `原图区域 ${compareSlider.value}%，效果区域 ${100 - Number(compareSlider.value)}%`);
}
compareSlider.addEventListener('input', updateComparison);
updateComparison();
document.querySelectorAll('.effect-preset').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.effect-preset').forEach(item => {
      item.classList.toggle('is-active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    comparison.dataset.look = button.dataset.look;
    comparison.querySelector('.tag-after').textContent = `${button.textContent}示意`;
  });
});
// The range is the keyboard control; the photo itself also supports pointer dragging.
comparison.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  comparison.setPointerCapture(event.pointerId);
  dragComparison(event);
});
comparison.addEventListener('pointermove', event => {
  if (comparison.hasPointerCapture(event.pointerId)) dragComparison(event);
});
function dragComparison(event) {
  const bounds = comparison.getBoundingClientRect();
  compareSlider.value = Math.round(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)));
  updateComparison();
}

// A deliberately labelled browser simulation, never a real camera connection.
const monitor = document.getElementById('monitor-screen');
const focusTarget = monitor.querySelector('.focus-target');
let focusTimer;
let focusPosition = 0;
function moveFocus(x, y) {
  focusTarget.style.left = `${Math.max(12, Math.min(88, x))}%`;
  focusTarget.style.top = `${Math.max(20, Math.min(73, y))}%`;
  focusTarget.classList.add('focusing');
  clearTimeout(focusTimer);
  focusTimer = setTimeout(() => focusTarget.classList.remove('focusing'), 320);
}
monitor.addEventListener('click', event => {
  if (event.target.closest('.focus-target')) return;
  const bounds = monitor.getBoundingClientRect();
  moveFocus((event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
});
focusTarget.addEventListener('click', event => {
  event.stopPropagation();
  const positions = [[33, 40], [66, 40], [50, 55]];
  const [x, y] = positions[focusPosition++ % positions.length];
  moveFocus(x, y);
});
[['toggle-grid', 'no-grid'], ['toggle-info', 'no-info']].forEach(([id, className]) => {
  const button = document.getElementById(id);
  button.addEventListener('click', () => {
    const hidden = monitor.classList.toggle(className);
    button.setAttribute('aria-pressed', String(!hidden));
  });
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
