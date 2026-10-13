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

const examples = [
  { request: 'Find me a hotel in Milan under $150 and add the best option to my itinerary.', response: 'I’ll compare suitable hotels, check your itinerary, and prepare the best option for you to review.' },
  { request: 'Move tomorrow’s meetings and let everyone know.', response: 'I’ll find new times, update the calendar, and prepare messages for the people affected.' },
  { request: 'I’m still waiting for Alex to reply. Follow up tomorrow if he doesn’t.', response: 'I’ll keep track of the reply and remind you when it’s time to follow up.' },
  { request: 'Find the best running shoes for me under $150.', response: 'I’ll compare options against your budget and preferences, then show you the strongest choices.' }
];
let exampleIndex = 0;
const dots = document.getElementById('demo-dots');
const requestText = document.getElementById('demo-request');
const responseText = document.getElementById('demo-response');
function showExample(index) {
  exampleIndex = (index + examples.length) % examples.length;
  requestText.textContent = examples[exampleIndex].request;
  responseText.textContent = examples[exampleIndex].response;
  dots.querySelectorAll('button').forEach((button, i) => {
    button.classList.toggle('active', i === exampleIndex);
    button.setAttribute('aria-current', i === exampleIndex ? 'true' : 'false');
  });
}
examples.forEach((_, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', `Show example ${index + 1}`);
  button.addEventListener('click', () => showExample(index));
  dots.append(button);
});
document.getElementById('demo-prev').addEventListener('click', () => showExample(exampleIndex - 1));
document.getElementById('demo-next').addEventListener('click', () => showExample(exampleIndex + 1));
showExample(0);

let wantsBand = false;
document.querySelectorAll('[data-band-interest]').forEach(link => link.addEventListener('click', () => {
  wantsBand = true;
  document.getElementById('band-interest').checked = true;
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
    const body = await postWaitlist({ email });
    signupToken = body.signupToken;
    status.textContent = 'You’re on the list.';
    status.classList.add('success');
    document.getElementById('band-interest').checked = wantsBand;
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
  const bandInterest = document.getElementById('band-interest').checked;
  interestStatus.className = 'form-status';
  if (!delegate && !bandInterest) {
    interestStatus.textContent = 'Add an idea or select Zenn Band to share your interests.';
    interestStatus.classList.add('error');
    return;
  }
  button.disabled = true;
  interestStatus.textContent = 'Saving…';
  try {
    await postWaitlist({ mode: 'interests', signupToken, delegate, bandInterest });
    interestStatus.textContent = 'Thanks. Your interests have been saved.';
    interestStatus.classList.add('success');
  } catch (error) {
    interestStatus.textContent = error.message;
    interestStatus.classList.add('error');
  } finally {
    button.disabled = false;
  }
});
