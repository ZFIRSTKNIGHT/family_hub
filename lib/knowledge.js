// Subject knowledge used by the analysis engine: categories, recommended actions,
// international grade scales (approximate), career fields and qualification paths.
(function (root, factory) {
  const k = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = k;
  else { root.KH = root.KH || {}; root.KH.knowledge = k; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DOMAINS = [
    { key: 'english', label: 'English', match: /^english|^eng\b/i, lang: true },
    { key: 'arabic', label: 'Arabic', match: /arab|عرب/i, lang: true },
    { key: 'foreign', label: 'Foreign language', match: /french|spanish|german|chinese|3rd lang|third lang|urdu|turkish/i, lang: true },
    { key: 'math', label: 'Mathematics', match: /math|algebra|geometry|arithmetic|calculus|statistic|trigon/i },
    { key: 'physics', label: 'Physics', match: /physic/i },
    { key: 'chemistry', label: 'Chemistry', match: /chemist/i },
    { key: 'biology', label: 'Biology', match: /biolog/i },
    { key: 'science', label: 'Science', match: /science/i },
    { key: 'social', label: 'Social studies & history', match: /social|history|geograph|civics|citizen/i },
    { key: 'islamic', label: 'Islamic studies', match: /islam|quran|qur'an|religio|tawheed|fiqh|hadith/i },
    { key: 'computing', label: 'Computing', match: /comput|ict|coding|programming|information tech/i },
    { key: 'business', label: 'Business & economics', match: /business|econom|account|commerce/i },
    { key: 'art', label: 'Art & design', match: /\bart\b|design|drawing/i },
    { key: 'music', label: 'Music', match: /music/i },
    { key: 'pe', label: 'Physical education', match: /physical ed|\bpe\b|sport/i },
  ];

  const SKILLS = [
    { key: 'reading', label: 'Comprehension', match: /comprehen|reading/i },
    { key: 'vocabulary', label: 'Vocabulary', match: /vocab/i },
    { key: 'grammar', label: 'Grammar', match: /grammar/i },
    { key: 'spelling', label: 'Spelling', match: /spell/i },
    { key: 'writing', label: 'Writing', match: /composition|writing|essay/i },
    { key: 'literature', label: 'Literature', match: /literat/i },
    { key: 'weekly', label: 'Weekly checks (AMS)', match: /^a\.?m\.?s\.?$|academic monitoring/i },
  ];

  function domainOf(course, sub) {
    const c = String(course || ''), s = String(sub || '');
    // course name decides first; sciences listed after languages on purpose
    for (const d of DOMAINS) if (d.key !== 'science' && d.match.test(c)) return d.key;
    if (/science/i.test(c)) return 'science';
    for (const d of DOMAINS) if (d.match.test(s)) return d.key;
    return 'other';
  }
  function skillOf(sub) {
    const s = String(sub || '');
    for (const k of SKILLS) if (k.match.test(s)) return k.key;
    return null;
  }
  function domainLabel(key) { const d = DOMAINS.find(x => x.key === key); return d ? d.label : 'Other'; }
  function skillLabel(key) { const s = SKILLS.find(x => x.key === key); return s ? s.label : key; }

  // ---- recommended actions -------------------------------------------------
  // {course} and {sub} are filled in by the engine.
  const ACTIONS = {
    reading: [
      'Daily 20 minutes of reading in {course} (books they choose), then retell it in three sentences.',
      'Ask the {course} teacher what the comprehension tasks test (main idea, inference, evidence) and what changed recently.',
      'Practise past comprehension questions and answer with evidence from the text.',
    ],
    vocabulary: [
      '10 minutes a day on the current {course} word list with flashcards.',
      'A quick spoken vocabulary quiz at home twice a week.',
      'Ask the {course} teacher for the upcoming word lists and what the vocabulary tests check.',
    ],
    grammar: [
      'Redo the grammar items lost in the last test and write three new sentences for each rule.',
      'Ten minutes of grammar practice three times a week.',
    ],
    spelling: ["Look-cover-write-check practice on this week's spelling words, 10 minutes a day."],
    writing: [
      'Write one short paragraph a week and ask the teacher for feedback.',
      "Check work against the teacher's marking rubric before handing it in.",
    ],
    literature: ['Read the set text ahead of class and keep a short notes page per chapter.'],
    weekly: [
      'Find out which topics the low weekly checks covered and redo those exercises.',
      'Short daily practice on the current unit so weekly checks stay steady.',
    ],
    math: [
      'Redo every question lost in the last test before moving on.',
      'Three 30-minute practice sessions a week on the current unit.',
      'A timed practice test a few days before each test.',
    ],
    science: [
      'Go through the marked paper: were marks lost on facts and terms, or on written explanations?',
      'After each lesson, make 5-10 flashcards of key terms and review them twice a week.',
      'Practise past questions and answer in full sentences.',
    ],
    physics: ['Practise calculation questions with units every week; redo lost questions.', 'Make a formula sheet and test yourself on it before each test.'],
    chemistry: ['Flashcards for symbols, equations and key terms; review twice a week.', 'Practise past questions, especially calculations and explanations.'],
    biology: ['Flashcards for key terms and labelled diagrams; review twice a week.', 'Practise explaining processes in full sentences.'],
    social: [
      'Summarise each lesson in five bullet points the same day.',
      'Flashcards for key facts, dates and terms; review twice a week.',
      'Practise past questions before each test.',
    ],
    islamic: ['Review each lesson the same day and test yourself with short questions.', 'Memorise set passages in small daily portions.'],
    foreign: ['10 minutes a day on the current word list; quiz with a sibling or parent.', 'Listen to or read something short in the language three times a week.'],
    computing: ['Practise the current topic hands-on on a computer twice a week.'],
    business: ['Summarise each topic with one real-life example.'],
    art: ['Keep a sketchbook and practise 15 minutes a few times a week.'],
    music: ['Short regular practice sessions rather than long occasional ones.'],
    pe: ['Keep a simple activity routine and ask the teacher what the assessment covers.'],
    generic: [
      'Look at the marked paper together and find where the marks were lost.',
      'Ask the teacher which topics were covered and how to improve.',
    ],
  };

  function actionsFor(domain, skill) {
    if (skill && ACTIONS[skill]) return ACTIONS[skill];
    if (ACTIONS[domain]) return ACTIONS[domain];
    return ACTIONS.generic;
  }

  // ---- international scales (approximate conversions from a percentage) ----
  const SCALES = {
    igcse: { label: 'IGCSE (A*-G)', note: 'Approximate: real grade boundaries change every exam session.',
      bands: [[90, 'A*'], [80, 'A'], [70, 'B'], [60, 'C'], [50, 'D'], [40, 'E'], [30, 'F'], [20, 'G'], [0, 'U']] },
    us: { label: 'US letter / GPA', note: 'Common US school scale; colleges may recalculate.',
      bands: [[97, 'A+ (4.0)'], [93, 'A (4.0)'], [90, 'A- (3.7)'], [87, 'B+ (3.3)'], [83, 'B (3.0)'], [80, 'B- (2.7)'], [77, 'C+ (2.3)'], [73, 'C (2.0)'], [70, 'C- (1.7)'], [67, 'D+ (1.3)'], [65, 'D (1.0)'], [0, 'F (0.0)']] },
    ib: { label: 'IB (1-7)', note: 'Approximate school-style conversion.',
      bands: [[90, '7'], [80, '6'], [70, '5'], [60, '4'], [50, '3'], [40, '2'], [0, '1']] },
    saudi: { label: 'Saudi scale', note: 'Ministry descriptors.',
      bands: [[90, 'Excellent'], [80, 'Very good'], [70, 'Good'], [60, 'Pass'], [0, 'Below pass']] },
  };
  function convert(scaleKey, pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return '';
    for (const [min, g] of SCALES[scaleKey].bands) if (pct >= min) return g;
    return '';
  }
  function gpa(pct) {
    const g = convert('us', pct);
    const m = g.match(/\(([\d.]+)\)/);
    return m ? Number(m[1]) : null;
  }

  // ---- career fields --------------------------------------------------------
  const INTERESTS = ['Building things', 'Problem solving', 'Technology & coding', 'Science & experiments', 'Helping people', 'Health & medicine',
    'Money & business', 'Leading teams', 'Debating & justice', 'Reading & writing', 'Languages', 'Drawing & design', 'Teaching', 'Nature & environment', 'Sports'];

  const CAREERS = [
    { key: 'engineering', label: 'Engineering', weights: { math: 3, physics: 3, chemistry: 1, computing: 1, science: 1 }, interests: ['Building things', 'Problem solving', 'Technology & coding'],
      needs: ['Mathematics', 'Physics'], examples: 'civil, mechanical, electrical, petroleum, industrial engineering' },
    { key: 'medicine', label: 'Medicine & health sciences', weights: { biology: 3, chemistry: 3, math: 1, physics: 1, science: 2, english: 1 }, interests: ['Helping people', 'Health & medicine', 'Science & experiments'],
      needs: ['Biology', 'Chemistry', 'Mathematics'], examples: 'medicine, dentistry, pharmacy, nursing, physiotherapy' },
    { key: 'cs', label: 'Computer science & IT', weights: { math: 3, computing: 3, physics: 1, english: 1 }, interests: ['Technology & coding', 'Problem solving'],
      needs: ['Mathematics', 'Computing'], examples: 'software engineering, data science, cybersecurity, AI' },
    { key: 'business', label: 'Business, finance & economics', weights: { math: 2, english: 2, business: 3, social: 1 }, interests: ['Money & business', 'Leading teams'],
      needs: ['Mathematics', 'English'], examples: 'finance, accounting, management, economics, marketing' },
    { key: 'law', label: 'Law & international relations', weights: { english: 3, arabic: 2, social: 3, islamic: 1 }, interests: ['Debating & justice', 'Reading & writing'],
      needs: ['English', 'Arabic', 'History / social studies'], examples: 'law, political science, diplomacy' },
    { key: 'media', label: 'Media, languages & communication', weights: { english: 3, arabic: 2, foreign: 2 }, interests: ['Reading & writing', 'Languages'],
      needs: ['English', 'Arabic', 'a foreign language'], examples: 'journalism, translation, public relations, media production' },
    { key: 'education', label: 'Education & psychology', weights: { english: 2, arabic: 2, social: 2, biology: 1 }, interests: ['Helping people', 'Teaching'],
      needs: ['English', 'Arabic'], examples: 'teaching, psychology, counselling, special education' },
    { key: 'design', label: 'Architecture & design', weights: { math: 2, physics: 1, art: 3, computing: 1 }, interests: ['Drawing & design', 'Building things'],
      needs: ['Mathematics', 'Art / design portfolio'], examples: 'architecture, interior design, graphic and product design' },
    { key: 'sciences', label: 'Pure & environmental sciences', weights: { biology: 2, chemistry: 2, physics: 2, math: 2, science: 2 }, interests: ['Science & experiments', 'Nature & environment'],
      needs: ['two sciences', 'Mathematics'], examples: 'biology, chemistry, physics, environmental science, research' },
    { key: 'arabic-islamic', label: 'Arabic & Islamic studies', weights: { arabic: 3, islamic: 3, social: 1 }, interests: ['Reading & writing', 'Teaching'],
      needs: ['Arabic', 'Islamic studies'], examples: 'Sharia, Arabic language and literature' },
  ];

  // ---- qualifications ---------------------------------------------------------
  const QUALIFICATIONS = ['IGCSE', 'A-Level / AS', 'SAT', 'ACT', 'AP', 'IB', 'IELTS', 'TOEFL', 'SABIS exams', 'Qudurat (GAT)', 'Tahsili', 'Other'];

  return { DOMAINS, SKILLS, domainOf, skillOf, domainLabel, skillLabel, ACTIONS, actionsFor, SCALES, convert, gpa, INTERESTS, CAREERS, QUALIFICATIONS };
});
