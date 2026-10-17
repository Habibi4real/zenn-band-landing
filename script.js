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

const form = document.getElementById('waitlist-form');
const status = document.getElementById('form-status');
const submit = form.querySelector('button[type="submit"]');
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
    document.getElementById('thank-you').hidden = false;
    document.getElementById('thank-you').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
