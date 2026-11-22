// Set the theme and text direction before the page paints, so there is no white flash in dark mode.
(function () {
  try {
    var t = localStorage.getItem('kh.theme');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    var st = localStorage.getItem('kh.style');
    document.documentElement.setAttribute('data-style', st === 'modern' || st === 'calm' ? st : 'premium');
    if (localStorage.getItem('kh.lang') === 'ar') { document.documentElement.setAttribute('dir', 'rtl'); document.documentElement.setAttribute('lang', 'ar'); }
  } catch (e) { /* storage unavailable */ }
})();
