// Personal 1–5 star ratings of candidates' answers. Ratings are stored only
// in this browser, as {candidateSlug: {questionNumber: stars}}.
(function () {
  'use strict';

  var KEY = 'bikeloud-2026-ratings';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  // If storage is blocked, ratings still work for the current page.
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(ratings));
    } catch (e) { /* ignore */ }
  }

  var ratings = load();

  function stars(slug, question) {
    return (ratings[slug] || {})[question] || 0;
  }

  function rate(slug, question, n) {
    var r = ratings[slug] || (ratings[slug] = {});
    if (n) r[question] = n; else delete r[question];
    save();
  }

  // ---- Star widgets ---------------------------------------------------------

  function paint(widget) {
    var n = stars(widget.dataset.candidate, widget.dataset.question);
    widget.querySelectorAll('button').forEach(function (b) {
      var value = Number(b.dataset.stars);
      b.classList.toggle('on', value <= n);
      b.setAttribute('aria-pressed', String(value === n));
    });
  }

  // Clicking the current rating again clears it.
  document.addEventListener('click', function (e) {
    var button = e.target.closest('.rating button');
    if (!button) return;
    var widget = button.closest('.rating');
    var n = Number(button.dataset.stars);
    var current = stars(widget.dataset.candidate, widget.dataset.question);
    rate(widget.dataset.candidate, widget.dataset.question, n === current ? 0 : n);
    paint(widget);
  });

  document.querySelectorAll('.rating').forEach(paint);

  // ---- Ranking page ---------------------------------------------------------

  function score(slug) {
    var values = Object.values(ratings[slug] || {});
    var sum = values.reduce(function (a, b) { return a + b; }, 0);
    return { count: values.length, avg: values.length ? sum / values.length : 0 };
  }

  function rankSection(section) {
    var total = Number(section.dataset.questions);
    var list = section.querySelector('.rank-list');
    var unrated = section.querySelector('.rank-unrated');
    var items = Array.from(section.querySelectorAll('.rank')).map(function (li) {
      return { li: li, s: score(li.dataset.candidate) };
    });
    var rated = items.filter(function (x) { return x.s.count; });
    rated.sort(function (a, b) { return b.s.avg - a.s.avg || b.s.count - a.s.count; });
    rated.forEach(function (x, i) {
      // Tied averages share a place: 1, 2, 2, 4.
      var tied = i > 0 && x.s.avg === rated[i - 1].s.avg;
      x.place = tied ? rated[i - 1].place : i + 1;
      x.li.querySelector('.rank-place').textContent = x.place;
      x.li.querySelector('.rank-score').textContent =
        x.s.avg.toFixed(1) + ' ★ – ' + x.s.count + ' of ' + total + ' rated';
      x.li.querySelector('.rank-bar span').style.width = (x.s.avg / 5 * 100) + '%';
      list.appendChild(x.li);
    });
    items.filter(function (x) { return !x.s.count; }).forEach(function (x) {
      unrated.appendChild(x.li);
    });
    section.querySelector('.rank-unrated-title').hidden = !unrated.children.length;
    list.hidden = !rated.length;
    return rated.length;
  }

  var sections = document.querySelectorAll('.ranking');
  if (sections.length) {
    var anyRated = Array.from(sections).map(rankSection).some(Boolean);
    document.querySelector('.ranking-empty').hidden = anyRated;
    document.getElementById('clear-ratings').addEventListener('click', function () {
      if (!confirm('Clear all of your ratings?')) return;
      ratings = {};
      save();
      location.reload();
    });
  }

  // ---- Blind rating ---------------------------------------------------------

  function shuffle(items) {
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = items[i]; items[i] = items[j]; items[j] = t;
    }
    return items;
  }

  // Each question gets its own order, so "Answer A" isn't the same person twice.
  function shuffleAnswers(step) {
    var box = step.querySelector('.blind-answers');
    shuffle(Array.from(box.children)).forEach(function (article, i) {
      article.querySelector('.blind-label').textContent =
        'Answer ' + String.fromCharCode(65 + i);
      box.appendChild(article);
    });
  }

  function openDistrict(blind, district) {
    var steps = Array.from(district.querySelectorAll('.blind-step'));
    var prev = district.querySelector('[data-move="-1"]');
    var next = district.querySelector('[data-move="1"]');
    var at = 0;
    function show() {
      steps.forEach(function (s, i) { s.hidden = i !== at; });
      prev.hidden = at === 0;
      next.textContent = at === steps.length - 1 ? 'Reveal my ranking →' : 'Next question →';
      blind.scrollIntoView();
    }
    district.addEventListener('click', function (e) {
      var move = e.target.closest('[data-move]');
      if (!move) return;
      var to = at + Number(move.dataset.move);
      if (to === steps.length) {
        location.href = blind.dataset.rankingUrl + '#' + district.dataset.district;
        return;
      }
      at = to;
      show();
    });
    steps.forEach(shuffleAnswers);
    district.hidden = false;
    show();
  }

  var blind = document.querySelector('.blind');
  if (blind) {
    var start = blind.querySelector('.blind-start');
    start.addEventListener('click', function (e) {
      var button = e.target.closest('[data-district]');
      if (!button) return;
      start.hidden = true;
      openDistrict(blind, blind.querySelector(
        '.blind-district[data-district="' + button.dataset.district + '"]'));
    });
  }
})();
