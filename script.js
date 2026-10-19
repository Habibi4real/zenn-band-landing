document.getElementById('year').textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}));

const heroJoin = document.querySelector('.hero-actions a[href="#early-access"]');
const floatingJoin = document.createElement('a');
floatingJoin.className = 'mobile-floating-cta';
floatingJoin.href = heroJoin.href;
floatingJoin.textContent = 'Join Waitlist';
floatingJoin.hidden = true;
document.body.append(floatingJoin);
const mobileViewport = matchMedia('(max-width: 720px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let floatingActive = false;
let floatingFrame = 0;
let floatingRect;
let floatingFrameTime = 0;
const placeFloatingJoin = rect => {
  floatingJoin.style.left = `${rect.left}px`;
  floatingJoin.style.top = `${rect.top}px`;
  floatingJoin.style.width = `${rect.width}px`;
  floatingJoin.style.height = `${rect.height}px`;
};
const floatingCorner = () => ({ left: innerWidth - 142, top: 12, width: 124, height: 42 });
const heroJoinRect = () => {
  const { left, top, width, height } = heroJoin.getBoundingClientRect();
  return { left, top, width, height };
};
const updateFloatingContrast = () => {
  const darkSection = [...document.querySelectorAll('.hero,.actions-panel,.apps-panel,footer.tile')]
    .some(section => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 33 && rect.bottom > 33;
    });
  floatingJoin.classList.toggle('over-dark', darkSection);
};
const animateFloatingJoin = now => {
  floatingFrame = 0;
  if (floatingJoin.hidden) return;
  const target = floatingActive ? floatingCorner() : heroJoinRect();
  const elapsed = floatingFrameTime ? Math.min(now - floatingFrameTime, 48) : 16;
  floatingFrameTime = now;
  const progress = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 110);
  floatingRect = Object.fromEntries(Object.keys(target).map(key => [key, floatingRect[key] + (target[key] - floatingRect[key]) * progress]));
  placeFloatingJoin(floatingRect);
  const settled = Object.keys(target).every(key => Math.abs(target[key] - floatingRect[key]) < 1);
  if (!floatingActive && settled) {
    floatingJoin.hidden = true;
    heroJoin.style.visibility = '';
    floatingFrameTime = 0;
    return;
  }
  if (!settled || !floatingActive) floatingFrame = requestAnimationFrame(animateFloatingJoin);
};
const startFloatingAnimation = () => {
  if (!floatingFrame) floatingFrame = requestAnimationFrame(animateFloatingJoin);
};
const updateFloatingJoin = () => {
  if (!mobileViewport.matches) {
    cancelAnimationFrame(floatingFrame);
    floatingFrame = 0;
    floatingFrameTime = 0;
    floatingActive = false;
    floatingJoin.hidden = true;
    floatingJoin.classList.remove('at-corner', 'over-dark');
    heroJoin.style.visibility = '';
    return;
  }
  const source = heroJoinRect();
  const buttonBottom = source.top + source.height;
  if (!floatingActive && buttonBottom <= 115) {
    floatingActive = true;
    if (floatingJoin.hidden) {
      floatingRect = source.top + source.height > 0 ? source : floatingCorner();
      floatingJoin.hidden = false;
      placeFloatingJoin(floatingRect);
    }
    heroJoin.style.visibility = 'hidden';
    floatingJoin.classList.add('at-corner');
    startFloatingAnimation();
  } else if (floatingActive && buttonBottom >= 145) {
    floatingActive = false;
    floatingJoin.classList.remove('at-corner');
    startFloatingAnimation();
  }
  if (floatingActive) updateFloatingContrast();
  if (!floatingJoin.hidden) startFloatingAnimation();
};
window.addEventListener('scroll', updateFloatingJoin, { passive: true });
window.addEventListener('resize', () => {
  updateFloatingJoin();
});
updateFloatingJoin();

const busyCards = document.getElementById('busy-cards');
const busyCarousel = document.querySelector('.busy-carousel');
const busyPrevious = document.querySelector('.busy-arrow-prev');
const busyNext = document.querySelector('.busy-arrow-next');
const busyOriginals = [...busyCards.querySelectorAll('.busy-card')];
const busyCount = busyOriginals.length;
const cloneBusyCard = card => {
  const clone = card.cloneNode(true);
  clone.dataset.clone = 'true';
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  return clone;
};
busyCards.prepend(...busyOriginals.map(cloneBusyCard));
busyCards.append(...busyOriginals.map(cloneBusyCard));
let busyIndex = busyCount;
let busyInView = false;
let busySettleTimer;
let busyAutoTimer;
const busyDistance = () => {
  const first = busyCards.querySelector('.busy-card');
  const gap = parseFloat(getComputedStyle(busyCards).gap) || 0;
  return first.getBoundingClientRect().width + gap;
};
const jumpBusyTo = index => {
  busyCards.style.scrollBehavior = 'auto';
  busyCards.scrollLeft = index * busyDistance();
  requestAnimationFrame(() => { busyCards.style.scrollBehavior = ''; });
};
const settleBusy = () => {
  busyIndex = Math.round(busyCards.scrollLeft / busyDistance());
  if (busyIndex < busyCount || busyIndex >= busyCount * 2) {
    busyIndex = busyCount + ((busyIndex - busyCount) % busyCount + busyCount) % busyCount;
    jumpBusyTo(busyIndex);
  }
};
const moveBusy = direction => {
  clearTimeout(busySettleTimer);
  busyIndex += direction;
  busyCards.scrollTo({ left: busyIndex * busyDistance(), behavior: 'smooth' });
  busySettleTimer = setTimeout(settleBusy, 750);
};
const scheduleBusyAuto = () => {
  clearTimeout(busyAutoTimer);
  if (!busyInView || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  busyAutoTimer = setTimeout(() => { moveBusy(1); scheduleBusyAuto(); }, 5000);
};
busyPrevious.addEventListener('click', () => { moveBusy(-1); scheduleBusyAuto(); });
busyNext.addEventListener('click', () => { moveBusy(1); scheduleBusyAuto(); });
busyCards.addEventListener('pointerdown', scheduleBusyAuto);
busyCards.addEventListener('scroll', () => {
  clearTimeout(busySettleTimer);
  busySettleTimer = setTimeout(settleBusy, 180);
}, { passive: true });
window.addEventListener('resize', () => {
  busyIndex = busyCount + ((busyIndex - busyCount) % busyCount + busyCount) % busyCount;
  jumpBusyTo(busyIndex);
});
new IntersectionObserver(entries => { busyInView = entries[0].isIntersecting; scheduleBusyAuto(); }, { threshold: .25 }).observe(busyCarousel);
document.addEventListener('visibilitychange', scheduleBusyAuto);
jumpBusyTo(busyIndex);

const form = document.getElementById('waitlist-form');
const status = document.getElementById('form-status');
const submit = form.querySelector('button[type="submit"]');
const thankYou = document.getElementById('thank-you');
thankYou.querySelector('.dialog-close').addEventListener('click', () => thankYou.close());
thankYou.addEventListener('close', () => document.body.classList.remove('modal-open'));
let signupToken = null;
async function postWaitlist(payload) {
  const response = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
  return body;
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const email = String(new FormData(form).get('email') || '').trim();
  status.className = 'form-status';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.textContent = 'Please enter a valid email address.';
    status.classList.add('error');
    return;
  }
  submit.disabled = true;
  status.textContent = 'Joining…';
  try {
    const body = await postWaitlist({ email, bandInterest: true });
    signupToken = body.signupToken;
    status.textContent = 'You’re on the list.';
    status.classList.add('success');
    document.getElementById('interest-form').reset();
    document.getElementById('interest-status').textContent = '';
    document.body.classList.add('modal-open');
    thankYou.showModal();
    form.reset();
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('error');
  } finally {
    submit.disabled = false;
  }
});

const interestForm = document.getElementById('interest-form');
interestForm.addEventListener('submit', async event => {
  event.preventDefault();
  const interestStatus = document.getElementById('interest-status');
  const button = interestForm.querySelector('button[type="submit"]');
  const delegate = document.getElementById('delegate').value.trim();
  interestStatus.className = 'form-status';
  if (!delegate) {
    interestStatus.textContent = 'Add an idea to share it with us.';
    interestStatus.classList.add('error');
    return;
  }
  button.disabled = true;
  interestStatus.textContent = 'Saving…';
  try {
    await postWaitlist({ mode: 'interests', signupToken, delegate, bandInterest: true });
    interestStatus.textContent = 'Thanks. Your interests have been saved.';
    interestStatus.classList.add('success');
  } catch (error) {
    interestStatus.textContent = error.message;
    interestStatus.classList.add('error');
  } finally {
    button.disabled = false;
  }
});
