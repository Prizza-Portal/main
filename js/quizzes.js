// Quizzes: staff build multiple-choice quizzes; students take them and are scored on the server
// (correct answers are never sent to students before they submit).
(() => {
  const $ = id => document.getElementById(id), P = () => window.PZ, esc = s => P().esc(s);
  let quizzes = [], best = {}, qn = 0;
  const card = 'p-5 rounded-2xl bg-white dark:bg-darkbg-card border border-hairline';
  const muted = 'text-xs text-charcoal-muted dark:text-darkbg-muted';
  const btn = 'px-3.5 py-2 rounded-xl text-xs font-bold';
  const primary = 'bg-britishNavy dark:bg-white text-white dark:text-britishNavy';
  const panes = ['quiz-list', 'quiz-take', 'quiz-build', 'quiz-results'];
  const show = n => {
    panes.forEach(p => $(p).classList.toggle('hidden', p !== n));
    $('btn-newquiz').style.display = n === 'quiz-list' && P().isStaff() ? '' : 'none';
  };

  async function load() {
    const [a, b] = await Promise.all([
      sb.from('quizzes').select('*, quiz_questions(count)').order('created_at', { ascending: false }),
      sb.from('quiz_attempts').select('quiz_id,score,total').eq('user_id', P().me.id)]);
    if (a.error) return P().toast(a.error.message);
    quizzes = a.data; best = {};
    (b.data || []).forEach(r => { const pct = r.score / (r.total || 1); if (!best[r.quiz_id] || pct > best[r.quiz_id].pct) best[r.quiz_id] = { score: r.score, total: r.total, pct }; });
    renderList();
  }

  function renderList() {
    show('quiz-list');
    const staff = P().isStaff();
    $('quiz-list').innerHTML = quizzes.length ? quizzes.map(z => {
      const n = z.quiz_questions?.[0]?.count || 0, b = best[z.id];
      return `<article class="${card} flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="min-w-0 flex-grow"><h4 class="font-display text-lg font-bold">${esc(z.title)}</h4>
          ${z.description ? `<p class="${muted}">${esc(z.description)}</p>` : ''}
          <p class="${muted} mt-1">${n} question${n === 1 ? '' : 's'}${b ? ` · Best score: <b>${b.score}/${b.total}</b>` : ''}</p></div>
        <div class="flex gap-2 flex-wrap">
          ${n ? `<button data-start="${z.id}" class="${btn} ${primary}">${b ? 'Try again' : 'Start'}</button>` : ''}
          ${staff ? `<button data-results="${z.id}" class="${btn} border border-hairline">Results</button>
          <button data-qdel="${z.id}" class="${btn} border border-hairline text-red-600" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div></article>`;
    }).join('') : `<p class="${muted} py-8 text-center">No quizzes yet.</p>`;
  }

  async function start(id) {
    const z = quizzes.find(x => x.id === id);
    const { data, error } = await sb.from('quiz_questions').select('*').eq('quiz_id', id).order('position');
    if (error || !data.length) return P().toast(error?.message || 'This quiz has no questions.');
    show('quiz-take'); $('quiz-take')._qs = data;
    $('quiz-take').innerHTML = `<button data-back class="${muted} font-bold hover:underline">← Back to quizzes</button>
      <h3 class="font-display text-2xl font-bold">${esc(z.title)}</h3>` +
      data.map((q, i) => `<div class="${card} space-y-3"><p class="text-sm font-bold">${i + 1}. ${esc(q.prompt)}</p>` +
        q.options.map((o, j) => `<label class="flex items-center gap-3 p-3 rounded-xl border border-hairline cursor-pointer text-sm"><input type="radio" name="q-${q.id}" value="${j}"><span>${esc(o)}</span></label>`).join('') + '</div>').join('') +
      `<button data-submit="${id}" class="${btn} ${primary} !px-6 !py-3">Submit answers</button>`;
    window.scrollTo(0, 0);
  }

  async function submit(id) {
    const qs = $('quiz-take')._qs, ans = {};
    qs.forEach(q => { const c = document.querySelector(`input[name="q-${q.id}"]:checked`); if (c) ans[q.id] = +c.value; });
    if (Object.keys(ans).length < qs.length && !confirm('Some questions are unanswered. Submit anyway?')) return;
    const { data, error } = await sb.rpc('submit_quiz', { p_quiz: id, p_answers: ans });
    if (error) return P().toast(error.message);
    const by = Object.fromEntries(data.detail.map(d => [d.question_id, d]));
    const pct = Math.round(100 * data.score / Math.max(data.total, 1));
    $('quiz-take').innerHTML = `<div class="${card} text-center space-y-2"><p class="${muted}">Your score</p>
        <p class="font-display text-5xl font-bold">${data.score}/${data.total}</p><p class="text-sm font-bold">${pct}%</p>
        <div class="flex justify-center gap-2 pt-2"><button data-start="${id}" class="${btn} ${primary}">Try again</button><button data-back class="${btn} border border-hairline">All quizzes</button></div></div>` +
      qs.map((q, i) => { const d = by[q.id] || {}; return `<div class="${card} space-y-2"><p class="text-sm font-bold">${i + 1}. ${esc(q.prompt)}</p>` +
        q.options.map((o, j) => { const ok = j === d.correct, bad = j === d.picked && !ok;
          return `<div class="p-3 rounded-xl border text-sm ${ok ? 'border-green-600 bg-green-50 text-green-800' : bad ? 'border-red-500 bg-red-50 text-red-800' : 'border-hairline'}">${esc(o)}${ok ? ' ✓' : bad ? ' ✗ your answer' : ''}</div>`; }).join('') + '</div>'; }).join('');
    window.scrollTo(0, 0);
  }

  async function results(id) {
    const z = quizzes.find(x => x.id === id);
    const { data, error } = await sb.from('quiz_attempts').select('score,total,created_at,profiles(full_name,username)').eq('quiz_id', id).order('created_at', { ascending: false });
    if (error) return P().toast(error.message);
    show('quiz-results');
    $('quiz-results').innerHTML = `<button data-back class="${muted} font-bold hover:underline">← Back to quizzes</button><h3 class="font-display text-2xl font-bold">${esc(z.title)} — results</h3>` +
      (data.length ? data.map(r => `<div class="${card} !p-3.5 flex justify-between gap-3 text-sm"><span class="font-bold">${esc(r.profiles?.full_name || r.profiles?.username || 'Unknown')}</span>
        <span>${r.score}/${r.total} · <span class="${muted}">${P().fmt(r.created_at)}</span></span></div>`).join('') : `<p class="${muted}">No attempts yet.</p>`);
  }

  // ---- builder ----
  function addQ() {
    const n = ++qn, d = document.createElement('div');
    d.className = card + ' space-y-2';
    d.innerHTML = `<div class="flex justify-between"><p class="text-xs font-bold">Question</p><button type="button" data-rmq class="text-xs text-red-600 font-bold">Remove</button></div>
      <textarea rows="2" data-prompt placeholder="Question text" class="field"></textarea>` +
      [0, 1, 2, 3].map(i => `<div class="flex items-center gap-2"><input type="radio" name="c-${n}" value="${i}" ${i === 0 ? 'checked' : ''} title="Correct answer"><input data-opt placeholder="Option ${'ABCD'[i]}" class="field"></div>`).join('') +
      `<p class="${muted}">Tick the circle next to the correct answer. Leave unused options blank.</p>`;
    $('qb-questions').appendChild(d);
  }
  $('btn-newquiz').onclick = () => { $('quiz-build').reset(); $('qb-questions').innerHTML = ''; addQ(); show('quiz-build'); };
  $('qb-add').onclick = addQ;
  $('qb-cancel').onclick = renderList;

  $('quiz-build').onsubmit = async e => {
    e.preventDefault();
    const out = [];
    for (const b of [...$('qb-questions').children]) {
      const prompt = b.querySelector('[data-prompt]').value.trim();
      const opts = [...b.querySelectorAll('[data-opt]')].map(i => i.value.trim());
      const corr = +b.querySelector('input[type=radio]:checked').value;
      const keep = opts.map((_, i) => i).filter(i => opts[i]);
      if (!prompt || keep.length < 2 || !opts[corr]) return P().toast('Each question needs text, at least 2 options, and a filled-in correct answer.');
      out.push({ prompt, options: keep.map(i => opts[i]), correct: keep.indexOf(corr) });
    }
    if (!out.length) return P().toast('Add at least one question.');
    const quizId = crypto.randomUUID(), ids = out.map(() => crypto.randomUUID()), title = $('qb-title').value.trim();
    const undo = async msg => { await sb.from('quizzes').delete().eq('id', quizId); P().toast(msg); };
    let r = await sb.from('quizzes').insert({ id: quizId, title, description: $('qb-desc').value.trim() || null });
    if (r.error) return P().toast(r.error.message);
    r = await sb.from('quiz_questions').insert(out.map((q, i) => ({ id: ids[i], quiz_id: quizId, position: i, prompt: q.prompt, options: q.options })));
    if (r.error) return undo(r.error.message);
    r = await sb.from('quiz_answers').insert(out.map((q, i) => ({ question_id: ids[i], correct_index: q.correct })));
    if (r.error) return undo(r.error.message);
    if ($('qb-notify').checked) await sb.from('posts').insert({ kind: 'notice', important: true, title: 'New quiz: ' + title, body: `${out.length} questions — open Quizzes to take it.` });
    P().toast('Quiz published'); load();
  };

  $('view-quizzes').addEventListener('click', async e => {
    const t = s => e.target.closest(s);
    if (t('[data-rmq]')) t('[data-rmq]').closest('div.space-y-2').remove();
    else if (t('[data-start]')) start(t('[data-start]').dataset.start);
    else if (t('[data-submit]')) submit(t('[data-submit]').dataset.submit);
    else if (t('[data-results]')) results(t('[data-results]').dataset.results);
    else if (t('[data-back]')) load();
    else if (t('[data-qdel]')) {
      const z = quizzes.find(x => x.id === t('[data-qdel]').dataset.qdel);
      if (!confirm(`Delete “${z.title}” and all its results?`)) return;
      const r = await sb.from('quizzes').delete().eq('id', z.id);
      r.error ? P().toast(r.error.message) : load();
    }
  });
  document.addEventListener('pz-ready', load);
})();
