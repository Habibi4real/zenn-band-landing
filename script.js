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
thankYou.querySelector('.dialog-later').addEventListener('click', () => thankYou.close());
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
