// Record types: fields, list columns and who may see or edit them.
(function () {
  'use strict';
  const KH = window.KH = window.KH || {};
  const K = () => KH.knowledge;
  const opts = arr => arr.map(v => (typeof v === 'string' ? { value: v, label: v } : v));
  const years = () => { const y = new Date().getFullYear(); const out = []; for (let k = y + 1; k >= y - 8; k--) out.push(`${k - 1}-${String(k % 100).padStart(2, '0')}`); return out; };
  const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Full year'];
  const S = {};

  S.children = {
    title: 'Children', singular: 'child', desc: 'Profiles: birthdays, school details, interests and notes.', parentOnly: true,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'dob', label: 'Date of birth', type: 'date' },
      { key: 'gender', label: 'Gender', type: 'select', options: opts(['', 'Girl', 'Boy']) },
      { key: 'order', label: 'Order (1 = eldest)', type: 'number' },
      { key: 'school', label: 'School', type: 'text' },
      { key: 'curriculum', label: 'Curriculum', type: 'select', options: opts(['', 'SABIS', 'British / IGCSE', 'American', 'IB', 'Saudi national', 'Other']) },
      { key: 'grade', label: 'Grade', type: 'text' },
      { key: 'section', label: 'Class / section', type: 'text' },
      { key: 'schoolId', label: 'School student number', type: 'text' },
      { key: 'color', label: 'Colour', type: 'select', options: opts([{ value: '#6D4AE0', label: 'Purple' }, { value: '#B8326F', label: 'Pink' }, { value: '#0B7F80', label: 'Teal' }, { value: '#4338CA', label: 'Indigo' }, { value: '#8B5E3C', label: 'Brown' }, { value: '#475569', label: 'Slate' }]) },
      { key: 'photo', label: 'Photo', type: 'file', folder: 'photos', accept: 'image' },
      { key: 'interests', label: 'Interests (used for career suggestions)', type: 'multi', options: () => K().INTERESTS, full: true },
      { key: 'health', label: 'Health notes (allergies, medication, doctor)', type: 'textarea', full: true },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['name', 'dob', 'grade', 'school'], sort: (a, b) => (a.order || 9) - (b.order || 9),
  };

  S.exams = {
    title: 'Exam dates', singular: 'exam date', desc: 'Upcoming tests and exams. They show on the calendar and trigger revision reminders.', childVisible: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'title', label: 'What (e.g. Unit 3 test)', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: opts(['Test', 'Quiz', 'Periodic', 'Mid-term', 'Final', 'Project', 'Oral', 'Other']) },
      { key: 'revisionDays', label: 'Start revision reminder (days before)', type: 'number', default: 3 },
      { key: 'notes', label: 'Notes / topics', type: 'textarea', full: true },
    ],
    list: ['date', 'childId', 'subject', 'title', 'type'], sort: (a, b) => String(a.date).localeCompare(String(b.date)),
  };

  S.examDetails = {
    title: 'Exam right & wrong', singular: 'marked exam', desc: 'Enter each question\'s topic and whether it was right; the app finds weak topics across exams.', childVisible: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'title', label: 'Exam', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'score', label: 'Score', type: 'number' },
      { key: 'outOf', label: 'Out of', type: 'number', default: 100 },
      { key: 'questions', label: 'Questions', type: 'list', full: true, sub: [
        { key: 'q', label: 'Q#', type: 'text', width: 50 },
        { key: 'topic', label: 'Topic / skill', type: 'text' },
        { key: 'correct', label: 'Right?', type: 'check' },
        { key: 'marks', label: 'Marks lost', type: 'number', width: 80 },
      ] },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['date', 'childId', 'subject', 'title', { key: 'score', label: 'Score', render: r => (r.score !== undefined && r.score !== '' ? `${r.score}/${r.outOf || 100}` : '') },
      { key: 'questions', label: 'Wrong', render: r => `${(r.questions || []).filter(q => !q.correct).length} of ${(r.questions || []).length}` }],
    sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.holidays = {
    title: 'Holidays & school events', singular: 'holiday or event', desc: 'School holidays, school events (many come from SABIS automatically), public holidays and family trips.', parentOnly: true,
    fields: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'start', label: 'From', type: 'date', required: true },
      { key: 'end', label: 'To', type: 'date' },
      { key: 'kind', label: 'Type', type: 'select', options: opts(['School holiday', 'School event', 'Public holiday', 'Family vacation', 'Other']) },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['start', 'end', 'title', 'kind'], sort: (a, b) => String(a.start).localeCompare(String(b.start)),
  };

  S.payments = {
    title: 'Payments', singular: 'payment', desc: 'School fees, books, uniform, transport, activities, exam fees and private courses.', parentOnly: true,
    fields: [
      { key: 'category', label: 'Category', type: 'select', required: true, options: opts(['Tuition', 'Registration', 'Books', 'Uniform', 'Transport / bus', 'Activities / trips', 'Exam fees', 'Private course', 'Devices', 'Other']) },
      { key: 'childId', label: 'Child (optional)', type: 'child' },
      { key: 'year', label: 'Academic year', type: 'select', options: () => opts(years()), default: () => KH.u.academicYear() },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'invoiceNo', label: 'Invoice number', type: 'text' },
      { key: 'amount', label: 'Amount (SAR)', type: 'number', required: true },
      { key: 'dueDate', label: 'Due date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: opts(['due', 'paid', 'partly paid']), default: 'due' },
      { key: 'paidDate', label: 'Paid on', type: 'date' },
      { key: 'paidAmount', label: 'Amount paid (if partly)', type: 'number' },
      { key: 'method', label: 'Method', type: 'select', options: opts(['', 'Bank transfer', 'Card', 'Cash', 'Cheque', 'Other']) },
      { key: 'courseId', label: 'Private course (optional)', type: 'select', options: () => [{ value: '', label: '' }].concat((KH.store.data.courses || []).map(c => ({ value: c.id, label: `${c.subject} - ${KH.store.childName(c.childId)}` }))) },
      { key: 'receipt', label: 'Receipt / invoice file', type: 'file', folder: 'receipts' },
      { key: 'reimbursable', label: 'Company reimbursement applies', type: 'check', full: true },
      { key: 'claimStatus', label: 'Claim status', type: 'select', options: opts(['not submitted', 'submitted', 'approved', 'paid', 'rejected']), default: 'not submitted', show: r => r.reimbursable },
      { key: 'claimDate', label: 'Claim submitted on', type: 'date', show: r => r.reimbursable },
      { key: 'reimbursedAmount', label: 'Amount received from company', type: 'number', show: r => r.reimbursable },
      { key: 'reimbursedDate', label: 'Received on', type: 'date', show: r => r.reimbursable },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['dueDate', 'category', 'description', 'childId', { key: 'amount', label: 'Amount', render: r => KH.u.money(r.amount), right: true }, 'status',
      { key: 'reimbursable', label: 'Company', render: r => (r.reimbursable ? r.claimStatus || 'not submitted' : '') }],
    sort: (a, b) => String(b.dueDate || b.paidDate || '').localeCompare(String(a.dueDate || a.paidDate || '')),
  };

  S.courses = {
    title: 'Private courses', singular: 'private course', desc: 'Tutors and centres: schedule, fees and attendance.', parentOnly: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'provider', label: 'Tutor / centre', type: 'text' },
      { key: 'contact', label: 'Phone / contact', type: 'text' },
      { key: 'schedule', label: 'Schedule (e.g. Sun & Tue 5-6 pm)', type: 'text' },
      { key: 'startDate', label: 'Start', type: 'date' },
      { key: 'endDate', label: 'End', type: 'date' },
      { key: 'feeType', label: 'Fee type', type: 'select', options: opts(['Per session', 'Monthly', 'Package']) },
      { key: 'fee', label: 'Fee (SAR)', type: 'number', parentOnly: true },
      { key: 'sessions', label: 'Sessions', type: 'list', full: true, sub: [
        { key: 'date', label: 'Date', type: 'date', width: 150 }, { key: 'attended', label: 'Attended', type: 'check' }, { key: 'topic', label: 'Topic', type: 'text' }, { key: 'notes', label: 'Notes', type: 'text' }] },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['childId', 'subject', 'provider', 'schedule', { key: 'fee', label: 'Fee', render: r => (r.fee ? `${KH.u.money(r.fee)} / ${(r.feeType || '').toLowerCase()}` : '') },
      { key: 'sessions', label: 'Sessions', render: r => `${(r.sessions || []).filter(s => s.attended).length} attended` }],
  };

  S.qualifications = {
    title: 'Qualifications', singular: 'qualification', desc: 'IGCSE, A-Level, SAT, IELTS/TOEFL, SABIS exams, Qudurat/Tahsili and more: subjects, sessions, fees and results.', childVisible: true, childEditable: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'type', label: 'Qualification', type: 'select', required: true, options: () => opts(K().QUALIFICATIONS) },
      { key: 'subject', label: 'Subject / section', type: 'text' },
      { key: 'board', label: 'Board / provider', type: 'select', options: opts(['', 'Cambridge', 'Pearson Edexcel', 'AQA / OxfordAQA', 'College Board', 'British Council / IDP', 'ETS', 'SABIS', 'Etec (Qiyas)', 'IB', 'Other']) },
      { key: 'level', label: 'Tier / level', type: 'select', options: opts(['', 'Core', 'Extended', 'Foundation', 'Higher', 'AS', 'A Level', 'Standard', 'HL', 'SL']) },
      { key: 'session', label: 'Exam session (e.g. May/June 2028)', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: opts(['Planned', 'Registered', 'Sat', 'Result received']) },
      { key: 'registrationDate', label: 'Registration deadline', type: 'date' },
      { key: 'examDate', label: 'Exam date', type: 'date' },
      { key: 'fee', label: 'Fee (SAR)', type: 'number' },
      { key: 'target', label: 'Target grade / score', type: 'text' },
      { key: 'mock', label: 'Mock result', type: 'text' },
      { key: 'predicted', label: 'Predicted', type: 'text' },
      { key: 'result', label: 'Final result', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['childId', 'type', 'subject', 'level', 'session', 'status', 'target', 'result'],
  };

  S.events = {
    title: 'Family events', singular: 'event', desc: 'A timeline of things that may affect the children: travel, illness, moves, a tough week at home.', parentOnly: true,
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'title', label: 'What happened', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: opts(['Family', 'Health', 'Travel', 'Home', 'School', 'Other']) },
      { key: 'children', label: 'Children affected', type: 'children', full: true },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['date', 'title', 'category', { key: 'children', label: 'Children', render: r => (r.children || []).map(id => KH.store.childName(id)).join(', ') }],
    sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.diary = {
    title: 'School diary', singular: 'diary entry', desc: 'When schooling moved online or back to in-person, school or class changes, and other school milestones.', childEditable: true,
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true, default: () => KH.u.today() },
      { key: 'childId', label: 'Child (leave empty for all)', type: 'child' },
      { key: 'kind', label: 'What changed', type: 'select', required: true, options: opts(['Started online learning', 'Back to in-person', 'Hybrid learning', 'Changed school', 'Changed class / section', 'Changed curriculum', 'New teacher', 'School trip', 'Other']) },
      { key: 'school', label: 'School', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['date', 'childId', 'kind', 'school', 'notes'], sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.achievements = {
    title: 'Achievements', singular: 'achievement', desc: 'Special moments: competitions, awards, being chosen to represent the school.', childVisible: true, childEditable: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true, default: () => KH.u.today() },
      { key: 'title', label: 'Achievement', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: opts(['Selected to represent the school', 'Competition', 'Award', 'Certificate', 'Sports', 'Arts', 'Leadership', 'Volunteering', 'Other']) },
      { key: 'file', label: 'Photo or certificate', type: 'file', folder: 'documents' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['date', 'childId', 'title', 'category'], sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.meetings = {
    title: 'School meetings', singular: 'meeting', desc: 'Invitations from the school, whether you attended, and what was agreed.', parentOnly: true,
    fields: [
      { key: 'childId', label: 'Child (optional)', type: 'child' },
      { key: 'invitedOn', label: 'Invited on', type: 'date' },
      { key: 'meetingDate', label: 'Meeting date', type: 'date' },
      { key: 'with', label: 'With (teacher, counsellor, principal)', type: 'text' },
      { key: 'reason', label: 'Reason', type: 'text' },
      { key: 'attended', label: 'Attended?', type: 'select', options: opts(['Pending', 'Yes', 'No', 'Rescheduled']), default: 'Pending' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
      { key: 'followUps', label: 'Follow-ups agreed', type: 'textarea', full: true },
    ],
    list: ['meetingDate', 'childId', 'with', 'reason', 'attended'], sort: (a, b) => String(b.meetingDate || b.invitedOn).localeCompare(String(a.meetingDate || a.invitedOn)),
  };

  S.contacts = {
    title: 'School contacts', singular: 'contact', desc: 'Teachers, counsellors, office and tutors.', parentOnly: true,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', options: opts(['Class teacher', 'Subject teacher', 'Counsellor', 'Principal', 'Admin office', 'Tutor', 'Bus', 'Other']) },
      { key: 'childId', label: 'Child (optional)', type: 'child' },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['name', 'role', 'subject', 'childId', 'phone', 'email'],
  };

  S.studyLog = {
    title: 'Study hours', singular: 'study entry', desc: 'Hours studied each day.', childEditable: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true, default: () => KH.u.today() },
      { key: 'hours', label: 'Hours studied', type: 'number', required: true, step: 0.25 },
      { key: 'subject', label: 'Subject (optional)', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text', full: true },
    ],
    list: ['date', 'childId', 'hours', 'subject', 'notes'], sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.readingLog = {
    title: 'Reading log', singular: 'reading entry', desc: 'Daily reading minutes.', childEditable: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true, default: () => KH.u.today() },
      { key: 'minutes', label: 'Minutes', type: 'number', required: true },
      { key: 'bookId', label: 'Book', type: 'select', options: () => [{ value: '', label: '' }].concat((KH.store.data.books || []).map(b => ({ value: b.id, label: b.title }))) },
      { key: 'notes', label: 'What happened in the book (3 sentences)', type: 'textarea', full: true },
    ],
    list: ['date', 'childId', 'minutes', { key: 'bookId', label: 'Book', render: r => { const b = (KH.store.data.books || []).find(x => x.id === r.bookId); return b ? b.title : ''; } }],
    sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.books = {
    title: 'Books', singular: 'book', desc: 'The family library: PDF and EPUB books with covers and categories. Each child has their own shelf.', childEditable: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: () => opts((KH.lib ? KH.lib.categories() : ['Other'])) },
      { key: 'language', label: 'Language', type: 'select', options: opts(['', 'English', 'Arabic', 'French', 'Other']) },
      { key: 'ages', label: 'Good for ages (e.g. 8-12)', type: 'text' },
      { key: 'file', label: 'E-book file (PDF or EPUB)', type: 'file', folder: 'books' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['title', 'author', 'category', 'language'],
  };

  S.shelf = {
    title: 'Shelves', singular: 'shelf entry', desc: 'What each child is reading, has read or wants to read.', childEditable: true, hidden: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'bookId', label: 'Book', type: 'select', options: () => (KH.store.data.books || []).map(b => ({ value: b.id, label: b.title })) },
      { key: 'status', label: 'Status', type: 'select', options: opts(['To read', 'Reading', 'Finished']) },
      { key: 'startDate', label: 'Started', type: 'date' },
      { key: 'endDate', label: 'Finished', type: 'date' },
      { key: 'rating', label: 'Rating', type: 'select', options: opts(['', '1', '2', '3', '4', '5']) },
    ],
    list: ['childId', 'bookId', 'status'],
  };

  S.photos = {
    title: 'Photos', singular: 'photo', desc: 'Family and school photos, by child and album.', parentOnly: true,
    fields: [
      { key: 'file', label: 'Photo', type: 'file', folder: 'photos', accept: 'image', required: true },
      { key: 'title', label: 'Caption', type: 'text' },
      { key: 'date', label: 'Date', type: 'date', default: () => KH.u.today() },
      { key: 'childId', label: 'Child (optional)', type: 'child' },
      { key: 'album', label: 'Album', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['date', 'title', 'album', 'childId'], sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.documents = {
    title: 'Documents', singular: 'document', desc: 'Report cards, certificates, school letters and other papers.', parentOnly: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', options: opts(['Report card', 'Certificate', 'School letter', 'ID / passport copy', 'Medical', 'Receipt', 'Contract', 'Other']) },
      { key: 'childId', label: 'Child (optional)', type: 'child' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'file', label: 'File', type: 'file', folder: 'documents', required: true },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['date', 'title', 'type', 'childId'], sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.goals = {
    title: 'Goals', singular: 'goal', desc: 'Targets the children and parents set: a subject mark, reading or study each week, books to finish, or their own goal with steps.', childVisible: true, childEditable: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'kind', label: 'Kind of goal', type: 'select', required: true, default: 'Subject mark', options: opts(['Subject mark', 'Reading minutes a week', 'Study hours a week', 'Books to finish', 'My own goal']) },
      { key: 'title', label: 'Goal (for your own goal, e.g. "Finish 10 past papers")', type: 'text', show: r => r.kind === 'My own goal', full: true },
      { key: 'subject', label: 'Subject (as on the report, e.g. Science or English Grammar)', type: 'text', show: r => !r.kind || r.kind === 'Subject mark' },
      { key: 'target', label: 'Target (mark, minutes, hours, books or count)', type: 'number' },
      { key: 'steps', label: 'Steps, one per line (optional, for your own goal)', type: 'textarea', show: r => r.kind === 'My own goal', full: true },
      { key: 'due', label: 'By when (optional)', type: 'date' },
      { key: 'year', label: 'Academic year (optional)', type: 'select', options: () => opts([''].concat(years())), show: r => !r.kind || r.kind === 'Subject mark' },
      { key: 'term', label: 'Term (optional)', type: 'select', options: opts([''].concat(TERMS)), show: r => !r.kind || r.kind === 'Subject mark' },
      { key: 'reward', label: 'Reward when it is reached (optional)', type: 'text', full: true },
      { key: 'agreed', label: 'Agreed by a parent', type: 'check', parentOnly: true },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['childId', { key: 'title', label: 'Goal', render: r => (r.kind && r.kind !== 'Subject mark' ? (r.title || r.kind) : `${r.subject || ''}`) }, 'target', 'due', { key: 'agreed', label: 'Agreed', render: r => (r.agreed ? '✓' : '') }],
  };

  S.homework = {
    title: 'Homework', singular: 'homework', desc: 'Homework from SABIS (brought in by "Update from SABIS") and any you add yourself.', childVisible: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'title', label: 'What', type: 'text', required: true, full: true },
      { key: 'assigned', label: 'Given on', type: 'date' },
      { key: 'due', label: 'Due', type: 'date' },
      { key: 'details', label: 'Details', type: 'textarea', full: true },
      { key: 'done', label: 'Finished', type: 'check' },
    ],
    list: ['due', 'childId', 'subject', 'title', 'done'], sort: (a, b) => String(b.due || '').localeCompare(String(a.due || '')),
  };

  S.lunch = {
    title: 'Lunch box', singular: 'lunch entry', desc: 'What went in the lunch box (or canteen money) and how much came back, to see what they really eat.', childEditable: true,
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true, default: () => KH.u.today() },
      { key: 'kind', label: 'Lunch', type: 'select', options: opts(['Lunch box', 'Canteen', 'Lunch box + canteen', 'None']), default: 'Lunch box' },
      { key: 'items', label: 'What was packed (separate with commas)', type: 'text', full: true, show: r => r.kind !== 'Canteen' && r.kind !== 'None' },
      { key: 'eaten', label: 'How much was eaten', type: 'select', options: opts(['', 'All', 'Most', 'Half', 'Little', 'None']), show: r => r.kind !== 'Canteen' && r.kind !== 'None' },
      { key: 'leftovers', label: 'What came back (separate with commas)', type: 'text', full: true, show: r => r.kind !== 'Canteen' && r.kind !== 'None' },
      { key: 'canteen', label: 'Canteen money', type: 'number', show: r => r.kind === 'Canteen' || r.kind === 'Lunch box + canteen' },
      { key: 'water', label: 'Finished the water bottle', type: 'check' },
      { key: 'notes', label: 'Notes', type: 'text', full: true },
    ],
    list: ['date', 'childId', 'kind', 'items', 'eaten', 'leftovers'], sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  };

  S.sick = {
    title: 'Sick records', singular: 'sick record', desc: 'Illnesses, school days missed, doctor visits, medicine and the medical note for school.', childEditable: true, childSingular: 'sick report',
    fields: [
      { key: 'childId', label: 'Child', type: 'child', required: true },
      { key: 'start', label: 'Sick from', type: 'date', required: true, default: () => KH.u.today() },
      { key: 'end', label: 'Until (leave empty while still sick)', type: 'date' },
      { key: 'illness', label: 'Illness / symptoms', type: 'text', required: true, full: true },
      { key: 'temperature', label: 'Highest temperature (°C)', type: 'number', step: 0.1 },
      { key: 'daysOff', label: 'School days missed (empty = count from the dates)', type: 'number' , parentOnly: true },
      { key: 'doctor', label: 'Doctor / clinic', type: 'text' , parentOnly: true },
      { key: 'visitDate', label: 'Doctor visit on', type: 'date' , parentOnly: true },
      { key: 'diagnosis', label: 'What the doctor said', type: 'text', full: true , parentOnly: true },
      { key: 'medicine', label: 'Medicine (name, dose, how often, until when)', type: 'textarea', full: true , parentOnly: true },
      { key: 'followUp', label: 'Follow-up appointment', type: 'date' , parentOnly: true },
      { key: 'cost', label: 'Cost', type: 'number' , parentOnly: true },
      { key: 'note', label: 'Medical note for school', type: 'file', folder: 'documents' , parentOnly: true },
      { key: 'noteSent', label: 'Medical note given to the school', type: 'check' , parentOnly: true },
      { key: 'makeUp', label: 'Missed tests / make-up arranged', type: 'check' , parentOnly: true },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    list: ['start', 'childId', 'illness', { key: 'end', label: 'Until', render: r => (r.end ? KH.u.fmtDate(r.end) : 'still sick') },
      { key: 'daysOff', label: 'Days missed', render: r => KH.analysis.sickDays(r, KH.store.data, KH.u.today()) },
      { key: 'noteSent', label: 'School note', render: r => (r.noteSent ? 'given' : (KH.analysis.sickDays(r, KH.store.data, KH.u.today()) ? 'not yet' : '')) }],
    sort: (a, b) => String(b.start).localeCompare(String(a.start)),
  };

  KH.schema = S;
  KH.schemaUtil = { years, TERMS };
})();
