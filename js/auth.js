const $ = id => document.getElementById(id);
let signup = false;

function setMode(s) {
  signup = s;
  $('name-wrap').hidden = !s; $('code-wrap').hidden = !s;
  $('tab-login').classList.toggle('on', !s);
  $('tab-signup').classList.toggle('on', s);
  $('submit').textContent = s ? 'Create account' : 'Log in';
  $('password').autocomplete = s ? 'new-password' : 'current-password';
  msg('');
}
function msg(t, ok) { const m = $('msg'); m.textContent = t; m.className = 'auth-msg' + (ok ? ' ok' : ''); }

sb.auth.getSession().then(({ data }) => { if (data.session) location.replace('index.html'); });
$('tab-login').onclick = () => setMode(false);
$('tab-signup').onclick = () => setMode(true);

$('auth-form').onsubmit = async e => {
  e.preventDefault();
  const b = $('submit'); b.disabled = true; msg('');
  const username = $('username').value.trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) { b.disabled = false; return msg('Username: 3–20 letters, numbers, _ or .'); }
  const email = username + '@prizza.app', password = $('password').value, classCode = $('classcode').value.trim();
  if (signup && !classCode) { b.disabled = false; return msg('Please enter your class code.'); }
  const { data, error } = signup
    ? await sb.auth.signUp({ email, password, options: { data: { full_name: $('name').value.trim() || username, class_code: classCode } } })
    : await sb.auth.signInWithPassword({ email, password });
  b.disabled = false;
  if (error) return msg(signup && /database error/i.test(error.message) ? 'Could not create the account. Check your class code and try again.' : error.message);
  if (data.session) location.replace('index.html');
  else msg('Account created — now log in.', true);
};
