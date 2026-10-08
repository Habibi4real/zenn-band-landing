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

const storyRail = document.querySelector('.card-rail');
document.querySelectorAll('[data-rail]').forEach(button => button.addEventListener('click', () => {
  const direction = button.dataset.rail === 'next' ? 1 : -1;
  const card = storyRail.querySelector('.story-card');
  storyRail.scrollBy({ left: direction * (card.getBoundingClientRect().width + 8), behavior: 'smooth' });
}));

const form = document.getElementById('waitlist-form');
const status = document.getElementById('form-status');
const submit = form.querySelector('button[type="submit"]');
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
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
    status.textContent = 'You’re on the list. We’ll be in touch.';
    status.classList.add('success');
    form.reset();
  } catch (error) {
    status.textContent = `${error.message} You can join by email instead: `;
    const link = document.createElement('a');
    link.href = `mailto:contact.zennapp@gmail.com?subject=${encodeURIComponent('Join Zenn Band waitlist')}&body=${encodeURIComponent(`Please add ${email} to the Zenn Band waitlist.`)}`;
    link.textContent = 'Send email ↗';
    link.style.textDecoration = 'underline';
    status.append(link);
    status.classList.add('error');
  } finally {
    submit.disabled = false;
  }
});
