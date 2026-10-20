document.getElementById('year').textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
const closeMenu = () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
};
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => {
  if (nav.classList.contains('open') && !event.target.closest('.site-header')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu();
    menuButton.focus();
  }
});

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
let busyMotionFrame = 0;
const busyDistance = () => {
  const first = busyCards.querySelector('.busy-card');
  const gap = parseFloat(getComputedStyle(busyCards).gap) || 0;
  return first.getBoundingClientRect().width + gap;
};
const jumpBusyTo = index => {
  busyCards.style.scrollBehavior = 'auto';
  busyCards.style.scrollSnapType = 'none';
  busyCards.scrollLeft = index * busyDistance();
  requestAnimationFrame(() => {
    busyCards.style.scrollBehavior = '';
    busyCards.style.scrollSnapType = '';
  });
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
  cancelAnimationFrame(busyMotionFrame);
  busyIndex += direction;
  const from = busyCards.scrollLeft;
  const to = busyIndex * busyDistance();
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 720;
  const started = performance.now();
  busyCards.style.scrollBehavior = 'auto';
  busyCards.style.scrollSnapType = 'none';
  const frame = now => {
    const progress = duration ? Math.min(1, (now - started) / duration) : 1;
    const eased = 1 - Math.pow(1 - progress, 3);
    busyCards.scrollLeft = from + (to - from) * eased;
    if (progress < 1) {
      busyMotionFrame = requestAnimationFrame(frame);
    } else {
      busyMotionFrame = 0;
      busyCards.scrollLeft = to;
      settleBusy();
      busyCards.style.scrollBehavior = '';
      busyCards.style.scrollSnapType = '';
    }
  };
  busyMotionFrame = requestAnimationFrame(frame);
};
const scheduleBusyAuto = () => {
  clearTimeout(busyAutoTimer);
  if (!busyInView || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  busyAutoTimer = setTimeout(() => { moveBusy(1); scheduleBusyAuto(); }, 4000);
};
busyPrevious.addEventListener('click', () => { moveBusy(-1); scheduleBusyAuto(); });
busyNext.addEventListener('click', () => { moveBusy(1); scheduleBusyAuto(); });
busyCards.addEventListener('pointerdown', scheduleBusyAuto);
busyCards.addEventListener('scroll', () => {
  if (busyMotionFrame) return;
  clearTimeout(busySettleTimer);
  busySettleTimer = setTimeout(settleBusy, 180);
}, { passive: true });
window.addEventListener('resize', () => {
  cancelAnimationFrame(busyMotionFrame);
  busyMotionFrame = 0;
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
const integrationDialog = document.getElementById('integration-dialog');
const integrationName = document.getElementById('integration-name');
let integrationShift = 0;
const positionIntegrationDialog = () => {
  if (!integrationDialog.open || !integrationDialog.classList.contains('field-focused') || !mobileViewport.matches) return;
  const viewport = window.visualViewport;
  const visibleTop = viewport?.offsetTop || 0;
  const visibleBottom = visibleTop + (viewport?.height || innerHeight);
  const inputBottom = integrationName.getBoundingClientRect().bottom + integrationShift;
  const dialogTop = integrationDialog.getBoundingClientRect().top + integrationShift;
  const neededShift = Math.max(0, inputBottom - visibleBottom + 24);
  const availableShift = Math.max(0, dialogTop - visibleTop - 12);
  integrationShift = Math.min(neededShift, availableShift);
  integrationDialog.style.transform = `translateY(-${integrationShift}px)`;
  if (neededShift > availableShift) integrationDialog.scrollTop += neededShift - availableShift;
};
document.querySelector('.suggest-integration').addEventListener('click', () => {
  document.getElementById('integration-form').reset();
  document.getElementById('integration-status').textContent = '';
  document.body.classList.add('modal-open');
  integrationDialog.showModal();
});
integrationName.addEventListener('focus', () => {
  if (!mobileViewport.matches) return;
  integrationDialog.classList.add('field-focused');
  positionIntegrationDialog();
});
window.visualViewport?.addEventListener('resize', positionIntegrationDialog);
window.visualViewport?.addEventListener('scroll', positionIntegrationDialog);
window.addEventListener('resize', positionIntegrationDialog);
integrationDialog.querySelector('.dialog-close').addEventListener('click', () => integrationDialog.close());
integrationDialog.addEventListener('close', () => {
  integrationDialog.classList.remove('field-focused');
  integrationDialog.style.transform = '';
  integrationShift = 0;
  document.body.classList.remove('modal-open');
});
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

const integrationForm = document.getElementById('integration-form');
integrationForm.addEventListener('submit', async event => {
  event.preventDefault();
  const integration = document.getElementById('integration-name').value.trim();
  const integrationStatus = document.getElementById('integration-status');
  const button = integrationForm.querySelector('button[type="submit"]');
  integrationStatus.className = 'form-status';
  if (!integration) {
    integrationStatus.textContent = 'Please name an app or service.';
    integrationStatus.classList.add('error');
    return;
  }
  button.disabled = true;
  integrationStatus.textContent = 'Sending…';
  try {
    await postWaitlist({ mode: 'integration', integration });
    integrationStatus.textContent = 'Thanks! Your suggestion has been saved.';
    integrationStatus.classList.add('success');
    integrationForm.reset();
  } catch (error) {
    integrationStatus.textContent = error.message;
    integrationStatus.classList.add('error');
  } finally {
    button.disabled = false;
  }
});
