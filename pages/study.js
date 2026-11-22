// Study hours (children log their own daily hours). Reading & books is in library.js.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;

  function quickLog(childId) {
    const date = h('input', { type: 'date', value: u.today(), style: { width: '160px' } });
    const hours = h('input', { type: 'number', step: '0.25', min: '0', placeholder: 'Hours', style: { width: '100px' } });
    const subject = h('input', { type: 'text', placeholder: 'Subject (optional)', style: { width: '200px' } });
    const presets = [0.5, 1, 1.5, 2, 3, 4].map(v => h('button', { class: 'btn small', onclick: () => { hours.value = v; } }, `${v} h`));
    const save = () => {
      const v = Number(hours.value);
      if (!(v > 0) || v > 16) return u.toast('Enter the hours studied (e.g. 1.5)', 'bad');
      KH.store.upsert('studyLog', { childId, date: date.value, hours: v, subject: subject.value.trim() });
      u.toast('Logged. Well done!'); KH.app.refresh();
    };
    return h('div', null, h('div', { class: 'row' }, date, hours, subject, h('button', { class: 'btn primary', onclick: save }, 'Save')), h('div', { class: 'row', style: { marginTop: '8px' } }, presets));
  }

  function childStudyCard(c) {
    const st = A.studyStats(KH.store.data, c.id, u.today());
    return h('div', { class: 'card' },
      h('div', { class: 'kid-head' }, KH.avatar(c), h('div', null, h('b', null, c.name), h('div', { class: 'small muted' }, `${st.last7} h this week · ${st.avgPerDay} h/day · ${st.streak ? st.streak + '-day streak' : 'no streak yet'}`))),
      u.svg(KH.charts.hours(st.weeks)));
  }

  KH.pages.study = function () {
    const isParent = KH.app.isParent();
    if (!isParent) {
      const me = KH.store.user.childId;
      return h('div', null,
        u.section('How many hours did you study today?', quickLog(me)),
        h('div', { class: 'grid g2' }, childStudyCard(KH.store.child(me)), u.section('Tips', h('ul', { style: { margin: 0, paddingLeft: '18px' } },
          h('li', null, 'Short, regular sessions beat one long session before a test.'), h('li', null, 'Start revising a few days before each exam on your calendar.'), h('li', null, 'Log every day, even a little - your streak shows here.')))),
        u.section('History', KH.crud.list('studyLog', { noBar: true })));
    }
    return h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Each child logs their study hours from their own login. You can also add entries here.'),
      h('div', { class: 'grid g3' }, KH.store.children().map(childStudyCard)),
      KH.crud.list('studyLog'));
  };

})();
