// English / Arabic. English is written in the code; in Arabic mode every text on the
// page (and each Windows notification) is looked up in the dictionary below, or matched
// by a pattern when it carries names or numbers. Anything not found stays in English.
// Works in the window (KH.i18n) and in the main process (require('./ui/lib/i18n')).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.KH = root.KH || {}; root.KH.i18n = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const D = {
    // ---------------- shell and navigation ----------------
    'M. Ebrahim Family Hub': 'M. Ebrahim Family Hub', 'Family Hub': 'منصة العائلة', 'Home': 'الرئيسية', 'Children': 'الأبناء', 'Plan': 'التخطيط', 'School': 'المدرسة',
    'Study': 'المذاكرة', 'Health & daily': 'الصحة واليوميات', 'Money': 'المال', 'Family': 'العائلة', 'Setup': 'الإعداد', 'Account': 'الحساب',
    'School (SABIS)': 'المدرسة (SABIS)', 'Add marks': 'إضافة درجات', 'Calendar': 'التقويم', 'Exam dates': 'مواعيد الاختبارات', 'Holidays & school events': 'الإجازات وفعاليات المدرسة',
    'Exam right & wrong': 'أسئلة الاختبارات', 'Goals': 'الأهداف', 'Qualifications': 'الشهادات والاختبارات الدولية', 'Careers & paths': 'المهن والمسارات', 'Achievements': 'الإنجازات',
    'School diary': 'سجل المدرسة', 'School meetings': 'اجتماعات المدرسة', 'Contacts': 'جهات الاتصال', 'Study hours': 'ساعات المذاكرة', 'Reading & books': 'القراءة والكتب',
    'Sick records': 'سجل المرض', 'Lunch box': 'صندوق الغداء', 'Payments': 'المدفوعات', 'Private courses': 'الدروس الخصوصية', 'Company reimbursement': 'تعويض الشركة',
    'Family events': 'أحداث العائلة', 'Photos': 'الصور', 'Documents': 'المستندات', 'Child profiles': 'ملفات الأبناء', 'Accounts': 'الحسابات', 'Credentials': 'بيانات الدخول',
    'Settings': 'الإعدادات', 'My page': 'صفحتي', 'My calendar': 'تقويمي', 'My password': 'كلمة المرور', 'My future path': 'مساري المستقبلي', 'Parent': 'ولي الأمر', 'Child': 'الابن / الابنة',
    'Sign out': 'تسجيل الخروج', 'Show amounts': 'إظهار المبالغ', 'Hide amounts': 'إخفاء المبالغ', 'Switch to dark mode': 'الوضع الداكن', 'Switch to light mode': 'الوضع الفاتح',
    'Dark mode': 'الوضع الداكن', 'Light mode': 'الوضع الفاتح', 'Language': 'اللغة', 'Something went wrong on this page:': 'حدث خطأ في هذه الصفحة:',
    'This page is locked': 'هذه الصفحة مقفلة', 'Enter your PIN to open it. It locks again after 5 minutes or when the app is minimised.': 'أدخل الرمز السري لفتحها. تُقفل مجدداً بعد 5 دقائق أو عند تصغير التطبيق.',
    'Enter PIN': 'إدخال الرمز السري', 'Create a PIN': 'إنشاء رمز سري', 'Merged with changes from another PC': 'تم الدمج مع تغييرات من جهاز آخر', 'Could not save:': 'تعذر الحفظ:', 'Could not start:': 'تعذر التشغيل:',

    // ---------------- common words and buttons ----------------
    'Save': 'حفظ', 'Cancel': 'إلغاء', 'Delete': 'حذف', 'Edit': 'تعديل', 'Close': 'إغلاق', 'Yes': 'نعم', 'No': 'لا', 'OK': 'موافق', 'Done': 'تم', 'Back': 'رجوع', 'Next': 'التالي',
    'Continue': 'متابعة', 'Open': 'فتح', 'Print': 'طباعة', 'Copy': 'نسخ', 'Remove': 'إزالة', 'Restore': 'استعادة', 'Replace': 'استبدال', 'Keep both': 'الإبقاء على الاثنين',
    'Change': 'تغيير', 'Show': 'إظهار', 'Show more': 'عرض المزيد', 'Show less': 'عرض أقل', 'Please confirm': 'يرجى التأكيد', 'Saved': 'تم الحفظ', 'Not now': 'ليس الآن',
    'Today': 'اليوم', 'Date': 'التاريخ', 'Notes': 'ملاحظات', 'Note': 'ملاحظة', 'Name': 'الاسم', 'Title': 'العنوان', 'Type': 'النوع', 'Status': 'الحالة', 'Subject': 'المادة',
    'Year': 'السنة', 'Term': 'الفصل', 'Week': 'الأسبوع', 'From': 'من', 'To': 'إلى', 'Until': 'حتى', 'Start': 'البداية', 'End': 'النهاية', 'Details': 'التفاصيل', 'Description': 'الوصف',
    'Amount': 'المبلغ', 'Category': 'الفئة', 'File': 'ملف', 'No file': 'لا يوجد ملف', 'Choose file...': 'اختيار ملف...', 'Choose...': 'اختر...', 'Everyone': 'الجميع', 'All': 'الكل',
    'Other': 'أخرى', 'None': 'لا شيء', 'Unknown': 'غير معروف', 'Yes / no': 'نعم / لا', 'Update': 'تحديث', 'Updated': 'محدَّث', 'Deleted': 'محذوف', 'Overview': 'نظرة عامة',
    'Profile': 'الملف الشخصي', 'Search announcements': 'البحث في الإعلانات', 'Previous month': 'الشهر السابق', 'Next month': 'الشهر التالي', 'Label': 'التسمية', 'Row': 'صف',
    'Mark': 'الدرجة', 'Marks': 'الدرجات', 'Average': 'المعدل', 'Overall': 'المعدل العام', 'Right': 'صحيح', 'Wrong': 'خطأ', 'Right?': 'صحيح؟', 'Score': 'النتيجة', 'Out of': 'من أصل',
    'Questions': 'الأسئلة', 'Topic': 'الموضوع', 'Topic / skill': 'الموضوع / المهارة', 'Exam': 'اختبار', 'Test': 'اختبار قصير', 'Quiz': 'اختبار سريع', 'Project': 'مشروع', 'Oral': 'شفهي',
    'Final': 'نهائي', 'Mid Term': 'منتصف الفصل', 'Test 1': 'اختبار 1', 'Test 2': 'اختبار 2', 'Test 3': 'اختبار 3', 'Term 1': 'الفصل الأول', 'Term 2': 'الفصل الثاني', 'Term 3': 'الفصل الثالث',
    'Full year': 'السنة كاملة', 'Academic year': 'العام الدراسي', 'Academic year (optional)': 'العام الدراسي (اختياري)', 'Term (optional)': 'الفصل (اختياري)', 'Child (optional)': 'الابن (اختياري)',
    'Subject (optional)': 'المادة (اختياري)', 'Date (optional)': 'التاريخ (اختياري)', 'Phone': 'الهاتف', 'Email': 'البريد الإلكتروني', 'Role': 'الدور', 'Reason': 'السبب', 'Method': 'الطريقة',
    'Hours': 'الساعات', 'Minutes': 'الدقائق', 'Pages': 'الصفحات', 'Book': 'كتاب', 'Books': 'الكتب', 'Photo': 'صورة', 'Picture': 'الصورة', 'Caption': 'الوصف', 'Album': 'الألبوم',
    'Album (optional)': 'الألبوم (اختياري)', 'Tips': 'نصائح', 'Log': 'تسجيل', 'Lunch': 'الغداء', 'Health': 'الصحة', 'Birthday': 'عيد الميلاد', 'Payment': 'دفعة', 'Homework': 'الواجبات',
    'Announcement': 'إعلان', 'Announcements': 'الإعلانات', 'Analysis': 'تحليل', 'Coming up': 'قادم', 'Files': 'الملفات', 'Report': 'تقرير', 'Behaviour': 'السلوك', 'Absence': 'غياب',
    'Exam questions': 'أسئلة الاختبار', 'Important': 'مهم', 'Unread': 'غير مقروء', 'Updates': 'التحديثات', "What's new": 'الجديد', 'Timetable': 'الجدول الدراسي', 'Study files': 'ملفات المذاكرة',
    'Whole week': 'الأسبوع كاملاً', 'All homework': 'كل الواجبات', 'All announcements': 'كل الإعلانات', 'All subjects': 'كل المواد', 'All children': 'كل الأبناء', 'All albums': 'كل الألبومات',
    'All terms': 'كل الفصول', 'All years': 'كل السنوات', 'Light': 'فاتح', 'Dark': 'داكن', 'Theme': 'المظهر', 'English': 'اللغة الإنجليزية', 'Arabic': 'اللغة العربية',
    'Sun': 'الأحد', 'Mon': 'الاثنين', 'Tue': 'الثلاثاء', 'Wed': 'الأربعاء', 'Thu': 'الخميس', 'Fri': 'الجمعة', 'Sat': 'السبت',
    'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة', 'Saturday': 'السبت',
    'today': 'اليوم', 'tomorrow': 'غداً', 'just now': 'الآن', 'Not saved yet.': 'لم يُحفظ بعد.', 'Nothing saved yet.': 'لا شيء محفوظ بعد.', 'Nothing here yet.': 'لا شيء هنا بعد.',
    'Nothing recorded.': 'لا شيء مسجل.', 'None recorded yet.': 'لا شيء مسجل بعد.', 'No entries yet.': 'لا توجد إدخالات بعد.', 'Nothing to do.': 'لا شيء مطلوب.', 'Nothing unusual.': 'لا شيء غير عادي.',
    'Nothing coming up.': 'لا شيء قادم.', 'Nothing on the calendar.': 'لا شيء في التقويم.', 'Loading backups...': 'جارٍ تحميل النسخ الاحتياطية...', 'Starting…': 'جارٍ البدء…', 'Saving…': 'جارٍ الحفظ…',
    'Opening SABIS…': 'جارٍ فتح SABIS…', 'Signing in to SABIS…': 'جارٍ تسجيل الدخول إلى SABIS…', 'Reading the school calendar…': 'جارٍ قراءة تقويم المدرسة…', 'Reading school announcements…': 'جارٍ قراءة إعلانات المدرسة…',

    // ---------------- start-up, sign-in, encryption ----------------
    'Sign in': 'تسجيل الدخول', 'Sign in to continue.': 'سجّل الدخول للمتابعة.', 'Username': 'اسم المستخدم', 'Password': 'كلمة المرور', 'Keep me signed in on this PC': 'إبقائي مسجلاً على هذا الجهاز',
    'Wrong username or password.': 'اسم المستخدم أو كلمة المرور غير صحيحة.', 'A parent needs to sign in once to finish updating the app.': 'يجب أن يسجل أحد الوالدين الدخول مرة واحدة لإكمال تحديث التطبيق.',
    'This version encrypts the family data. A parent signs in once to finish.': 'هذا الإصدار يشفّر بيانات العائلة. يسجل أحد الوالدين الدخول مرة واحدة لإكماله.',
    'Open your family data': 'افتح بيانات العائلة', "Parent's username": 'اسم مستخدم ولي الأمر', 'Unlock': 'فتح', 'Use the recovery key': 'استخدام مفتاح الاسترداد',
    'Forgot the password? Use the recovery key': 'نسيت كلمة المرور؟ استخدم مفتاح الاسترداد', 'Recovery key (for example K7Q2-9HXM-…)': 'مفتاح الاسترداد (مثل K7Q2-9HXM-…)',
    'Unlocked with the recovery key. Sign in now; a parent can set a new password in Accounts.': 'تم الفتح بمفتاح الاسترداد. سجّل الدخول الآن؛ ويمكن لولي الأمر تعيين كلمة مرور جديدة من الحسابات.',
    'We found your family data': 'وجدنا بيانات عائلتك', 'M. Ebrahim Family Hub data is already in your cloud folder. Use it on this PC, or start fresh.': 'بيانات M. Ebrahim Family Hub موجودة في مجلدك السحابي. استخدمها على هذا الجهاز أو ابدأ من جديد.',
    'Start fresh instead': 'البدء من جديد', 'Use this data': 'استخدام هذه البيانات', 'Encrypted': 'مشفّرة', 'Older version': 'إصدار أقدم',
    'Where should the family data live?': 'أين تُحفظ بيانات العائلة؟', 'Pick a cloud folder so every PC can use the same records. Everything is encrypted before it is saved, so Microsoft or Google only see scrambled files.': 'اختر مجلداً سحابياً لتستخدم كل الأجهزة السجلات نفسها. كل شيء يُشفَّر قبل الحفظ، فلا ترى Microsoft أو Google إلا ملفات مشفّرة.',
    'No OneDrive or Google Drive folder was found on this PC. Install one of them and sign in to use the same data on several PCs, or keep the data on this PC for now.': 'لم يُعثر على مجلد OneDrive أو Google Drive على هذا الجهاز. ثبّت أحدهما وسجّل الدخول لاستخدام البيانات نفسها على عدة أجهزة، أو احفظ البيانات على هذا الجهاز الآن.',
    'Create the parent account': 'إنشاء حساب ولي الأمر', 'This password also unlocks the encrypted data on a new PC. Logins for the children can be added afterwards.': 'كلمة المرور هذه تفتح أيضاً البيانات المشفّرة على أي جهاز جديد. يمكن إضافة حسابات الأبناء لاحقاً.',
    'Your name': 'اسمك', 'Repeat password': 'أعد كتابة كلمة المرور', "Start with the children's Term 1 2026-27 reports already loaded": 'البدء بتقارير الفصل الأول 2026-27 للأبناء محمّلة مسبقاً',
    'Create and continue': 'إنشاء ومتابعة', 'Choose a username and a password of at least 6 characters.': 'اختر اسم مستخدم وكلمة مرور من 6 أحرف على الأقل.', 'The two passwords do not match.': 'كلمتا المرور غير متطابقتين.',
    'The two passwords do not match': 'كلمتا المرور غير متطابقتين', 'Save your recovery key': 'احفظ مفتاح الاسترداد', 'Your data is now encrypted': 'بياناتك مشفّرة الآن',
    'If every parent password is ever forgotten, this key is the only way to open the family data. Print it or write it down and keep it somewhere safe, away from the PC.': 'إذا نُسيت كل كلمات مرور الوالدين، فهذا المفتاح هو الطريقة الوحيدة لفتح بيانات العائلة. اطبعه أو دوّنه واحفظه في مكان آمن بعيداً عن الجهاز.',
    "I've saved the recovery key": 'حفظتُ مفتاح الاسترداد', 'Copied - it clears from the clipboard in 30 seconds': 'تم النسخ - سيُمسح من الحافظة بعد 30 ثانية', 'OneDrive': 'OneDrive', 'Google Drive': 'Google Drive',
    'This PC': 'هذا الجهاز', 'the data folder': 'مجلد البيانات',

    // ---------------- PIN ----------------
    'Enter your PIN': 'أدخل الرمز السري', 'Needed for company reimbursement, credentials and amounts.': 'مطلوب لتعويض الشركة وبيانات الدخول والمبالغ.', 'Forgot the PIN?': 'نسيت الرمز السري؟',
    'Wrong PIN': 'رمز سري غير صحيح', 'Too many tries. Wait a minute.': 'محاولات كثيرة. انتظر دقيقة.', 'New PIN': 'الرمز السري الجديد', 'Repeat PIN': 'أعد كتابة الرمز السري', 'Save PIN': 'حفظ الرمز السري',
    'Use 4 to 6 digits.': 'استخدم من 4 إلى 6 أرقام.', 'The two PINs do not match.': 'الرمزان غير متطابقين.', 'PIN saved': 'تم حفظ الرمز السري', 'Reset the PIN': 'إعادة تعيين الرمز السري',
    'Your password': 'كلمة مرورك', 'Wrong password': 'كلمة مرور غير صحيحة', '4 to 6 digits': '4 إلى 6 أرقام', 'Change PIN': 'تغيير الرمز السري', 'Lock now': 'قفل الآن',
    'This PIN protects company reimbursement, credentials and the amounts on Home and the calendar. It works on every PC that uses this family data.': 'يحمي هذا الرمز تعويض الشركة وبيانات الدخول والمبالغ في الرئيسية والتقويم. ويعمل على كل جهاز يستخدم بيانات العائلة.',

    // ---------------- home ----------------
    'Needs attention': 'يحتاج انتباهك', 'Patterns across the children': 'أنماط مشتركة بين الأبناء', 'Coming up (next 3 weeks)': 'القادم (الأسابيع الثلاثة القادمة)', 'Quick actions': 'إجراءات سريعة',
    '+ Add marks': '+ إضافة درجات', '+ Exam date': '+ موعد اختبار', 'Paste exam schedule': 'لصق جدول الاختبارات', '+ Payment': '+ دفعة', '+ School meeting': '+ اجتماع مدرسي', '+ Achievement': '+ إنجاز',
    'Nothing needs your attention right now.': 'لا شيء يحتاج انتباهك الآن.', 'Start by adding the children in Child profiles.': 'ابدأ بإضافة الأبناء من ملفات الأبناء.', 'From school': 'من المدرسة',
    'No announcements yet.': 'لا توجد إعلانات بعد.', 'Homework due soon': 'واجبات قريبة التسليم', 'No marks yet': 'لا توجد درجات بعد', 'sick now': 'مريض الآن', 'Add school details in the profile': 'أضف بيانات المدرسة في الملف الشخصي',
    'birthday today': 'عيد ميلاد اليوم', 'Pattern across the children': 'نمط مشترك بين الأبناء',

    // ---------------- child page ----------------
    'Future path': 'المسار المستقبلي', 'Export PDF': 'تصدير PDF', 'PDF saved in the exports folder': 'تم حفظ ملف PDF في مجلد التصدير', 'Marks this term': 'درجات هذا الفصل', 'Study this week': 'المذاكرة هذا الأسبوع',
    'from the school report': 'من تقرير المدرسة', 'average of the marks': 'متوسط الدرجات', 'What stands out': 'أبرز الملاحظات', 'Action plan': 'خطة العمل', 'Weak topics from marked exams': 'نقاط الضعف من الاختبارات المصححة',
    'Questions for the school': 'أسئلة للمدرسة', 'International comparison': 'مقارنة دولية', 'Reports in this term': 'تقارير هذا الفصل', 'Profile & milestones': 'الملف الشخصي والمحطات',
    '+ Add action': '+ إضافة إجراء', 'Add your own action': 'أضف إجراءً خاصاً بك', 'Action': 'الإجراء', 'remove': 'إزالة', 'US grade': 'التقدير الأمريكي', 'Saudi': 'السعودي', 'IGCSE': 'IGCSE', 'IB': 'IB',
    'Approximate conversions for comparison only; exam boards set their own grade boundaries each session.': 'تحويلات تقريبية للمقارنة فقط؛ تحدد جهات الاختبار حدود الدرجات في كل دورة.',
    'No goals yet. Set a target mark per subject in Goals.': 'لا أهداف بعد. حدّد درجة مستهدفة لكل مادة في الأهداف.', 'met': 'تحقق', 'no marks yet': 'لا درجات بعد',
    'No topic has been missed more than once yet.': 'لم يتكرر الخطأ في أي موضوع أكثر من مرة حتى الآن.', 'Exam question details arrive with "Update from SABIS", or enter marked exams in "Exam right & wrong".': 'تفاصيل أسئلة الاختبارات تصل مع "تحديث من SABIS"، أو أدخل الاختبارات المصححة في "أسئلة الاختبارات".',
    'No reports for this term.': 'لا توجد تقارير لهذا الفصل.', 'Edit marks': 'تعديل الدرجات', 'Delete this report and its marks?': 'حذف هذا التقرير ودرجاته؟',
    'Delete the SABIS marks for this term? They will not come back with the next update.': 'حذف درجات SABIS لهذا الفصل؟ لن تعود مع التحديث القادم.', 'showing': 'معروض', 'Child not found.': 'لم يُعثر على الابن.',
    'Absences this term': 'الغياب هذا الفصل', 'no behaviour notes': 'لا ملاحظات سلوكية', 'Absences and behaviour': 'الغياب والسلوك', 'Absence details': 'تفاصيل الغياب', 'Behaviour notes': 'ملاحظات السلوك',
    'Student life': 'الحياة الطلابية', 'Remarks:': 'ملاحظات:', 'Exam questions from SABIS': 'أسئلة الاختبارات من SABIS', 'Missed topics': 'المواضيع الخاطئة', 'none': 'لا شيء', 'No homework to do.': 'لا توجد واجبات.',
    'Files from SABIS': 'ملفات من SABIS', 'on SABIS': 'على SABIS', 'Weak topics across exams': 'نقاط الضعف عبر الاختبارات', 'Nothing from SABIS yet.': 'لا شيء من SABIS بعد.',
    'Add the grade and school in the profile': 'أضف الصف والمدرسة في الملف الشخصي', 'Date of birth': 'تاريخ الميلاد', 'Next birthday': 'عيد الميلاد القادم', 'Curriculum': 'المنهج', 'Grade / section': 'الصف / الشعبة',
    'School number': 'الرقم المدرسي', 'Interests': 'الاهتمامات', 'Health notes': 'ملاحظات صحية', 'Edit profile': 'تعديل الملف الشخصي', 'darker = top half of the band': 'الأغمق = النصف الأعلى من الفئة', 'below 50': 'أقل من 50',

    // ---------------- school (SABIS) ----------------
    'Update from SABIS': 'تحديث من SABIS', 'Bring in marks, exams, reports, announcements, homework and files from SABIS': 'جلب الدرجات والاختبارات والتقارير والإعلانات والواجبات والملفات من SABIS',
    'Add your SABIS login first': 'أضف بيانات دخول SABIS أولاً', 'The update signs in to SABIS with your parent username and password. Save them once in Credentials (protected by your PIN), then press Update again.': 'يسجّل التحديث الدخول إلى SABIS باسم مستخدم ولي الأمر وكلمة المرور. احفظهما مرة واحدة في بيانات الدخول (محمية بالرمز السري) ثم اضغط تحديث مرة أخرى.',
    'Open Credentials': 'فتح بيانات الدخول', 'Update finished': 'اكتمل التحديث', 'The update did not finish': 'لم يكتمل التحديث', 'Nothing new since the last update.': 'لا جديد منذ التحديث الأخير.',
    'SABIS update finished: nothing new': 'اكتمل تحديث SABIS: لا جديد', 'Open SABIS': 'فتح SABIS', 'Add SABIS login': 'إضافة دخول SABIS', 'Not updated yet.': 'لم يتم التحديث بعد.',
    ' · Daily update is off': ' · التحديث اليومي متوقف', 'One click signs in with your saved parent login, goes through the children, and brings in marks, exam questions, absences and behaviour notes, term reports, the school calendar, announcements, homework, timetables and study files. It only reads SABIS and never changes anything there.': 'بضغطة واحدة يسجّل الدخول ببيانات ولي الأمر المحفوظة، ويمر على الأبناء، ويجلب الدرجات وأسئلة الاختبارات والغياب وملاحظات السلوك وتقارير الفصل وتقويم المدرسة والإعلانات والواجبات والجداول وملفات المذاكرة. يقرأ من SABIS فقط ولا يغيّر أي شيء هناك.',
    'What the last update brought in': 'ما جلبه التحديث الأخير', 'Nothing new in the last update.': 'لا جديد في التحديث الأخير.', 'Press "Update from SABIS" to bring everything in.': 'اضغط "تحديث من SABIS" لجلب كل شيء.',
    'Everything else was saved. These parts are tried again next time.': 'تم حفظ كل شيء آخر. ستُعاد محاولة هذه الأجزاء في المرة القادمة.', 'The last update did not finish.': 'لم يكتمل التحديث الأخير.',
    'Marks': 'الدرجات', 'Calendar date': 'موعد في التقويم', 'Update': 'تحديث', 'No announcements match.': 'لا توجد إعلانات مطابقة.', 'No announcements yet. They arrive with "Update from SABIS".': 'لا توجد إعلانات بعد. تصل مع "تحديث من SABIS".',
    'Attachment on SABIS': 'مرفق على SABIS', 'Open on SABIS': 'فتح على SABIS', 'Show finished homework': 'إظهار الواجبات المنجزة', '+ Homework': '+ واجب', 'Finished (kept in this app only)': 'منجز (يُحفظ في هذا التطبيق فقط)',
    'No homework yet. SABIS homework arrives with "Update from SABIS"; you can also add it by hand.': 'لا واجبات بعد. واجبات SABIS تصل مع "تحديث من SABIS"، ويمكنك أيضاً إضافتها يدوياً.', 'due today': 'التسليم اليوم', 'due tomorrow': 'التسليم غداً',
    'No timetable yet. It arrives with "Update from SABIS".': 'لا يوجد جدول بعد. يصل مع "تحديث من SABIS".', 'Not downloaded': 'لم يُحمَّل', 'Save a copy': 'حفظ نسخة', 'On SABIS': 'على SABIS',
    'No study files yet. Exam preparation, PrepList and course practice files arrive with "Update from SABIS".': 'لا ملفات مذاكرة بعد. ملفات التحضير للاختبارات وPrepList والتمارين تصل مع "تحديث من SABIS".',
    'School forms and letters': 'نماذج وخطابات المدرسة', 'Downloading a file from SABIS marks it as read on SABIS, the same as opening it there.': 'تحميل ملف من SABIS يجعله مقروءاً على SABIS، تماماً كفتحه هناك.',
    'Your contact details arrive with "Update from SABIS".': 'بيانات التواصل الخاصة بك تصل مع "تحديث من SABIS".', 'Contact details on SABIS': 'بيانات التواصل على SABIS', 'My contact details': 'بيانات التواصل',
    'Save your SABIS login in Credentials first': 'احفظ بيانات دخول SABIS في بيانات الدخول أولاً', 'Exam preparation': 'التحضير للاختبارات', 'PrepList': 'PrepList', 'Course practice': 'تمارين المادة', 'SABIS': 'SABIS',

    // ---------------- credentials ----------------
    'Add a login': 'إضافة بيانات دخول', 'Edit login': 'تعديل بيانات الدخول', 'For example: school bus app, Classera, Noor, bank': 'مثل: تطبيق الحافلة، Classera، نور، البنك', 'Address (web page)': 'العنوان (صفحة الويب)',
    'Leave empty to keep the saved password': 'اتركه فارغاً للإبقاء على كلمة المرور المحفوظة', 'Used by "Update from SABIS". Stored encrypted; only this app can open it.': 'يستخدمه "تحديث من SABIS". محفوظ مشفّراً؛ ولا يفتحه إلا هذا التطبيق.',
    'Stored encrypted; only this app can open it.': 'محفوظ مشفّراً؛ ولا يفتحه إلا هذا التطبيق.', 'Enter the username': 'أدخل اسم المستخدم', 'Enter the password': 'أدخل كلمة المرور', 'Login saved': 'تم حفظ بيانات الدخول',
    'Show password': 'إظهار كلمة المرور', 'Password copied - it clears from the clipboard in 30 seconds': 'تم نسخ كلمة المرور - ستُمسح من الحافظة بعد 30 ثانية', 'Username copied': 'تم نسخ اسم المستخدم',
    'SABIS – parent': 'SABIS – ولي الأمر', 'SABIS – parent login': 'SABIS – دخول ولي الأمر', '"Update from SABIS" signs in with this login and reads all three children from it.': 'يسجّل "تحديث من SABIS" الدخول بهذه البيانات ويقرأ بيانات الأبناء الثلاثة منها.',
    '+ Add SABIS parent login': '+ إضافة دخول ولي الأمر إلى SABIS', "Children's SABIS logins": 'بيانات دخول الأبناء إلى SABIS', 'Other portals and logins': 'بوابات وبيانات دخول أخرى', '+ Add a login': '+ إضافة بيانات دخول',
    "Each child's own SABIS student login, if they have one. \"Open SABIS as …\" opens it in its own window without signing you out.": 'بيانات دخول الطالب الخاصة بكل ابن على SABIS إن وُجدت. "فتح SABIS باسم …" يفتحها في نافذة مستقلة دون تسجيل خروجك.',
    'Passwords here are encrypted with your family key and stay encrypted in OneDrive or Google Drive. They are only opened on this PC when you press the eye, Copy or Open. Copied passwords are cleared from the clipboard after 30 seconds. This page locks again after 5 minutes.': 'كلمات المرور هنا مشفّرة بمفتاح العائلة وتبقى مشفّرة في OneDrive أو Google Drive، ولا تُفتح على هذا الجهاز إلا عند الضغط على العين أو نسخ أو فتح. تُمسح كلمات المرور المنسوخة من الحافظة بعد 30 ثانية، وتُقفل هذه الصفحة مجدداً بعد 5 دقائق.',

    // ---------------- settings ----------------
    'Family data and cloud': 'بيانات العائلة والسحابة', 'Folder:': 'المجلد:', 'Open folder': 'فتح المجلد', 'Move to another place...': 'نقل إلى مكان آخر...', 'Back up now': 'نسخ احتياطي الآن', 'Backup made': 'تم إنشاء نسخة احتياطية',
    'Backups (encrypted)': 'النسخ الاحتياطية (مشفّرة)', 'Copy records without the cloud': 'نسخ السجلات دون السحابة', 'Export all records...': 'تصدير كل السجلات...', 'Import and combine...': 'استيراد ودمج...',
    'Exported': 'تم التصدير', 'Imported and combined': 'تم الاستيراد والدمج', 'Backup restored': 'تمت استعادة النسخة الاحتياطية', 'No backups yet (one is made automatically each day you use the app).': 'لا نسخ احتياطية بعد (تُنشأ نسخة تلقائياً كل يوم تستخدم فيه التطبيق).',
    'The export file is not encrypted and leaves out saved passwords. Pictures and documents stay in the data folder.': 'ملف التصدير غير مشفّر ولا يتضمن كلمات المرور المحفوظة. تبقى الصور والمستندات في مجلد البيانات.',
    'Your data is kept on this PC only (encrypted). Move it into OneDrive or Google Drive to keep a cloud copy and use it on other PCs.': 'بياناتك محفوظة على هذا الجهاز فقط (مشفّرة). انقلها إلى OneDrive أو Google Drive للاحتفاظ بنسخة سحابية واستخدامها على أجهزة أخرى.',
    'Move the family data': 'نقل بيانات العائلة', 'Everything (records, pictures, documents and backups) moves to the new place, still encrypted. Other PCs then need to open it from the new place.': 'ينتقل كل شيء (السجلات والصور والمستندات والنسخ الاحتياطية) إلى المكان الجديد ويبقى مشفّراً. وعلى الأجهزة الأخرى فتحه من المكان الجديد.',
    'Another folder...': 'مجلد آخر...', 'Move here': 'النقل إلى هنا', 'The family data was moved': 'تم نقل بيانات العائلة', 'Security': 'الأمان', 'PIN for money and credentials': 'الرمز السري للمال وبيانات الدخول',
    'Company reimbursement and Credentials need the PIN, and amounts on Home and the calendar stay hidden until it is entered. It locks again after 5 minutes or when the app is minimised. Payments and private courses stay open.': 'تعويض الشركة وبيانات الدخول يتطلبان الرمز السري، وتبقى المبالغ في الرئيسية والتقويم مخفية حتى إدخاله. يُقفل مجدداً بعد 5 دقائق أو عند تصغير التطبيق. وتبقى المدفوعات والدروس الخصوصية مفتوحة.',
    'Encryption': 'التشفير', 'New recovery key': 'مفتاح استرداد جديد', 'Make a new recovery key? The old one stops working.': 'إنشاء مفتاح استرداد جديد؟ سيتوقف المفتاح القديم عن العمل.', 'Make a new key': 'إنشاء مفتاح جديد',
    'Forget this PC': 'نسيان هذا الجهاز', 'Forget the key on this PC? The app closes the family data, and a parent has to sign in with their password (or the recovery key) to open it again here. Use this before giving the PC away.': 'نسيان المفتاح على هذا الجهاز؟ سيُغلق التطبيق بيانات العائلة، وعلى أحد الوالدين تسجيل الدخول بكلمة مروره (أو مفتاح الاسترداد) لفتحها هنا مجدداً. استخدم هذا قبل التخلي عن الجهاز.',
    'This PC remembers the key to the family data (protected by Windows), so nobody needs to unlock it here again.': 'يتذكر هذا الجهاز مفتاح بيانات العائلة (محمياً بنظام Windows)، فلا حاجة لفتحها هنا مجدداً.',
    'This PC does not remember the key; a parent unlocks the data each time the app starts.': 'لا يتذكر هذا الجهاز المفتاح؛ يفتح أحد الوالدين البيانات عند كل تشغيل.', 'Your new recovery key': 'مفتاح الاسترداد الجديد',
    'Keep it somewhere safe, away from the PC. It opens the family data if every parent password is forgotten. The old key no longer works.': 'احفظه في مكان آمن بعيداً عن الجهاز. يفتح بيانات العائلة إذا نُسيت كل كلمات مرور الوالدين. المفتاح القديم لم يعد يعمل.',
    'Update from SABIS every day by itself': 'التحديث من SABIS تلقائياً كل يوم', 'Runs once a day after the time below, while the app is running (it keeps running in the tray). New things arrive as Windows notifications.': 'يعمل مرة يومياً بعد الوقت أدناه أثناء تشغيل التطبيق (يبقى يعمل بجوار الساعة). ويصل الجديد كإشعارات Windows.',
    'Daily update after': 'التحديث اليومي بعد الساعة', 'Download study files (exam preparation, PrepList and course practice)': 'تحميل ملفات المذاكرة (التحضير للاختبارات وPrepList وتمارين المواد)',
    'Saved by child and subject. Downloading a file marks it as read on SABIS, the same as opening it there.': 'تُحفظ حسب الابن والمادة. تحميل الملف يجعله مقروءاً على SABIS، تماماً كفتحه هناك.', 'SABIS login': 'دخول SABIS',
    'The update only reads SABIS. It never presses Save or sends anything there. Years before 2026-27 are not on SABIS, so keep using Add marks for those.': 'التحديث يقرأ من SABIS فقط، ولا يضغط حفظ ولا يرسل أي شيء. السنوات قبل 2026-27 غير موجودة على SABIS، لذا استمر في استخدام إضافة درجات لها.',
    'Notifications and Windows': 'الإشعارات وWindows', 'Show Windows notifications': 'إظهار إشعارات Windows', 'Upcoming exams, homework, payments (without amounts), birthdays, meetings, findings in new marks, and what each SABIS update brings in.': 'الاختبارات القادمة والواجبات والمدفوعات (دون مبالغ) وأعياد الميلاد والاجتماعات والملاحظات على الدرجات الجديدة وما يجلبه كل تحديث من SABIS.',
    'Send test notification': 'إرسال إشعار تجريبي', 'Sent. You should see it near the clock.': 'تم الإرسال. يجب أن يظهر بجوار الساعة.', 'Windows did not show it. Check Settings > System > Notifications, and that Focus / Do not disturb is off.': 'لم يُظهره Windows. تحقق من الإعدادات > النظام > الإشعارات، وأن وضع التركيز / عدم الإزعاج متوقف.',
    'Check reminders now': 'التحقق من التذكيرات الآن', 'Nothing new to remind you about': 'لا جديد للتذكير به', 'Keep running in the tray when the window is closed': 'الاستمرار بجوار الساعة عند إغلاق النافذة',
    'Needed for reminders and the daily SABIS update. Right-click the tray icon to quit.': 'مطلوب للتذكيرات وتحديث SABIS اليومي. انقر بزر الفأرة الأيمن على الأيقونة للخروج.', 'Start with Windows (quietly, in the tray)': 'التشغيل مع Windows (بهدوء بجوار الساعة)',
    'So reminders arrive even when you have not opened the app.': 'لتصل التذكيرات حتى لو لم تفتح التطبيق.', 'Tray icon hidden? ': 'الأيقونة مخفية؟ ', 'Tray icon hidden?': 'الأيقونة مخفية؟',
    'Windows 11 hides new tray icons under the ^ arrow near the clock. To keep it visible: Settings > Personalisation > Taskbar > Other system tray icons, then turn on M. Ebrahim Family Hub. You can also drag the icon from the ^ area onto the taskbar.': 'يخفي Windows 11 الأيقونات الجديدة تحت السهم ^ بجوار الساعة. لإظهارها: الإعدادات > التخصيص > شريط المهام > أيقونات علبة النظام الأخرى، ثم فعّل M. Ebrahim Family Hub. ويمكنك أيضاً سحب الأيقونة من منطقة ^ إلى شريط المهام.',
    'Look and language': 'المظهر واللغة', 'Each login keeps its own choice. The buttons at the top of every page do the same.': 'لكل حساب اختياره الخاص. والأزرار أعلى كل صفحة تؤدي الشيء نفسه.',
    'General': 'عام', 'Title shown in the app': 'العنوان الظاهر في التطبيق', 'Currency': 'العملة', 'School weekend': 'عطلة نهاية الأسبوع المدرسية', 'Friday and Saturday': 'الجمعة والسبت', 'Saturday and Sunday': 'السبت والأحد',
    'Used to count school days missed when sick.': 'تُستخدم لحساب أيام الدراسة الفائتة عند المرض.', 'These decide what the app flags in the reports and reminders.': 'تحدد هذه ما ينبّه إليه التطبيق في التقارير والتذكيرات.',
    'A subject is "low" below': 'تُعد المادة "منخفضة" تحت', 'Default 70.': 'الافتراضي 70.', 'Flag a drop of at least (points)': 'التنبيه على انخفاض لا يقل عن (درجات)', 'Default 8: a subject falling this much across a term is flagged.': 'الافتراضي 8: يُنبَّه على المادة التي تنخفض بهذا القدر خلال الفصل.',
    'Remind me this many days before exams and payments': 'ذكّرني قبل الاختبارات والمدفوعات بعدد الأيام', 'Default 3.': 'الافتراضي 3.', 'Used by the Company reimbursement page (parents only, behind the PIN).': 'تستخدمها صفحة تعويض الشركة (للوالدين فقط، خلف الرمز السري).',
    'Limit (all children together)': 'الحد الأعلى (لكل الأبناء معاً)', 'Company pays this % of each invoice': 'نسبة ما تدفعه الشركة من كل فاتورة', 'Default 66.67, which the app treats as exactly two thirds.': 'الافتراضي 66.67، ويعامله التطبيق كالثلثين تماماً.',
    'The limit applies': 'يُطبق الحد', 'Per academic year (Aug-Jul)': 'لكل عام دراسي (أغسطس-يوليو)', 'Per calendar year (Jan-Dec)': 'لكل سنة ميلادية (يناير-ديسمبر)', 'One limit for all years': 'حد واحد لكل السنوات',
    'Reading marks from pictures': 'قراءة الدرجات من الصور', 'Learned digit samples: ': 'عينات الأرقام المتعلَّمة: ', 'Learned digit samples:': 'عينات الأرقام المتعلَّمة:', 'Reset learning': 'إعادة ضبط التعلّم',
    "For years that are not on SABIS. Every time you check and save marks read from a picture, the reader learns the digits you confirmed, so it gets more accurate with your school's report style.": 'للسنوات غير الموجودة على SABIS. في كل مرة تراجع فيها الدرجات المقروءة من صورة وتحفظها، يتعلم القارئ الأرقام التي أكدتها فيصبح أدق مع نمط تقارير مدرستك.',
    'Forget everything the reader has learned? It goes back to its built-in samples.': 'نسيان كل ما تعلّمه القارئ؟ سيعود إلى عيناته الأساسية.', 'Forget': 'نسيان', 'About': 'حول التطبيق',
    'Change limit / share': 'تغيير الحد / النسبة',

    // ---------------- accounts ----------------
    "Children's logins": 'حسابات الأبناء', 'One click makes a username and an easy-to-read password, ready to print or copy.': 'بضغطة واحدة يُنشأ اسم مستخدم وكلمة مرور سهلة القراءة، جاهزة للطباعة أو النسخ.', 'Logins': 'الحسابات',
    'New password + card': 'كلمة مرور جديدة + بطاقة', 'Make a new easy password and show the login card': 'إنشاء كلمة مرور سهلة جديدة وإظهار بطاقة الدخول', 'Set password': 'تعيين كلمة المرور', '+ Add login': '+ إضافة حساب',
    'What children can do': 'ما يمكن للأبناء فعله', 'See only their own marks, charts, action plan, goals and future path.': 'رؤية درجاتهم ورسومهم البيانية وخطة العمل والأهداف والمسار المستقبلي فقط.',
    'See their own homework, timetable, study files and the school announcements meant for their grade.': 'رؤية واجباتهم وجدولهم وملفات مذاكرتهم وإعلانات المدرسة الخاصة بصفهم.',
    'Log their daily study hours, reading and lunch box, and tick off their own actions.': 'تسجيل ساعات المذاكرة اليومية والقراءة وصندوق الغداء، وإنجاز إجراءاتهم.',
    'They cannot see the other children, payments, the company reimbursement, credentials, the school diary, meetings, contacts or settings.': 'لا يمكنهم رؤية بقية الأبناء ولا المدفوعات ولا تعويض الشركة ولا بيانات الدخول ولا سجل المدرسة ولا الاجتماعات ولا جهات الاتصال ولا الإعدادات.',
    "Tip: on a child's own PC, sign in once with their login and tick \"Keep me signed in\". Reminders on that PC then cover only that child.": 'نصيحة: على جهاز الابن، سجّل الدخول مرة بحسابه وفعّل "إبقائي مسجلاً". عندها تقتصر التذكيرات على ذلك الجهاز على هذا الابن.',
    'Child (sees only their own page)': 'ابن (يرى صفحته فقط)', 'Parent (sees everything)': 'ولي أمر (يرى كل شيء)', 'Name shown': 'الاسم الظاهر', 'Create login': 'إنشاء الحساب', 'Login created': 'تم إنشاء الحساب',
    'At least 6 characters for a parent (it also unlocks the family data on a new PC), 4 for a child.': '6 أحرف على الأقل لولي الأمر (وتفتح أيضاً بيانات العائلة على جهاز جديد)، و4 للابن.', 'Choose a username': 'اختر اسم مستخدم',
    'That username is taken': 'اسم المستخدم مستخدم مسبقاً', 'Password changed': 'تم تغيير كلمة المرور', 'Password changed.': 'تم تغيير كلمة المرور.', 'Repeat': 'أعد الكتابة', 'New password': 'كلمة المرور الجديدة',
    'Change my password': 'تغيير كلمة المرور', 'Current password': 'كلمة المرور الحالية', 'Repeat new password': 'أعد كتابة كلمة المرور الجديدة', 'Change password': 'تغيير كلمة المرور',
    'The current password is not right.': 'كلمة المرور الحالية غير صحيحة.', 'The two new passwords do not match.': 'كلمتا المرور الجديدتان غير متطابقتين.', 'Print card': 'طباعة البطاقة', 'parent': 'ولي أمر',

    // ---------------- calendar ----------------
    '+ Holiday or event': '+ إجازة أو فعالية', 'exam': 'اختبار', 'homework': 'واجب', 'holiday': 'إجازة', 'event': 'فعالية', 'payment': 'دفعة', 'birthday': 'عيد ميلاد', 'meeting': 'اجتماع', 'qualification': 'شهادة', 'course': 'درس', 'sick': 'مرض',
    'Everyone ': 'الجميع ', 'Paste an exam schedule': 'لصق جدول اختبارات', 'Child (unless the line names one)': 'الابن (ما لم يُذكر في السطر)', 'Add to calendar': 'إضافة إلى التقويم', 'No dates recognised': 'لم يُتعرف على أي تاريخ',
    "One exam per line: date, subject, what. Dates like 2026-12-06, 06/12/2026 or 6 Dec 2026. Start a line with a child's name to set the child for that line.": 'اختبار واحد في كل سطر: التاريخ، المادة، الوصف. تواريخ مثل 2026-12-06 أو 06/12/2026 أو 6 Dec 2026. ابدأ السطر باسم الابن لتحديده لذلك السطر.',

    // ---------------- add marks ----------------
    "This year's marks come straight from SABIS with one click. Use this page for earlier years, other schools or anything SABIS does not have.": 'درجات هذا العام تأتي مباشرة من SABIS بضغطة واحدة. استخدم هذه الصفحة للسنوات السابقة أو المدارس الأخرى أو أي شيء غير موجود على SABIS.',
    'From a photo or screenshot': 'من صورة أو لقطة شاشة', 'Choose picture...': 'اختيار صورة...', 'From one SABIS page': 'من صفحة واحدة في SABIS', 'Read marks from page': 'قراءة الدرجات من الصفحة', 'Capture page': 'التقاط الصفحة',
    'Opens SABIS inside the app, signed in with your saved parent login. Open the page with the marks, then read it straight from the page (exact) or capture it.': 'يفتح SABIS داخل التطبيق مسجلاً ببيانات ولي الأمر المحفوظة. افتح صفحة الدرجات ثم اقرأها مباشرة من الصفحة (بدقة) أو التقطها.',
    'Pick a photo of the printed report or a screenshot of the portal, drag it here, or press Ctrl+V after taking a screenshot (Windows + Shift + S). The app reads it offline and shows everything for checking; unsure marks are highlighted.': 'اختر صورة للتقرير المطبوع أو لقطة شاشة للبوابة، أو اسحبها هنا، أو اضغط Ctrl+V بعد التقاط الشاشة (Windows + Shift + S). يقرأها التطبيق دون إنترنت ويعرض كل شيء للمراجعة، مع تمييز الدرجات غير المؤكدة.',
    'Type marks: quick': 'إدخال الدرجات: سريع', 'Type marks: detailed': 'إدخال الدرجات: تفصيلي', 'Start quick entry': 'بدء الإدخال السريع', 'Start detailed entry': 'بدء الإدخال التفصيلي',
    'One mark per subject, for old report cards that only show final grades (good for past years).': 'درجة واحدة لكل مادة، للشهادات القديمة التي تُظهر الدرجات النهائية فقط (مناسب للسنوات الماضية).',
    'A full grid of subjects and tests, the same as the review screen.': 'جدول كامل بالمواد والاختبارات، مثل شاشة المراجعة.', 'Save marks': 'حفظ الدرجات', 'There are no marks to save': 'لا توجد درجات للحفظ',
    'There is already a report for this term': 'يوجد تقرير لهذا الفصل مسبقاً', 'Reading the marks from the picture... (about 5-20 seconds)': 'جارٍ قراءة الدرجات من الصورة... (من 5 إلى 20 ثانية تقريباً)', 'Reading the table on the portal page...': 'جارٍ قراءة الجدول في صفحة البوابة...',
    'Capturing the portal page and reading it...': 'جارٍ التقاط صفحة البوابة وقراءتها...', 'That is not a picture': 'هذه ليست صورة', 'Could not read the picture:': 'تعذرت قراءة الصورة:', 'No marks were found in this picture - type them in, or try a sharper picture.': 'لم يُعثر على درجات في هذه الصورة - أدخلها يدوياً أو جرّب صورة أوضح.',
    'Not sure about this one - please check': 'غير متأكد من هذه - يرجى التحقق', 'The picture, for checking (click to zoom):': 'الصورة للمراجعة (انقر للتكبير):', 'Click to zoom in or out': 'انقر للتكبير أو التصغير', 'Open full size': 'فتح بالحجم الكامل',
    '+ Row': '+ صف', '+ Column': '+ عمود', 'Number columns...': 'ترقيم الأعمدة...', 'Number the mark columns': 'ترقيم أعمدة الدرجات', 'First number': 'الرقم الأول', 'Copy subject names from last report': 'نسخ أسماء المواد من آخر تقرير',
    'No earlier report for this child': 'لا يوجد تقرير سابق لهذا الابن', 'Subject names copied in the same order - check they line up': 'تم نسخ أسماء المواد بالترتيب نفسه - تحقق من تطابقها', 'Overall on report (optional)': 'المعدل العام في التقرير (اختياري)',
    'Course': 'المادة', '(part, e.g. Grammar)': '(الجزء، مثل القواعد)', 'course total': 'مجموع المادة', 'Typed in': 'مُدخل يدوياً', 'Typed in (final marks)': 'مُدخل يدوياً (درجات نهائية)', 'Photo / screenshot': 'صورة / لقطة شاشة',
    'School portal page': 'صفحة البوابة المدرسية', 'Same as last time': 'كالمرة السابقة', 'Choose the child first': 'اختر الابن أولاً', 'Choose the report photo or screenshot': 'اختر صورة التقرير أو لقطة الشاشة', 'Images': 'الصور',
    'Type 72* for a starred mark. "Course total" rows hold a course\'s overall mark per column (portal style); "average" columns hold the averages printed on the report.': 'اكتب 72* للدرجة ذات النجمة. صفوف "مجموع المادة" تحمل الدرجة العامة للمادة في كل عمود (بأسلوب البوابة)؛ وأعمدة "المعدل" تحمل المعدلات المطبوعة في التقرير.',

    // ---------------- money ----------------
    'Company share used': 'المستخدم من حصة الشركة', 'Remaining limit': 'المتبقي من الحد', 'Received from company': 'المستلم من الشركة', 'You pay yourselves': 'ما تدفعونه بأنفسكم', '+ Eligible invoice': '+ فاتورة مؤهلة',
    'No eligible invoices yet. Tick "Company reimbursement applies" on a payment, or add one here.': 'لا فواتير مؤهلة بعد. فعّل "يشملها تعويض الشركة" في الدفعة، أو أضف واحدة هنا.', 'Invoice': 'الفاتورة', 'Claim': 'المطالبة', 'Received': 'المستلم',
    'capped by limit': 'محدود بالسقف', 'not submitted': 'لم تُقدَّم', 'submitted': 'مقدَّمة', 'approved': 'مقبولة', 'paid': 'مدفوعة', 'rejected': 'مرفوضة', 'Two thirds': 'الثلثان', 'SAR': 'ريال',
    'pending': 'معلّق', 'partly paid': 'مدفوعة جزئياً', 'Pending': 'معلّق', 'Paid on': 'تاريخ الدفع', 'Due date': 'تاريخ الاستحقاق', 'Due': 'الاستحقاق', 'Company reimbursement applies': 'يشملها تعويض الشركة',
    'Claim status': 'حالة المطالبة', 'Claim submitted on': 'تاريخ تقديم المطالبة', 'Amount received from company': 'المبلغ المستلم من الشركة', 'Received on': 'تاريخ الاستلام', 'Invoice number': 'رقم الفاتورة',
    'Receipt / invoice file': 'ملف الإيصال / الفاتورة', 'Amount paid (if partly)': 'المبلغ المدفوع (إن كان جزئياً)', 'Amount (SAR)': 'المبلغ (ريال)', 'School fees': 'الرسوم الدراسية', 'Tuition': 'الرسوم الدراسية',
    'Books / supplies': 'الكتب / المستلزمات', 'Uniform': 'الزي المدرسي', 'Transport / bus': 'النقل / الحافلة', 'Activities / trips': 'الأنشطة / الرحلات', 'Exam fees': 'رسوم الاختبارات', 'Private course': 'درس خصوصي',
    'Private course (optional)': 'درس خصوصي (اختياري)', 'Registration': 'التسجيل', 'Cash': 'نقداً', 'Card': 'بطاقة', 'Bank transfer': 'تحويل بنكي', 'Cheque': 'شيك', 'Receipt': 'إيصال',

    // ---------------- health, lunch, study, reading ----------------
    '+ Record sickness': '+ تسجيل مرض', 'Sick from': 'مريض من', 'Until (leave empty while still sick)': 'حتى (اتركه فارغاً ما دام مريضاً)', 'Illness / symptoms': 'المرض / الأعراض', 'Highest temperature (°C)': 'أعلى حرارة (°م)',
    'Doctor / clinic': 'الطبيب / العيادة', 'Doctor visit on': 'زيارة الطبيب في', 'What the doctor said': 'ما قاله الطبيب', 'Medicine (name, dose, how often, until when)': 'الدواء (الاسم، الجرعة، عدد المرات، حتى متى)',
    'Follow-up appointment': 'موعد المتابعة', 'School days missed (empty = count from the dates)': 'أيام الدراسة الفائتة (فارغ = تُحسب من التواريخ)', 'Medical note given to the school': 'تم تسليم التقرير الطبي للمدرسة',
    'Missed tests / make-up arranged': 'اختبارات فائتة / تم ترتيب الإعادة', 'still sick': 'ما زال مريضاً', 'Back to school today': 'عاد إلى المدرسة اليوم', 'Glad they are better': 'سعداء بتحسنه', 'Times sick': 'مرات المرض',
    'School days missed': 'أيام الدراسة الفائتة', 'Days missed': 'الأيام الفائتة', 'All sick records': 'كل سجلات المرض', 'No doctor visits recorded this year': 'لا زيارات طبية مسجلة هذا العام', 'Medical note for school': 'تقرير طبي للمدرسة',
    'Only parents can see this page. School days missed are counted without weekends and recorded holidays, unless you type the number.': 'هذه الصفحة للوالدين فقط. تُحسب أيام الدراسة الفائتة دون عطل نهاية الأسبوع والإجازات المسجلة، ما لم تكتب العدد.',
    'Log a lunch': 'تسجيل غداء', 'Write what was packed': 'اكتب ما وُضع في الصندوق', 'e.g. cheese sandwich, apple, juice': 'مثل: ساندويتش جبن، تفاحة، عصير', 'How much was eaten': 'كم أُكل منه', 'What came back (separate with commas)': 'ما عاد (افصل بفواصل)',
    'What was packed (separate with commas)': 'ما وُضع في الصندوق (افصل بفواصل)', 'what came back, if anything': 'ما عاد، إن وُجد', 'Canteen money': 'مصروف المقصف', 'Canteen': 'المقصف', 'Lunch box + canteen': 'صندوق غداء + مقصف',
    'All': 'الكل', 'Most': 'معظمه', 'Half': 'نصفه', 'Little': 'قليل', 'Finished the water bottle': 'أنهى قارورة الماء', 'Log a few days to see how much gets eaten.': 'سجّل بضعة أيام لترى كم يُؤكل.',
    'No lunches logged in the last 30 days.': 'لا وجبات غداء مسجلة في آخر 30 يوماً.', 'Last 14 days, today on the right': 'آخر 14 يوماً، واليوم على اليمين', 'canteen / not rated': 'مقصف / غير مُقيَّم', 'Packed': 'المُعبأ', 'Came back': 'ما عاد',
    'Always finished:': 'يُنهى دائماً:', 'Often comes back:': 'كثيراً ما يعود:', 'of the lunch box eaten on average': 'من صندوق الغداء يُؤكل في المتوسط',
    'Write the items the same way each time, separated by commas, so the app can tell which ones get finished and which keep coming back.': 'اكتب الأصناف بالطريقة نفسها كل مرة مفصولة بفواصل، ليعرف التطبيق ما يُنهى وما يعود باستمرار.',
    'How many hours did you study today?': 'كم ساعة ذاكرت اليوم؟', 'Enter the hours studied (e.g. 1.5)': 'أدخل ساعات المذاكرة (مثل 1.5)', 'Logged. Well done!': 'تم التسجيل. أحسنت!', 'Log every day, even a little - your streak shows here.': 'سجّل كل يوم ولو قليلاً - تظهر سلسلتك هنا.',
    'Hours studied': 'ساعات المذاكرة', 'Hours studied each day.': 'ساعات المذاكرة اليومية.', 'Each child logs their study hours from their own login. You can also add entries here.': 'يسجل كل ابن ساعات مذاكرته من حسابه. ويمكنك أيضاً الإضافة هنا.',
    'Short, regular sessions beat one long session before a test.': 'الجلسات القصيرة المنتظمة أفضل من جلسة طويلة قبل الاختبار.', 'Start revising a few days before each exam on your calendar.': 'ابدأ المراجعة قبل كل اختبار في تقويمك ببضعة أيام.',
    'Not logged yet': 'لم يُسجَّل بعد', 'minutes this week': 'دقيقة هذا الأسبوع', 'Daily reading minutes.': 'دقائق القراءة اليومية.', 'Reading log': 'سجل القراءة', 'To read': 'للقراءة', 'Reading': 'يقرأ', 'Finished': 'منتهٍ',
    'Daily reading helps comprehension, the weak spot all three share. Aim for 20-30 minutes a day.': 'القراءة اليومية تقوّي الفهم، وهو نقطة الضعف المشتركة بين الثلاثة. الهدف 20-30 دقيقة يومياً.', 'Author': 'المؤلف', 'E-book file (optional)': 'ملف الكتاب الإلكتروني (اختياري)',
    'What happened in the book (3 sentences)': 'ماذا حدث في الكتاب (3 جمل)', 'Reading list per child, with optional e-book files.': 'قائمة القراءة لكل ابن مع ملفات كتب إلكترونية اختيارية.',
    'log hours in Study hours': 'سجّل الساعات في ساعات المذاكرة',

    // ---------------- careers ----------------
    'Career fields that fit best': 'المجالات المهنية الأنسب', 'Cumulative averages by subject area': 'المعدلات التراكمية حسب مجال المواد', 'Recorded qualifications': 'الشهادات المسجلة', 'not enough subjects yet': 'لا مواد كافية بعد',
    "Each child's leading career fields and path advice. Open a child for details.": 'أبرز المجالات المهنية لكل ابن ونصائح المسار. افتح صفحة الابن للتفاصيل.', 'Add marks to see suggestions.': 'أضف درجات لترى الاقتراحات.',
    'Tick what genuinely interests them; it nudges the suggestions.': 'حدّد ما يهمهم فعلاً؛ فهذا يوجّه الاقتراحات.', 'Record IGCSE subjects, SAT dates, IELTS and others in Qualifications to get advice on each.': 'سجّل مواد IGCSE ومواعيد SAT وIELTS وغيرها في الشهادات للحصول على نصائح لكل منها.',
    'early signal': 'مؤشر مبكر', 'fairly reliable': 'موثوق إلى حد ما', 'not enough marks yet': 'لا درجات كافية بعد',

    // ---------------- record types (schema) ----------------
    'Children ': 'الأبناء ', 'Profiles: birthdays, school details, interests and notes.': 'الملفات: أعياد الميلاد وبيانات المدرسة والاهتمامات والملاحظات.', 'Gender': 'الجنس', 'Girl': 'بنت', 'Boy': 'ولد', 'Order (1 = eldest)': 'الترتيب (1 = الأكبر)',
    'Grade': 'الصف', 'Class / section': 'الفصل / الشعبة', 'School student number': 'الرقم المدرسي للطالب', 'Colour': 'اللون', 'Purple': 'بنفسجي', 'Pink': 'وردي', 'Teal': 'أخضر مزرق', 'Indigo': 'نيلي', 'Brown': 'بني', 'Slate': 'رمادي',
    'Interests (used for career suggestions)': 'الاهتمامات (تُستخدم لاقتراح المهن)', 'Health notes (allergies, medication, doctor)': 'ملاحظات صحية (حساسية، أدوية، طبيب)', 'British / IGCSE': 'بريطاني / IGCSE', 'American': 'أمريكي', 'Saudi national': 'وطني سعودي',
    'Upcoming tests and exams. They show on the calendar and trigger revision reminders.': 'الاختبارات القادمة. تظهر في التقويم وتُطلق تذكيرات المراجعة.', 'Exam date': 'موعد الاختبار', 'What (e.g. Unit 3 test)': 'الوصف (مثل اختبار الوحدة 3)',
    'Start revision reminder (days before)': 'تذكير بدء المراجعة (أيام قبل)', 'Enter each question\'s topic and whether it was right; the app finds weak topics across exams.': 'أدخل موضوع كل سؤال وهل كانت الإجابة صحيحة؛ ويكتشف التطبيق نقاط الضعف عبر الاختبارات.',
    'Marks lost': 'الدرجات المفقودة', 'Add several questions': 'إضافة عدة أسئلة', 'How many questions?': 'كم عدد الأسئلة؟', 'Topic for all (optional)': 'موضوع للجميع (اختياري)', 'marked exam': 'اختبار مصحح',
    'School holidays, school events (many come from SABIS automatically), public holidays and family trips.': 'الإجازات المدرسية وفعاليات المدرسة (كثير منها يأتي تلقائياً من SABIS) والإجازات الرسمية ورحلات العائلة.',
    'School holiday': 'إجازة مدرسية', 'School event': 'فعالية مدرسية', 'Public holiday': 'إجازة رسمية', 'Family vacation': 'إجازة عائلية', 'holiday or event': 'إجازة أو فعالية', 'exam date': 'موعد اختبار',
    'School fees, books, uniform, transport, activities, exam fees and private courses.': 'الرسوم الدراسية والكتب والزي والنقل والأنشطة ورسوم الاختبارات والدروس الخصوصية.', 'Tutors and centres: schedule, fees and attendance.': 'المدرسون والمراكز: المواعيد والرسوم والحضور.',
    'Tutor / centre': 'المدرس / المركز', 'Schedule (e.g. Sun & Tue 5-6 pm)': 'المواعيد (مثل الأحد والثلاثاء 5-6 مساءً)', 'Fee': 'الرسوم', 'Fee (SAR)': 'الرسوم (ريال)', 'Fee type': 'نوع الرسوم', 'Per session': 'للحصة',
    'Monthly': 'شهري', 'Package': 'باقة', 'Sessions': 'الحصص', 'Attended': 'حضر', 'Attended?': 'حضر؟', 'private course': 'درس خصوصي',
    'IGCSE, A-Level, SAT, IELTS/TOEFL, SABIS exams, Qudurat/Tahsili and more: subjects, sessions, fees and results.': 'IGCSE وA-Level وSAT وIELTS/TOEFL واختبارات SABIS والقدرات/التحصيلي وغيرها: المواد والدورات والرسوم والنتائج.',
    'Qualification': 'الشهادة', 'Board / provider': 'الجهة المانحة', 'Tier / level': 'المستوى', 'Exam session (e.g. May/June 2028)': 'دورة الاختبار (مثل مايو/يونيو 2028)', 'Registration deadline': 'آخر موعد للتسجيل',
    'Target grade / score': 'التقدير / الدرجة المستهدفة', 'Predicted': 'المتوقعة', 'Mock result': 'نتيجة الاختبار التجريبي', 'Final result': 'النتيجة النهائية', 'Planned': 'مخطط', 'Registered': 'مسجل', 'Result received': 'وصلت النتيجة',
    'Rescheduled': 'أُعيدت جدولته', 'Core': 'أساسي', 'Extended': 'ممتد', 'Foundation': 'تأسيسي', 'Higher': 'متقدم', 'Standard': 'قياسي',
    'A timeline of things that may affect the children: travel, illness, moves, a tough week at home.': 'خط زمني لما قد يؤثر على الأبناء: سفر، مرض، انتقال، أسبوع صعب في المنزل.', 'What happened': 'ما حدث', 'Children affected': 'الأبناء المتأثرون',
    'Travel': 'سفر', 'Medical': 'طبي', 'Devices': 'أجهزة', 'When schooling moved online or back to in-person, school or class changes, and other school milestones.': 'متى انتقلت الدراسة إلى عن بُعد أو عادت حضورياً، وتغييرات المدرسة أو الفصل، ومحطات مدرسية أخرى.',
    'What changed': 'ما الذي تغيّر', 'Started online learning': 'بدء التعليم عن بُعد', 'Back to in-person': 'العودة للحضوري', 'Hybrid learning': 'تعليم مدمج', 'Changed school': 'تغيير المدرسة',
    'Changed class / section': 'تغيير الفصل / الشعبة', 'Changed curriculum': 'تغيير المنهج', 'diary entry': 'إدخال في السجل',
    'Special moments: competitions, awards, being chosen to represent the school.': 'لحظات مميزة: مسابقات وجوائز والاختيار لتمثيل المدرسة.', 'Achievement': 'الإنجاز', 'Competition': 'مسابقة', 'Award': 'جائزة',
    'Selected to represent the school': 'اختير لتمثيل المدرسة', 'Certificate': 'شهادة', 'Leadership': 'قيادة', 'Sports': 'رياضة', 'Arts': 'فنون', 'Volunteering': 'تطوع', 'Photo or certificate': 'صورة أو شهادة',
    'Invitations from the school, whether you attended, and what was agreed.': 'دعوات المدرسة، وهل حضرت، وما تم الاتفاق عليه.', 'Invited on': 'تاريخ الدعوة', 'Meeting date': 'تاريخ الاجتماع', 'With (teacher, counsellor, principal)': 'مع (المعلم، المرشد، المدير)',
    'Follow-ups agreed': 'المتابعات المتفق عليها', 'Teachers, counsellors, office and tutors.': 'المعلمون والمرشدون والإدارة والمدرسون الخصوصيون.', 'Class teacher': 'معلم الفصل', 'Subject teacher': 'معلم المادة', 'Counsellor': 'المرشد',
    'Principal': 'المدير', 'Admin office': 'الإدارة', 'Tutor': 'مدرس خصوصي', 'Phone / contact': 'الهاتف / التواصل', 'Subject / section': 'المادة / الشعبة', 'study entry': 'إدخال مذاكرة', 'reading entry': 'إدخال قراءة',
    'Notes / topics': 'ملاحظات / مواضيع', 'Family and school photos, by child and album.': 'صور العائلة والمدرسة حسب الابن والألبوم.', 'Report cards, certificates, school letters and other papers.': 'الشهادات والخطابات المدرسية وأوراق أخرى.',
    'Report card': 'الشهادة المدرسية', 'School letter': 'خطاب مدرسي', 'ID / passport copy': 'نسخة الهوية / الجواز', 'Contract': 'عقد', 'Target marks per subject; progress is checked against the latest report.': 'الدرجات المستهدفة لكل مادة؛ ويُقاس التقدم بآخر تقرير.',
    'Target mark': 'الدرجة المستهدفة', 'What went in the lunch box (or canteen money) and how much came back, to see what they really eat.': 'ما وُضع في صندوق الغداء (أو مصروف المقصف) وما عاد منه، لمعرفة ما يأكلونه فعلاً.', 'lunch entry': 'إدخال غداء',
    'Illnesses, school days missed, doctor visits, medicine and the medical note for school.': 'الأمراض وأيام الدراسة الفائتة وزيارات الطبيب والأدوية والتقرير الطبي للمدرسة.', 'sick record': 'سجل مرض',
    'Homework from SABIS (brought in by "Update from SABIS") and any you add yourself.': 'واجبات SABIS (يجلبها "تحديث من SABIS") وأي واجبات تضيفها بنفسك.', 'What': 'الوصف', 'Given on': 'تاريخ الإعطاء',
    'Child (leave empty for all)': 'الابن (اتركه فارغاً للجميع)', 'Subject (as on the report, e.g. Science or English Grammar)': 'المادة (كما في التقرير، مثل العلوم أو قواعد اللغة الإنجليزية)', 'Subject (course / part)': 'المادة (المادة / الجزء)',
    'Please fill in': 'يرجى تعبئة', 'Save changes': 'حفظ التغييرات', 'Daily': 'يومي', 'Periodic': 'دوري', 'Weekly checks (AMS)': 'الاختبارات الأسبوعية (AMS)', 'Started': 'بدأ', 'To do': 'للتنفيذ',

    // ---------------- subjects ----------------
    'Mathematics': 'الرياضيات', 'Math': 'الرياضيات', 'Science': 'العلوم', 'Physics': 'الفيزياء', 'Chemistry': 'الكيمياء', 'Biology': 'الأحياء', 'French': 'اللغة الفرنسية', 'Islamic Studies': 'الدراسات الإسلامية',
    'Islamic studies': 'الدراسات الإسلامية', 'Social Studies': 'الدراسات الاجتماعية', 'Social studies': 'الدراسات الاجتماعية', 'History': 'التاريخ', 'Geography': 'الجغرافيا', 'Computing': 'الحاسب', 'Computer Science': 'علوم الحاسب',
    'ICT': 'تقنية المعلومات', 'Art': 'الفنون', 'Music': 'الموسيقى', 'Physical Education': 'التربية البدنية', 'PE': 'التربية البدنية', 'Quran': 'القرآن الكريم', 'Holy Quran': 'القرآن الكريم', 'Grammar': 'القواعد',
    'English Grammar': 'قواعد اللغة الإنجليزية', 'Reading Comprehension': 'فهم المقروء', 'Comprehension': 'الفهم', 'Vocabulary': 'المفردات', 'Spelling': 'الإملاء', 'Writing': 'الكتابة', 'Literature': 'الأدب',
    'Arabic Language': 'اللغة العربية', 'English Language': 'اللغة الإنجليزية', 'Algebra': 'الجبر', 'Geometry': 'الهندسة', 'Business': 'الأعمال', 'Economics': 'الاقتصاد',
  };

  // ---------------- words used inside patterns ----------------
  const MONTHS = { Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل', May: 'مايو', Jun: 'يونيو', Jul: 'يوليو', Aug: 'أغسطس', Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر' };
  const NAMES = {};
  const SEVERITY = { 'low marks': 'درجات منخفضة', 'a subject is sliding': 'مادة تتراجع', 'a skill gap': 'فجوة في مهارة' };

  // Arabic counting: 1 / 2 (dual) / 3-10 (plural) / 11+ (singular accusative)
  const N = {
    newmark: ['درجة جديدة', 'درجتان جديدتان', 'درجات جديدة', 'درجة جديدة'], mark: ['درجة', 'درجتان', 'درجات', 'درجة'], day: ['يوم', 'يومان', 'أيام', 'يوماً'],
    thing: ['أمر يحتاج انتباهك', 'أمران يحتاجان انتباهك', 'أمور تحتاج انتباهك', 'أمراً يحتاج انتباهك'], subject: ['مادة', 'مادتان', 'مواد', 'مادة'], file: ['ملف', 'ملفان', 'ملفات', 'ملفاً'],
    hw: ['واجب', 'واجبان', 'واجبات', 'واجباً'], newhw: ['واجب جديد', 'واجبان جديدان', 'واجبات جديدة', 'واجباً جديداً'], date: ['موعد', 'موعدان', 'مواعيد', 'موعداً'], newdate: ['موعد جديد', 'موعدان جديدان', 'مواعيد جديدة', 'موعداً جديداً'],
    update: ['تحديث', 'تحديثان', 'تحديثات', 'تحديثاً'], reminder: ['تذكير', 'تذكيران', 'تذكيرات', 'تذكيراً'], exam: ['اختبار', 'اختباران', 'اختبارات', 'اختباراً'], part: ['جزء', 'جزآن', 'أجزاء', 'جزءاً'],
    minute: ['دقيقة', 'دقيقتان', 'دقائق', 'دقيقة'], hour: ['ساعة', 'ساعتان', 'ساعات', 'ساعة'], studyfile: ['ملف مذاكرة جديد', 'ملفا مذاكرة جديدان', 'ملفات مذاكرة جديدة', 'ملف مذاكرة جديداً'],
    report: ['تقرير', 'تقريران', 'تقارير', 'تقريراً'], year: ['سنة دراسية', 'سنتان دراسيتان', 'سنوات دراسية', 'سنة دراسية'], photo: ['صورة', 'صورتان', 'صور', 'صورة'], examdate: ['موعد اختبار', 'موعدا اختبار', 'مواعيد اختبارات', 'موعد اختبار'],
    question: ['سؤال', 'سؤالان', 'أسئلة', 'سؤالاً'], digit: ['رقم', 'رقمان', 'أرقام', 'رقماً'], time: ['مرة', 'مرتان', 'مرات', 'مرة'], absence: ['غياب', 'غيابان', 'حالات غياب', 'حالة غياب'],
    note: ['ملاحظة سلوك', 'ملاحظتا سلوك', 'ملاحظات سلوك', 'ملاحظة سلوك'], announcement: ['إعلان', 'إعلانان', 'إعلانات', 'إعلاناً'],
  };
  function num(n, key) {
    const f = N[key]; const k = Number(n);
    if (!f) return String(n);
    if (k === 1) return `${f[0]} واحد`.replace(/(ة|ات)( [^ ]+)? واحد$/, (x) => x.replace(/ واحد$/, ' واحدة')).replace(/ واحد$/, ' واحد');
    if (k === 2) return f[1];
    if (k >= 3 && k <= 10) return `${k} ${f[2]}`;
    return `${k} ${f[3]}`;
  }

  let lang = 'en';
  const cache = new Map();
  const nm = s => NAMES[s] || s;
  const day = s => String(s).replace(/\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m, d, mo) => `${d} ${MONTHS[mo]}`);
  const sub = s => (D[s] !== undefined ? D[s] : nm(s));
  // "English (65), Science (68) and Math (70)" -> each item translated, Arabic list punctuation
  function list(s) {
    const parts = String(s).split(/, | and /);
    const out = parts.map(p => { const m = p.match(/^(.+?) \(([^)]+)\)$/); return m ? `${item(m[1])} (${item(m[2])})` : item(p); });
    return out.length <= 1 ? out[0] || '' : `${out.slice(0, -1).join('، ')} و${out[out.length - 1]}`;
  }
  const item = s => { const t = core(String(s).trim()); return t === null ? nm(day(String(s).trim())) : t; };
  const P = [];
  const pat = (re, fn) => P.push([re, fn]);

  // ---- counts and short labels
  pat(/^(\d+) things to look at$/, m => num(m[1], 'thing'));
  pat(/^(\d+) below (\d+)$/, m => `${m[1]} أقل من ${m[2]}`);
  pat(/^Below (\d+)$/, m => `أقل من ${m[1]}`);
  pat(/^(\d+) sliding$/, m => `${m[1]} في تراجع`);
  pat(/^(\d+) rising$/, m => `${m[1]} في تحسن`);
  pat(/^(\d+) homework due$/, m => `${num(m[1], 'hw')} مستحقة`);
  pat(/^([\d.]+) h study this week$/, m => `${m[1]} س مذاكرة هذا الأسبوع`);
  pat(/^([\d.]+) h$/, m => `${m[1]} س`);
  pat(/^([\d.]+) h this week · ([\d.]+) h\/day · (.+)$/, m => `${m[1]} س هذا الأسبوع · ${m[2]} س/يوم · ${item(m[3])}`);
  pat(/^(\d+)-day streak$/, m => `سلسلة ${m[1]} أيام`);
  pat(/^no streak yet$/, () => 'لا سلسلة بعد');
  pat(/^next exam (.+)$/, m => `الاختبار القادم ${day(m[1])}`);
  pat(/^birthday in (\d+) days$/, m => `عيد الميلاد بعد ${num(m[1], 'day')}`);
  pat(/^Birthday in (\d+) days$/, m => `عيد الميلاد بعد ${num(m[1], 'day')}`);
  pat(/^(overall|average) · (Term \d|Full year) (\d{4}-\d{2})$/, m => `${m[1] === 'overall' ? 'المعدل العام' : 'المتوسط'} · ${D[m[2]]} ${m[3]}`);
  pat(/^(Term \d|Full year) (\d{4}-\d{2})$/, m => `${D[m[1]]} ${m[2]}`);
  pat(/^(Term \d|Full year) · (\d{4}-\d{2})$/, m => `${D[m[1]]} · ${m[2]}`);
  pat(/^(\d+) subjects$/, m => num(m[1], 'subject'));
  pat(/^(\d+) marks?$/, m => num(m[1], 'mark'));
  pat(/^(\d+) of (\d+) done$/, m => `أُنجز ${m[1]} من ${m[2]}`);
  pat(/^target ([\d.]+)$/, m => `المستهدف ${m[1]}`);
  pat(/^now ([\d.]+)$/, m => `الآن ${m[1]}`);
  pat(/^([\d.]+) to go$/, m => `باقي ${m[1]}`);
  pat(/^Grade (\w+)$/, m => `الصف ${m[1]}`);
  pat(/^Welcome back, (.+)$/, m => `أهلاً بعودتك، ${nm(m[1])}`);
  pat(/^Signed in as (.+)\.$/, m => `مسجّل الدخول باسم ${nm(m[1])}.`);
  pat(/^Future path: (.+)$/, m => `المسار المستقبلي: ${nm(m[1])}`);
  pat(/^Where (.+) stands$/, m => `أين يقف ${nm(m[1])}`);
  pat(/^Where you stand$/, () => 'أين تقف');
  pat(/^No marks yet for (.+)\.$/, m => `لا توجد درجات بعد - ${nm(m[1])}.`);
  pat(/^Overall ([\d.]+)$/, m => `المعدل العام ${m[1]}`);
  pat(/^Updating… (\d+)%$/, m => `جارٍ التحديث… ${m[1]}%`);
  pat(/^(\d+) min ago$/, m => `قبل ${num(m[1], 'minute')}`);
  pat(/^(\d+) h ago$/, m => `قبل ${num(m[1], 'hour')}`);
  pat(/^Last update (.+?)( \(did not finish\))?$/, m => `آخر تحديث ${item(m[1])}${m[2] ? ' (لم يكتمل)' : ''}`);
  pat(/^SABIS checked (.+?)( \(did not finish\))?$/, m => `آخر فحص لـ SABIS ${item(m[1])}${m[2] ? ' (لم يكتمل)' : ''}`);
  pat(/^ · Updates by itself every day after (\d{1,2}:\d{2}) while the app is running$/, m => ` · يتحدث تلقائياً كل يوم بعد الساعة ${m[1]} أثناء تشغيل التطبيق`);
  pat(/^Nothing new in the last update \((.+)\)\.$/, m => `لا جديد في التحديث الأخير (${item(m[1])}).`);
  pat(/^Update (?!from|finished|signs)(.+)$/, m => `تحديث ${item(m[1])}`);
  pat(/^What the last update brought in \((.+)\)$/, m => `ما جلبه التحديث الأخير (${item(m[1])})`);
  pat(/^SABIS update finished: (\d+) new updates?$/, m => `اكتمل تحديث SABIS: ${num(m[1], 'update')}`);
  pat(/^(\d+) parts? could not be read$/, m => `تعذرت قراءة ${num(m[1], 'part')}`);
  pat(/^Mark (\d+) as read$/, m => `تعليم ${m[1]} كمقروء`);
  pat(/^was due (.+)$/, m => `كان مستحقاً ${day(m[1])}`);
  pat(/^due (.+)$/, m => `التسليم ${day(m[1])}`);
  pat(/^from SABIS, (.+)$/, m => `من SABIS، ${item(m[1])}`);
  pat(/^checked (.+)$/, m => `فُحص ${item(m[1])}`);
  pat(/^(\d+) files?$/, m => num(m[1], 'file'));
  pat(/^All files \((\d+)\)$/, m => `كل الملفات (${m[1]})`);
  pat(/^Week (\d+)$/, m => `الأسبوع ${m[1]}`);
  pat(/^Period (\d+)$/, m => `الحصة ${m[1]}`);
  pat(/^Timetable · (\w+)$/, m => `الجدول · ${D[m[1]] || m[1]}`);
  pat(/^(\d+) absences?$/, m => (Number(m[1]) === 0 ? 'لا غياب' : num(m[1], 'absence')));
  pat(/^(\d+) behaviour notes?$/, m => (Number(m[1]) === 0 ? 'لا ملاحظات سلوك' : num(m[1], 'note')));
  pat(/^(\d+)\/(\d+)$/, m => `${m[1]}/${m[2]}`);
  pat(/^A read-only copy, (.+)\. To change anything, use SABIS itself\.$/, m => `نسخة للقراءة فقط، ${item(m[1])}. لتغيير أي شيء استخدم SABIS نفسه.`);
  pat(/^SABIS also lists (.+), who is not in Child profiles, so they were skipped\.$/, m => `يُظهر SABIS أيضاً ${list(m[1])}، وليس ضمن ملفات الأبناء، لذا تم تخطيه.`);
  pat(/^Showing the latest 25 of (\d+)\. All of them count in "Weak topics"\.$/, m => `عرض آخر 25 من ${m[1]}. وكلها تُحتسب في "نقاط الضعف".`);
  pat(/^Nothing from SABIS for (.+) yet\.$/, m => `${nm(m[1])}: لا شيء من SABIS بعد.`);
  pat(/^(\d+) reports? typed in or read from a picture for this term (is|are) kept but no longer counted, because SABIS has the marks\.$/, m => `${m[1]} تقرير مُدخل يدوياً أو مقروء من صورة لهذا الفصل محفوظ لكنه لم يعد يُحتسب، لأن الدرجات موجودة على SABIS.`);
  pat(/^SABIS already has (.+)'s marks for (Term \d|Full year) (\d{4}-\d{2})\. These marks will be kept, but the SABIS ones are what the analysis counts\. Save anyway\?$/, m => `لدى SABIS درجات ${nm(m[1])} في ${D[m[2]]} ${m[3]}. ستُحفظ هذه الدرجات، لكن درجات SABIS هي التي يحتسبها التحليل. هل تريد الحفظ على أي حال؟`);
  pat(/^(.+) already has (a report|\d+ reports) for (Term \d|Full year) (\d{4}-\d{2})\. Replace it with this one\? Keep both only if this picture holds different marks \(for example a second page\), otherwise the marks are counted twice\.$/, m => `لدى ${nm(m[1])} ${m[2] === 'a report' ? 'تقرير' : m[2].replace(' reports', ' تقارير')} في ${D[m[3]]} ${m[4]}. هل تريد استبداله بهذا؟ أبقِ الاثنين فقط إذا كانت هذه الصورة تحتوي على درجات مختلفة (مثل صفحة ثانية)، وإلا ستُحتسب الدرجات مرتين.`);
  pat(/^([\d,.•]+) (SAR|[A-Z]{3})( - (.+))?$/, m => `${m[1]} ${m[2] === 'SAR' ? 'ريال' : m[2]}${m[4] ? ' - ' + nm(m[4]) : ''}`);
  pat(/^(.+) \(([\d,.•]+) (SAR|[A-Z]{3})\)$/, m => `${item(m[1])} (${m[2]} ${m[3] === 'SAR' ? 'ريال' : m[3]})`);
  pat(/^There is no login called "(.*)"\. The parent login is: (.+)$/, m => `لا يوجد حساب باسم "${m[1]}". حساب ولي الأمر هو: ${m[2]}`);
  pat(/^Encrypting (\d+) of (\d+)…$/, m => `جارٍ التشفير ${m[1]} من ${m[2]}…`);
  pat(/^(\d+) files? encrypted$/, m => `تم تشفير ${num(m[1], 'file')}`);
  pat(/^(\d+) encrypted, (\d+) could not be$/, m => `تم تشفير ${m[1]}، وتعذر تشفير ${m[2]}`);
  pat(/^(\d+) files? from version 1 \(pictures, documents and old backups\) (?:is|are) still stored unencrypted\. They open normally\. Encrypting them takes about (\d+) minutes?; the app does one file at a time so antivirus tools don't mistake it for ransomware\.$/,
    m => `${num(m[1], 'file')} من الإصدار 1 (صور ومستندات ونسخ احتياطية قديمة) ما زالت غير مشفّرة، وتفتح بشكل طبيعي. يستغرق تشفيرها نحو ${num(m[2], 'minute')}؛ ويشفّر التطبيق ملفاً واحداً في كل مرة حتى لا تظنه برامج الحماية فيروس فدية.`);
  pat(/^Open SABIS as (.+)$/, m => `فتح SABIS باسم ${nm(m[1])}`);
  pat(/^SABIS – (.+)$/, m => `SABIS – ${nm(m[1])}`);
  pat(/^\+ (.+)'s SABIS login$/, m => `+ دخول ${nm(m[1])} إلى SABIS`);
  pat(/^Make (.+)'s login$/, m => `إنشاء حساب ${nm(m[1])}`);
  pat(/^(.+)'s login$/, m => `حساب ${nm(m[1])}`);
  pat(/^Give this to (.+)\. The password is only shown now; you can make a new one at any time\.$/, m => `أعطِ هذه البطاقة إلى ${nm(m[1])}. تظهر كلمة المرور الآن فقط، ويمكنك إنشاء واحدة جديدة في أي وقت.`);
  pat(/^Make a new password for (.+)\? The old one stops working\.$/, m => `إنشاء كلمة مرور جديدة للحساب ${m[1]}؟ ستتوقف القديمة عن العمل.`);
  pat(/^Remove the login "(.+)"\? Their records stay\.$/, m => `إزالة الحساب "${m[1]}"؟ تبقى سجلاته.`);
  pat(/^Delete the saved login "(.+)"\?$/, m => `حذف بيانات الدخول المحفوظة "${item(m[1])}"؟`);
  pat(/^New password for (.+)$/, m => `كلمة مرور جديدة: ${nm(m[1])}`);
  pat(/^At least (\d+) characters\.$/, m => `${m[1]} أحرف على الأقل.`);
  pat(/^The (new )?password needs at least (\d+) characters\.?$/, m => `تحتاج كلمة المرور ${m[1] ? 'الجديدة ' : ''}إلى ${m[2]} أحرف على الأقل.`);
  pat(/^(\d+) reminders? shown$/, m => `تم عرض ${num(m[1], 'reminder')}`);
  pat(/^Your data is in (OneDrive|Google Drive) and is encrypted before it leaves this PC\. Any PC signed in to the same (?:OneDrive|Google Drive) can open it with a parent's password \(or the recovery key\)\.$/, m => `بياناتك في ${m[1]} وتُشفَّر قبل أن تغادر هذا الجهاز. ويمكن لأي جهاز مسجل في ${m[1]} نفسه فتحها بكلمة مرور أحد الوالدين (أو مفتاح الاسترداد).`);
  pat(/^Your family data is in (.+)\. It is encrypted, so the first time on this PC a parent signs in to unlock it\. After that, this PC remembers it \(protected by Windows\)\.$/, m => `بيانات عائلتك في ${item(m[1])}. وهي مشفّرة، لذا في أول مرة على هذا الجهاز يسجل أحد الوالدين الدخول لفتحها، وبعدها يتذكرها الجهاز (محمية بنظام Windows).`);
  pat(/^(Encrypted|Older version) · last saved (.+)$/, m => `${D[m[1]]} · آخر حفظ ${m[2]}`);
  pat(/^In (\w+)\. Default 100,000\.$/, m => `بعملة ${item(m[1])}. الافتراضي 100,000.`);
  pat(/^M\. Ebrahim Family Hub (.*) · (Windows|\w*) · records encrypted with AES-256$/, m => `M. Ebrahim Family Hub ${m[1]} · ${m[2]} · السجلات مشفّرة بـ AES-256`);
  pat(/^Go back to the backup "(.+)"\? The current data is backed up first, so this can be undone\.$/, m => `العودة إلى النسخة الاحتياطية "${m[1]}"؟ تُنسخ البيانات الحالية أولاً، لذا يمكن التراجع.`);
  pat(/^(Daily|Manual|Cloud copy) (\d{4}-\d{2}-\d{2}.*)$/, m => `${{ Daily: 'يومية', Manual: 'يدوية', 'Cloud copy': 'نسخة سحابية' }[m[1]]} ${m[2]}`);
  pat(/^(\d+) KB$/, m => `${m[1]} ك.ب`);
  pat(/^\+(\d+) more$/, m => `+${m[1]} أخرى`);
  pat(/^Add (.+)$/, m => (D[m[1]] ? `إضافة ${D[m[1]]}` : null));
  pat(/^Edit (.+)$/, m => (D[m[1]] ? `تعديل ${D[m[1]]}` : null));
  pat(/^View (.+)$/, m => (D[m[1]] ? `عرض ${D[m[1]]}` : null));
  pat(/^\+ Add (.+)$/, m => (D[m[1]] ? `+ إضافة ${D[m[1]]}` : null));
  pat(/^Delete this (.+)\?$/, m => (D[m[1]] ? `حذف ${D[m[1]]}؟` : null));
  pat(/^Please fill in "(.+)"$/, m => `يرجى تعبئة "${item(m[1])}"`);
  pat(/^(\d+) exam dates? recognised\.$/, m => `تم التعرف على ${num(m[1], 'examdate')}.`);
  pat(/^(\d+) exam dates added$/, m => `تمت إضافة ${num(m[1], 'examdate')}`);
  pat(/^Saved\. The reader learned from (\d+) digits\.$/, m => `تم الحفظ. تعلّم القارئ من ${m[1]} رقماً.`);
  pat(/^(\d+) highlighted to check$/, m => `${m[1]} مميزة للمراجعة`);
  pat(/^Add (\d+) photos?$/, m => `إضافة ${num(m[1], 'photo')}`);
  pat(/^Company pays (2\/3|1\/3|[\d.]+%) of each eligible invoice, up to ([\d,.]+) (\w+) per (academic year|calendar year|all years together), for all children together\.$/,
    m => `تدفع الشركة ${m[1] === '2/3' ? 'الثلثين' : m[1] === '1/3' ? 'الثلث' : m[1]} من كل فاتورة مؤهلة، حتى ${m[2]} ${item(m[3])} ${m[4] === 'academic year' ? 'لكل عام دراسي' : m[4] === 'calendar year' ? 'لكل سنة ميلادية' : 'لكل السنوات معاً'}، لكل الأبناء معاً.`);
  pat(/^(\w+) of ([\d,.•]+) limit$/, m => `${item(m[1])} من حد ${m[2]}`);
  pat(/^(\w+) · pending ([\d,.•]+)$/, m => `${item(m[1])} · معلّق ${m[2]}`);
  pat(/^(\w+) of ([\d,.•]+) invoiced$/, m => `${item(m[1])} من ${m[2]} مفوترة`);
  pat(/^Limit used: (\d+)%$/, m => `المستخدم من الحد: ${m[1]}%`);
  pat(/^Not yet submitted: ([\d,.]+) (\w+)$/, m => `لم يُقدَّم بعد: ${m[1]} ${item(m[2])}`);
  pat(/^Invoices - (.+)$/, m => `الفواتير - ${m[1]}`);
  pat(/^Company (2\/3|1\/3|[\d.]+%)$/, m => `الشركة ${m[1] === '2/3' ? 'الثلثان' : m[1]}`);
  pat(/^ate (all|most|half|little|none)$/, m => `أكل ${{ all: 'كله', most: 'معظمه', half: 'نصفه', little: 'قليلاً', none: 'لا شيء' }[m[1]]}`);
  pat(/^(\d+)% eaten$/, m => `أُكل ${m[1]}%`);

  // ---- calendar and reminders (analysis.alerts / calendarItems)
  const when = w => (w === 'today' ? 'اليوم' : w === 'tomorrow' ? 'غداً' : w.replace(/^in (\d+) days$/, (x, n) => `بعد ${num(n, 'day')}`));
  pat(/^([A-Z][a-z]+): homework due (today|tomorrow|in 2 days)$/, m => `${nm(m[1])}: واجب مستحق ${when(m[2])}`);
  pat(/^([A-Z][a-z]+): (.+) (today|tomorrow|in \d+ days)$/, m => `${nm(m[1])}: ${item(m[2])} ${when(m[3])}`);
  pat(/^Payment due (today|tomorrow|in \d+ days): (.+)$/, m => `دفعة مستحقة ${when(m[1])}: ${item(m[2])}`);
  pat(/^Overdue: (.+) \((.+)\)$/, m => `متأخرة: ${item(m[1])} (${m[2].replace('SAR', 'ريال')})`);
  pat(/^Was due (\d{4}-\d{2}-\d{2})\.$/, m => `كانت مستحقة في ${m[1]}.`);
  pat(/^School meeting (today|tomorrow|in \d+ days)( - (.+))?$/, m => `اجتماع مدرسي ${when(m[1])}${m[3] ? ' - ' + nm(m[3]) : ''}`);
  pat(/^School meeting( - ([^:]+))?: (.*)$/, m => `اجتماع مدرسي${m[2] ? ' - ' + nm(m[2]) : ''}: ${m[3]}`);
  pat(/^(.+) starts (today|tomorrow|in \d+ days)$/, m => `${item(m[1])} يبدأ ${when(m[2])}`);
  pat(/^Until (\d{1,2} \w{3})\.$/, m => `حتى ${day(m[1])}.`);
  pat(/^Today is (.+)'s birthday \((\d+)\)$/, m => `اليوم عيد ميلاد ${nm(m[1])} (${m[2]})`);
  pat(/^(.+) turns (\d+) in (\d+) days$/, m => `${nm(m[1])} يكمل ${m[2]} عاماً بعد ${num(m[3], 'day')}`);
  pat(/^(.+)'s birthday$/, m => `عيد ميلاد ${nm(m[1])}`);
  pat(/^([A-Z][a-z]+): (low marks|a subject is sliding|a skill gap)$/, m => `${nm(m[1])}: ${SEVERITY[m[2]]}`);
  pat(/^(.+) has been sick for (\d+) days$/, m => `${nm(m[1])} مريض منذ ${num(m[2], 'day')}`);
  pat(/^(.+): follow-up appointment (today|tomorrow|in \d+ days)$/, m => `${nm(m[1])}: موعد متابعة ${when(m[2])}`);
  pat(/^Medical note for school: (.+)$/, m => `تقرير طبي للمدرسة: ${nm(m[1])}`);
  pat(/^(.+) was sick on the day of (.+)$/, m => `كان ${nm(m[1])} مريضاً يوم ${list(m[2])}`);
  pat(/^(.+) brought most of the lunch back on (\d+) of the last (\d+) days$/, m => `أعاد ${nm(m[1])} معظم الغداء في ${m[2]} من آخر ${m[3]} أيام`);
  pat(/^Often comes back: (.+)\.$/, m => `كثيراً ما يعود: ${list(m[1])}.`);
  pat(/^(\d+) school days? missed from (.+)\. Tick "Medical note given to the school" in the sick record once it is done\.$/, m => `${m[1]} أيام دراسة فائتة منذ ${day(m[2])}. فعّل "تم تسليم التقرير الطبي للمدرسة" في سجل المرض عند إتمامه.`);
  pat(/^Since (.+?)( \((.+)\))?\. Add the end date in Sick records when (.+) is better\.$/, m => `منذ ${day(m[1])}${m[3] ? ` (${m[3]})` : ''}. أضف تاريخ الانتهاء في سجل المرض عندما يتحسن ${nm(m[4])}.`);
  pat(/^(.+) sick(: (.+))?$/, m => (NAMES[m[1]] || /^[A-Z][a-z]+$/.test(m[1]) ? `${nm(m[1])} مريض${m[3] ? ': ' + m[3] : ''}` : null));
  pat(/^(.+)'s (.+) for Term (\d) is on SABIS$/, m => `${nm(m[1])}: ${m[2] === 'Report Card' ? 'الشهادة' : m[2] === 'Academic' ? 'التقرير الأكاديمي' : m[2]} للفصل ${m[3]} متاح على SABIS`);

  // ---- SABIS update news (also used for Windows notifications)
  pat(/^New mark for (.+?): (.+)$/, m => `${nm(m[1])}: درجة جديدة ${item(m[2])}`);
  pat(/^(\d+) new marks for (.+)$/, m => `${nm(m[2])}: ${num(m[1], 'newmark')}`);
  pat(/^(.+): (\d+) marks? changed on SABIS$/, m => `${nm(m[1])}: تغيّر ${num(m[2], 'mark')} على SABIS`);
  pat(/^(.+): question details for (\d+) exams?$/, m => `${nm(m[1])}: تفاصيل الأسئلة لـ${num(m[2], 'exam')}`);
  pat(/^(.+): (\d+) new homework$/, m => `${nm(m[1])}: ${num(m[2], 'newhw')}`);
  pat(/^(.+): (\d+) new study files? on SABIS$/, m => `${nm(m[1])}: ${num(m[2], 'studyfile')} على SABIS`);
  pat(/^(.+): (\d+) new absences? recorded \((Term \d)\)$/, m => `${nm(m[1])}: تسجيل ${m[2]} غياب جديد (${D[m[3]]})`);
  pat(/^(.+): a new behaviour note \((Term \d)\)$/, m => `${nm(m[1])}: ملاحظة سلوك جديدة (${D[m[2]]})`);
  pat(/^School calendar: (\d+) new dates?$/, m => `تقويم المدرسة: ${num(m[1], 'newdate')}`);
  pat(/^(.+) – School: (.+)$/, m => `${list(m[1])} – المدرسة: ${m[2]}`);
  pat(/^School: (.+)$/, m => `المدرسة: ${m[1]}`);
  pat(/^(\d+) more updates from SABIS$/, m => `${num(m[1], 'update')} أخرى من SABIS`);
  pat(/^(\d+) more reminders$/, m => `${num(m[1], 'reminder')} أخرى`);
  pat(/^Below (\d+)\.$/, m => `أقل من ${m[1]}.`);
  pat(/^Saved in Documents\.$/, () => 'محفوظ في المستندات.');
  pat(/^Open M\. Ebrahim Family Hub for details\.$/, () => 'افتح M. Ebrahim Family Hub للتفاصيل.');
  pat(/^Open M\. Ebrahim Family Hub to see them all\.$/, () => 'افتح M. Ebrahim Family Hub لرؤيتها كلها.');
  pat(/^Notifications are working\. Reminders will appear like this\.$/, () => 'الإشعارات تعمل. ستظهر التذكيرات بهذا الشكل.');
  pat(/^Still running near the clock$/, () => 'ما زال يعمل بجوار الساعة');
  pat(/^M\. Ebrahim Family Hub keeps running so reminders can arrive\. Right-click its icon near the clock to quit\.$/, () => 'يستمر M. Ebrahim Family Hub في العمل لتصل التذكيرات. انقر بزر الفأرة الأيمن على أيقونته بجوار الساعة للخروج.');
  pat(/^SABIS update did not finish$/, () => 'لم يكتمل تحديث SABIS');
  pat(/^Time to start revision\.$/, () => 'حان وقت بدء المراجعة.');
  pat(/^Reading (.+)'s marks…$/, m => `جارٍ قراءة درجات ${nm(m[1])}…`);
  pat(/^Reading (.+)'s exam questions \((\d+)\/(\d+)\)…$/, m => `جارٍ قراءة أسئلة اختبارات ${nm(m[1])} (${m[2]}/${m[3]})…`);
  pat(/^Checking (.+)'s reports…$/, m => `جارٍ فحص تقارير ${nm(m[1])}…`);
  pat(/^Reading (.+)'s (exam preparation|PrepList) files…$/, m => `جارٍ قراءة ملفات ${m[2] === 'PrepList' ? 'PrepList' : 'التحضير للاختبارات'} - ${nm(m[1])}…`);
  pat(/^Downloading (.+)…$/, m => `جارٍ تحميل ${m[1]}…`);
  pat(/^(\d+) (new marks?|exams? with question details|term reports?|homework|files?|announcements?|calendar dates?)$/, m => {
    const k = { 'new mark': 'newmark', 'new marks': 'newmark', 'exam with question details': 'exam', 'exams with question details': 'exam', 'term report': 'report', 'term reports': 'report', homework: 'hw', file: 'file', files: 'file', announcement: 'announcement', announcements: 'announcement', 'calendar date': 'date', 'calendar dates': 'date' }[m[2]];
    return `${num(m[1], k)}${/exam/.test(m[2]) ? ' بتفاصيل الأسئلة' : ''}`;
  });

  // ---- findings, trends and questions (analysis.termSummary / commonTrends)
  pat(/^(.+) (?:is|are) below (\d+)\.$/, m => `${list(m[1])} أقل من ${m[2]}.`);
  pat(/^(.+) (?:is|are) well below the rest \(overall ([\d.]+)\)\.$/, m => `${list(m[1])} أقل بكثير من بقية المواد (المعدل العام ${m[2]}).`);
  pat(/^(.+) is down: ([\d.]+) → ([\d.]+)\.$/, m => `${item(m[1])} في انخفاض: ${m[2]} ← ${m[3]}.`);
  pat(/^(.+) is sliding: ([\d.]+) → ([\d.]+)( since (.+))?\.$/, m => `${item(m[1])} يتراجع: ${m[2]} ← ${m[3]}${m[5] ? ` منذ ${item(m[5])}` : ''}.`);
  pat(/^(.+) is uneven: marks swing between ([\d.]+) and ([\d.]+), which usually points to particular topics\.$/, m => `${item(m[1])} غير مستقرة: تتأرجح الدرجات بين ${m[2]} و${m[3]}، وهذا يشير عادة إلى مواضيع بعينها.`);
  pat(/^Going up: (.+)\.$/, m => `في تحسن: ${list(m[1])}.`);
  pat(/^Strong: (.+)\.$/, m => `نقاط قوة: ${list(m[1])}.`);
  pat(/^(.+) (?:rests|rest) on only one or two marks, so the next result can move (?:it|them) a lot\.$/, m => `${list(m[1])} تعتمد على درجة أو درجتين فقط، لذا قد تغيّرها النتيجة القادمة كثيراً.`);
  pat(/^(\d+) marks have a star, which on SABIS means below the passing average \(they average ([\d.]+); the other marks average ([\d.]+)\)\.$/, m => `${m[1]} درجات عليها نجمة، وتعني في SABIS أقل من متوسط النجاح (متوسطها ${m[2]}؛ ومتوسط بقية الدرجات ${m[3]}).`);
  pat(/^Off sick during this term: (.+)\. Marks taken just after may not show their usual level\.$/, m => `غياب مرضي خلال هذا الفصل: ${day(m[1])}. الدرجات بعده مباشرة قد لا تعكس المستوى المعتاد.`);
  pat(/^(.+) is strong in (.+) \(([\d.]+)\) but weak in (.+)\. The method that works for (.+) can be reused\.$/, m => `${item(m[1])} قوية في ${item(m[2])} (${m[3]}) لكنها ضعيفة في ${list(m[4])}. يمكن الاستفادة من الأسلوب الناجح في ${item(m[5])}.`);
  pat(/^(.+) is low for (.+)\.$/, m => `${item(m[1])} منخفضة لدى ${list(m[2])}.`);
  pat(/^(.+) is strong for (all of them|.+) \((.+)\)\.$/, m => `${item(m[1])} قوية لدى ${m[2] === 'all of them' ? 'الجميع' : list(m[2])} (${m[3]}).`);
  pat(/^(.+) is a weak or slipping area for (.+?): (.+)\.$/, m => `${item(m[1])} نقطة ضعف أو تراجع لدى ${list(m[2])}: ${m[3]}.`);
  pat(/^Can we see the marked papers for (.+)\?$/, m => `هل يمكننا الاطلاع على الأوراق المصححة في ${list(m[1])}؟`);
  pat(/^How is the overall ([\d.]+) calculated\? It differs from the plain average of the subjects \(([\d.]+)\)\.$/, m => `كيف يُحسب المعدل العام ${m[1]}؟ إنه يختلف عن المتوسط البسيط للمواد (${m[2]}).`);
  pat(/^Tell them you noticed: (.+)\.$/, m => `أخبرهم أنك لاحظت: ${list(m[1])}.`);
  pat(/^(.+) - (.+): (\d+) of (\d+) questions wrong\. Redo them, then practise five similar questions and ask the teacher for a worksheet\.$/, m => `${item(m[1])} - ${m[2]}: ${m[3]} من ${m[4]} أسئلة خاطئة. أعد حلها ثم تدرّب على خمسة أسئلة مشابهة واطلب من المعلم ورقة عمل.`);
  pat(/^(.+): look at the marked paper together and see where the marks went\.$/, m => `${item(m[1])}: راجعوا الورقة المصححة معاً لمعرفة أين ذهبت الدرجات.`);
  pat(/^([^:]+): (.+)$/, m => { const a = core(m[2]); return a === null || D[m[1]] === undefined && !NAMES[m[1]] && !/^[A-Z][\w &]+$/.test(m[1]) ? null : `${item(m[1])}: ${a}`; });
  pat(/^(.+) \(([\d.]+)\)$/, m => { const a = core(m[1]); return a === null ? null : `${a} (${m[2]})`; });
  pat(/^(.+) ([\d.]+)\*? \((.+)\)$/, m => (D[m[1]] ? `${D[m[1]]} ${m[2]} (${item(m[3])})` : null));

  // ---- careers and path advice
  pat(/^Reliability: ([\w ]+)\. Based on (\d+) school years? of marks( \(Grade (\w+)\))?, newer years counting more, plus the interests ticked below\. Treat it as a conversation starter, not a verdict; it firms up as more years are added\.$/,
    m => `درجة الموثوقية: ${item(m[1])}. مبنية على ${num(m[2], 'year')} من الدرجات${m[4] ? ` (الصف ${m[4]})` : ''}، مع وزن أكبر للسنوات الأحدث، إضافة إلى الاهتمامات المحددة أدناه. اعتبرها بداية حوار لا حكماً نهائياً؛ وتزداد دقة مع إضافة سنوات أكثر.`);
  pat(/^Examples: (.+)\.$/, m => `أمثلة: ${item(m[1])}.`);
  pat(/^Usually needs: (.+?)\.( Weakest related subject now: (.+?)\.)?( Matches interests: (.+)\.)?$/, m => `يحتاج عادة: ${list(m[1])}.${m[3] ? ` أضعف مادة مرتبطة حالياً: ${item(m[3])}.` : ''}${m[5] ? ` يطابق الاهتمامات: ${list(m[5])}.` : ''}`);
  pat(/^(.+) ([\d.]+): build school fundamentals first, then SAT practice\.$/, m => `${item(m[1])} ${m[2]}: ابنِ الأساسيات المدرسية أولاً ثم التدرّب على SAT.`);
  pat(/^(.+) ([\d.]+): focus on school (.+) before SAT preparation\.$/, m => `${item(m[1])} ${m[2]}: ركّز على ${item(m[3])} في المدرسة قبل التحضير لـ SAT.`);
  pat(/^(.+) ([\d.]+): good base; targeted practice on weak topics\.$/, m => `${item(m[1])} ${m[2]}: أساس جيد؛ تدرّب على نقاط الضعف تحديداً.`);
  pat(/^(.+) ([\d.]+): strong base; start official practice tests about six months before the test\.$/, m => `${item(m[1])} ${m[2]}: أساس قوي؛ ابدأ الاختبارات التدريبية الرسمية قبل الاختبار بستة أشهر تقريباً.`);
  pat(/^(.+): no marks yet\.$/, m => `${item(m[1])}: لا درجات بعد.`);
  pat(/^English ([\d.]+): build reading and writing for a year before booking the test\.$/, m => `اللغة الإنجليزية ${m[1]}: قوِّ القراءة والكتابة لمدة عام قبل حجز الاختبار.`);
  pat(/^English ([\d.]+): focus on school English first\.$/, m => `اللغة الإنجليزية ${m[1]}: ركّز على اللغة الإنجليزية المدرسية أولاً.`);
  pat(/^English ([\d.]+): likely ready for a high band with a few weeks of exam-format practice\.$/, m => `اللغة الإنجليزية ${m[1]}: جاهز غالباً لنتيجة عالية مع بضعة أسابيع من التدرّب على شكل الاختبار.`);
  pat(/^Exam on (.+): start structured revision 8 weeks before\.$/, m => `الاختبار في ${m[1]}: ابدأ مراجعة منظمة قبله بثمانية أسابيع.`);
  pat(/^Suggested tier: (Extended|Core|Extended with support, or Core)\.$/, m => `المستوى المقترح: ${m[1] === 'Extended' ? 'ممتد' : m[1] === 'Core' ? 'أساسي' : 'ممتد مع دعم، أو أساسي'}.`);
  pat(/^Suggested set: (.+)\.$/, m => `المجموعة المقترحة: ${m[1] === 'add more reports first' ? 'أضف تقارير أكثر أولاً' : list(m[1])}.`);
  pat(/^(.+) tier: (.+)\.$/, m => `المستوى في ${item(m[1])}: ${item(m[2])}.`);
  pat(/^Current science and math averages: (.+)\.$/, m => `معدلات العلوم والرياضيات الحالية: ${list(m[1])}.`);
  pat(/^School average in (.+): ([\d.]+) \(about (.+) on an IGCSE-style scale\)\.$/, m => `المعدل المدرسي في ${item(m[1])}: ${m[2]} (يعادل تقريباً ${m[3]} بسلم IGCSE).`);
  pat(/^Strongest areas so far: (.+)\.$/, m => `أقوى المجالات حتى الآن: ${list(m[1])}.`);
  pat(/^For the leading direction \((.+)\), keep: (.+)\.$/, m => `للتوجه الأبرز (${item(m[1])})، حافظ على: ${list(m[2])}.`);
  pat(/^Mock (.+) vs target (.+): plan revision on the weakest papers first\.$/, m => `التجريبي ${m[1]} مقابل المستهدف ${m[2]}: خطط للمراجعة بدءاً بأضعف الأوراق.`);
  pat(/^(.+) ([\d.]+)$/, m => (D[m[1]] ? `${D[m[1]]} ${m[2]}` : null));

  // ---- action plan sentences (knowledge.ACTIONS) with the subject filled in
  const ACT = [
    ['Daily 20 minutes of reading in {c} (books they choose), then retell it in three sentences.', 'قراءة يومية 20 دقيقة في {c} (كتب يختارونها)، ثم إعادة سردها في ثلاث جمل.'],
    ['Ask the {c} teacher what the comprehension tasks test (main idea, inference, evidence) and what changed recently.', 'اسأل معلم {c} عمّا تقيسه مهام الفهم (الفكرة الرئيسية، الاستنتاج، الدليل) وما الذي تغيّر مؤخراً.'],
    ['10 minutes a day on the current {c} word list with flashcards.', '10 دقائق يومياً على قائمة كلمات {c} الحالية باستخدام البطاقات.'],
    ['Ask the {c} teacher for the upcoming word lists and what the vocabulary tests check.', 'اطلب من معلم {c} قوائم الكلمات القادمة وما تقيسه اختبارات المفردات.'],
  ];
  for (const [en, ar] of ACT) {
    const re = new RegExp('^' + en.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace('{c}', '(.+?)') + '$');
    pat(re, m => ar.replace('{c}', item(m[1])));
  }

  Object.assign(D, {
    'Practise past comprehension questions and answer with evidence from the text.': 'تدرّب على أسئلة فهم سابقة وأجب بأدلة من النص.',
    'A quick spoken vocabulary quiz at home twice a week.': 'اختبار مفردات شفهي سريع في المنزل مرتين أسبوعياً.',
    'Redo the grammar items lost in the last test and write three new sentences for each rule.': 'أعد حل أسئلة القواعد الخاطئة في آخر اختبار واكتب ثلاث جمل جديدة لكل قاعدة.',
    'Ten minutes of grammar practice three times a week.': 'عشر دقائق تدريب على القواعد ثلاث مرات أسبوعياً.',
    "Look-cover-write-check practice on this week's spelling words, 10 minutes a day.": 'تدريب "انظر-غطِّ-اكتب-تحقق" على كلمات الإملاء لهذا الأسبوع، 10 دقائق يومياً.',
    'Write one short paragraph a week and ask the teacher for feedback.': 'اكتب فقرة قصيرة كل أسبوع واطلب ملاحظات المعلم.',
    "Check work against the teacher's marking rubric before handing it in.": 'راجع العمل وفق معايير تصحيح المعلم قبل تسليمه.',
    'Read the set text ahead of class and keep a short notes page per chapter.': 'اقرأ النص المقرر قبل الحصة واحتفظ بصفحة ملاحظات قصيرة لكل فصل.',
    'Find out which topics the low weekly checks covered and redo those exercises.': 'اعرف المواضيع التي غطتها الاختبارات الأسبوعية المنخفضة وأعد حل تمارينها.',
    'Short daily practice on the current unit so weekly checks stay steady.': 'تدريب يومي قصير على الوحدة الحالية لتبقى الاختبارات الأسبوعية مستقرة.',
    'Redo every question lost in the last test before moving on.': 'أعد حل كل سؤال خاطئ في آخر اختبار قبل الانتقال.',
    'Three 30-minute practice sessions a week on the current unit.': 'ثلاث جلسات تدريب أسبوعياً مدة كل منها 30 دقيقة على الوحدة الحالية.',
    'A timed practice test a few days before each test.': 'اختبار تدريبي مؤقت قبل كل اختبار ببضعة أيام.',
    'Go through the marked paper: were marks lost on facts and terms, or on written explanations?': 'راجع الورقة المصححة: هل ضاعت الدرجات في الحقائق والمصطلحات أم في الشرح المكتوب؟',
    'After each lesson, make 5-10 flashcards of key terms and review them twice a week.': 'بعد كل درس، اصنع 5-10 بطاقات للمصطلحات الرئيسية وراجعها مرتين أسبوعياً.',
    'Practise past questions and answer in full sentences.': 'تدرّب على أسئلة سابقة وأجب بجمل كاملة.',
    'Practise calculation questions with units every week; redo lost questions.': 'تدرّب أسبوعياً على المسائل الحسابية مع الوحدات؛ وأعد حل الأسئلة الخاطئة.',
    'Make a formula sheet and test yourself on it before each test.': 'اصنع ورقة قوانين واختبر نفسك عليها قبل كل اختبار.',
    'Flashcards for symbols, equations and key terms; review twice a week.': 'بطاقات للرموز والمعادلات والمصطلحات الرئيسية؛ راجعها مرتين أسبوعياً.',
    'Practise past questions, especially calculations and explanations.': 'تدرّب على أسئلة سابقة، خاصة الحسابات والشرح.',
    'Flashcards for key terms and labelled diagrams; review twice a week.': 'بطاقات للمصطلحات الرئيسية والرسوم الموضّحة؛ راجعها مرتين أسبوعياً.',
    'Practise explaining processes in full sentences.': 'تدرّب على شرح العمليات بجمل كاملة.',
    'Summarise each lesson in five bullet points the same day.': 'لخّص كل درس في خمس نقاط في اليوم نفسه.',
    'Flashcards for key facts, dates and terms; review twice a week.': 'بطاقات للحقائق والتواريخ والمصطلحات الرئيسية؛ راجعها مرتين أسبوعياً.',
    'Practise past questions before each test.': 'تدرّب على أسئلة سابقة قبل كل اختبار.',
    'Review each lesson the same day and test yourself with short questions.': 'راجع كل درس في اليوم نفسه واختبر نفسك بأسئلة قصيرة.',
    'Memorise set passages in small daily portions.': 'احفظ النصوص المقررة على أجزاء يومية صغيرة.',
    '10 minutes a day on the current word list; quiz with a sibling or parent.': '10 دقائق يومياً على قائمة الكلمات الحالية؛ واختبار مع أخ أو أحد الوالدين.',
    'Listen to or read something short in the language three times a week.': 'استمع أو اقرأ شيئاً قصيراً باللغة ثلاث مرات أسبوعياً.',
    'Practise the current topic hands-on on a computer twice a week.': 'تدرّب عملياً على الموضوع الحالي بالحاسب مرتين أسبوعياً.',
    'Summarise each topic with one real-life example.': 'لخّص كل موضوع بمثال واحد من الحياة.',
    'Keep a sketchbook and practise 15 minutes a few times a week.': 'احتفظ بكراسة رسم وتدرّب 15 دقيقة عدة مرات أسبوعياً.',
    'Short regular practice sessions rather than long occasional ones.': 'جلسات تدريب قصيرة منتظمة بدلاً من جلسات طويلة متقطعة.',
    'Keep a simple activity routine and ask the teacher what the assessment covers.': 'حافظ على روتين نشاط بسيط واسأل المعلم عمّا يشمله التقييم.',
    'Look at the marked paper together and find where the marks were lost.': 'راجعوا الورقة المصححة معاً واكتشفوا أين ضاعت الدرجات.',
    'Ask the teacher which topics were covered and how to improve.': 'اسأل المعلم عن المواضيع التي غُطيت وكيفية التحسن.',
    'Which assessments remain this term, and how much does the final count?': 'ما التقييمات المتبقية هذا الفصل، وكم وزن الاختبار النهائي؟',
    'What does AMS measure, and how much does it count?': 'ماذا يقيس AMS، وكم وزنه؟',
    'Which of the starred (below passing average) marks can be retaken, and when?': 'أي الدرجات ذات النجمة (أقل من متوسط النجاح) يمكن إعادتها، ومتى؟',
    'Weekly periodic and AMS results are an early signal: a run of low weekly marks usually shows up later in term exams.': 'نتائج الاختبارات الأسبوعية وAMS مؤشر مبكر: تتابع الدرجات الأسبوعية المنخفضة يظهر عادة لاحقاً في اختبارات الفصل.',
    'Ask the school about a make-up test, then tick "Missed tests / make-up arranged" in the sick record.': 'اسأل المدرسة عن اختبار تعويضي، ثم فعّل "اختبارات فائتة / تم ترتيب الإعادة" في سجل المرض.',
    'Worth asking what they would rather have.': 'يستحق أن تسألهم عمّا يفضلونه.',
    'Career-linked subjects appear once more subjects have marks.': 'تظهر المواد المرتبطة بالمهن عندما تتوفر درجات لمواد أكثر.',
    'Science and math marks will show readiness here.': 'ستُظهر درجات العلوم والرياضيات الجاهزية هنا.', 'Add English marks to get advice.': 'أضف درجات اللغة الإنجليزية للحصول على نصائح.',
    'Most students take the SAT in Grade 11, with a retake option in Grade 12.': 'يقدّم معظم الطلاب اختبار SAT في الصف 11، مع إمكانية الإعادة في الصف 12.',
    'Qudurat tests verbal and maths reasoning; Tahsili tests Math, Physics, Chemistry and Biology for science tracks.': 'القدرات يقيس الاستدلال اللفظي والكمي؛ والتحصيلي يقيس الرياضيات والفيزياء والكيمياء والأحياء للمسار العلمي.',
    'Ask the school which external exams the program offers at their grade (IGCSE, AP, SAT, A-Levels) and when subject choices are made.': 'اسأل المدرسة عن الاختبارات الخارجية المتاحة في صفهم (IGCSE وAP وSAT وA-Levels) ومتى يتم اختيار المواد.',
    'Approximate: real grade boundaries change every exam session.': 'تقريبي: حدود الدرجات الفعلية تتغير في كل دورة.', 'Common US school scale; colleges may recalculate.': 'السلم الأمريكي الشائع؛ وقد تعيد الجامعات الحساب.',
    'Approximate school-style conversion.': 'تحويل تقريبي بأسلوب المدارس.', 'Ministry descriptors.': 'أوصاف الوزارة.', 'Excellent': 'ممتاز', 'Very good': 'جيد جداً', 'Good': 'جيد', 'Pass': 'مقبول', 'Below pass': 'دون النجاح',
    'IGCSE (A*-G)': 'IGCSE (A*-G)', 'US letter / GPA': 'التقدير الأمريكي / GPA', 'IB (1-7)': 'IB (1-7)', 'Saudi scale': 'السلم السعودي',
    // career fields and interests
    'Engineering': 'الهندسة', 'Medicine & health sciences': 'الطب والعلوم الصحية', 'Computer science & IT': 'علوم الحاسب وتقنية المعلومات', 'Business, finance & economics': 'الأعمال والمالية والاقتصاد',
    'Law & international relations': 'القانون والعلاقات الدولية', 'Media, languages & communication': 'الإعلام واللغات والاتصال', 'Education & psychology': 'التعليم وعلم النفس', 'Architecture & design': 'العمارة والتصميم',
    'Pure & environmental sciences': 'العلوم البحتة والبيئية', 'Sharia, Arabic language and literature': 'الشريعة واللغة العربية وآدابها',
    'civil, mechanical, electrical, petroleum, industrial engineering': 'الهندسة المدنية والميكانيكية والكهربائية والبترولية والصناعية', 'medicine, dentistry, pharmacy, nursing, physiotherapy': 'الطب وطب الأسنان والصيدلة والتمريض والعلاج الطبيعي',
    'software engineering, data science, cybersecurity, AI': 'هندسة البرمجيات وعلوم البيانات والأمن السيبراني والذكاء الاصطناعي', 'finance, accounting, management, economics, marketing': 'المالية والمحاسبة والإدارة والاقتصاد والتسويق',
    'law, political science, diplomacy': 'القانون والعلوم السياسية والدبلوماسية', 'journalism, translation, public relations, media production': 'الصحافة والترجمة والعلاقات العامة والإنتاج الإعلامي',
    'teaching, psychology, counselling, special education': 'التدريس وعلم النفس والإرشاد والتربية الخاصة', 'architecture, interior design, graphic and product design': 'العمارة والتصميم الداخلي والجرافيكي وتصميم المنتجات',
    'biology, chemistry, physics, environmental science, research': 'الأحياء والكيمياء والفيزياء وعلوم البيئة والبحث العلمي', 'Problem solving': 'حل المشكلات', 'Building things': 'صنع الأشياء', 'Helping people': 'مساعدة الناس',
    'Technology & coding': 'التقنية والبرمجة', 'Money & business': 'المال والأعمال', 'Debating & justice': 'المناظرة والعدالة', 'Reading & writing': 'القراءة والكتابة', 'Teaching': 'التعليم', 'Drawing & design': 'الرسم والتصميم',
    'Science & experiments': 'العلوم والتجارب', 'Nature & environment': 'الطبيعة والبيئة', 'Leading teams': 'قيادة الفرق', 'Languages': 'اللغات', 'Encouragement': 'التشجيع', 'Health & medicine': 'الصحة والطب',
    'Business & economics': 'الأعمال والاقتصاد', 'Art & design': 'الفن والتصميم', 'Arabic & Islamic studies': 'اللغة العربية والدراسات الإسلامية', 'Foreign language': 'لغة أجنبية', 'Foreign-language vocabulary': 'مفردات اللغة الأجنبية',
    'History / social studies': 'التاريخ / الدراسات الاجتماعية', 'Social studies & history': 'الدراسات الاجتماعية والتاريخ', 'Physical education': 'التربية البدنية', 'Reading': 'القراءة',
    'IGCSE subject choices': 'اختيار مواد IGCSE', 'SAT readiness': 'الجاهزية لاختبار SAT', 'IELTS / TOEFL': 'IELTS / TOEFL', 'Saudi universities (Qudurat / Tahsili)': 'الجامعات السعودية (القدرات / التحصيلي)', 'SABIS track': 'مسار SABIS',
    'Art / design portfolio': 'ملف أعمال الفن / التصميم', 'Qudurat (GAT)': 'القدرات (GAT)', 'Tahsili': 'التحصيلي', 'SABIS exams': 'اختبارات SABIS', 'Cheese sandwich': 'ساندويتش جبن', 'developing': 'في طور التكوّن',
    'Save anyway': 'الحفظ على أي حال', 'Older pictures and documents': 'الصور والمستندات القديمة', 'Encrypt them now': 'تشفيرها الآن',
    'Already encrypting.': 'التشفير جارٍ بالفعل.', 'Unlock the family data first.': 'افتح بيانات العائلة أولاً.', 'Forgot the password?': 'نسيت كلمة المرور؟', 'Choose a new password': 'اختر كلمة مرور جديدة', 'Parent login': 'حساب ولي الأمر', 'Save and continue': 'حفظ ومتابعة',
    'Your records from version 1 are not encrypted yet, so you can choose a new parent password here. The app then encrypts everything with it and shows your recovery key.': 'سجلاتك من الإصدار 1 غير مشفّرة بعد، لذا يمكنك اختيار كلمة مرور جديدة لولي الأمر هنا. ثم يشفّر التطبيق كل شيء بها ويُظهر مفتاح الاسترداد.',
    'At least 6 characters. It also opens the family data on a new PC.': '6 أحرف على الأقل. وتفتح أيضاً بيانات العائلة على جهاز جديد.', 'Choose a password of at least 6 characters.': 'اختر كلمة مرور من 6 أحرف على الأقل.',
    'Wrong password. Check Caps Lock, or use "Forgot the password?" below.': 'كلمة مرور غير صحيحة. تحقق من زر الأحرف الكبيرة، أو استخدم "نسيت كلمة المرور؟" أدناه.', 'Choose one of the parent logins.': 'اختر أحد حسابات ولي الأمر.', 'Recent from SABIS': 'أحدث ما ورد من SABIS', 'Nothing new yet.': 'لا جديد بعد.', '+ Add many': '+ إضافة عدة', '+ Add row': '+ إضافة صف', '+ Add several photos': '+ إضافة عدة صور', 'Add the children first.': 'أضف الأبناء أولاً.', 'Choose photos': 'اختيار الصور',
    'Company': 'الشركة', 'Cost': 'التكلفة', 'Health & lunch': 'الصحة والغداء', 'Last:': 'الأخير:', 'Login': 'الحساب', 'Manual': 'يدوي', 'No photos yet.': 'لا توجد صور بعد.', 'Photos added': 'تمت إضافة الصور',
    'Quick': 'سريع', 'Rating': 'التقييم', 'School contacts': 'جهات اتصال المدرسة', 'School note': 'ملاحظة مدرسية', 'Where': 'المكان', 'not yet': 'ليس بعد', 'Bus': 'الحافلة', 'Mid-term': 'منتصف الفصل',
    'Daily update is off': 'التحديث اليومي متوقف', 'you stand': 'تقف', 'Cloud': 'السحابة', 'Cloud copy': 'نسخة سحابية', '+ Photo': '+ صورة', 'Holiday': 'إجازة', 'Core for now': 'أساسي حالياً', 'Extended if the next term improves, otherwise Core': 'ممتد إذا تحسن الفصل القادم، وإلا فأساسي', 'two sciences': 'مادتا علوم', 'a foreign language': 'لغة أجنبية', 'an exam': 'اختبار',
  });

  // ---------------- engine ----------------
  function core(s) {
    if (D[s] !== undefined) return D[s];
    if (NAMES[s]) return NAMES[s];
    for (const [re, fn] of P) {
      const m = s.match(re);
      if (m) { const out = fn(m); if (out !== null && out !== undefined) return out; }
    }
    return null;
  }

  // ======================= version 3 =======================
  const addD = o => { for (const [k, v] of Object.entries(o)) if (D[k] === undefined) D[k] = v; };
  addD({
    // record names for "+ Add …" and "Delete this …?"
    'achievement': 'إنجاز', 'book': 'كتاب', 'child': 'ابن أو ابنة', 'contact': 'جهة اتصال', 'diary entry': 'مدخل في سجل المدرسة', 'document': 'مستند', 'event': 'حدث',
    'exam date': 'موعد اختبار', 'goal': 'هدف', 'holiday or event': 'إجازة أو فعالية', 'homework': 'واجب', 'lunch entry': 'وجبة غداء', 'marked exam': 'اختبار مصحح',
    'meeting': 'اجتماع', 'payment': 'دفعة', 'photo': 'صورة', 'private course': 'درس خصوصي', 'qualification': 'شهادة', 'reading entry': 'جلسة قراءة',
    'shelf entry': 'كتاب على الرف', 'sick record': 'سجل مرض', 'study entry': 'جلسة مذاكرة', 'sick report': 'بلاغ مرض',
    // sign-in and passwords
    'Who is signing in?': 'من يسجّل الدخول؟', 'No child logins yet': 'لا توجد حسابات للأبناء بعد', '← Parent or child': '← ولي أمر أم ابن',
    'Pick your name first.': 'اختر اسمك أولاً.', 'Wrong password. Check Caps Lock, or use "Forgot password?" below.': 'كلمة المرور غير صحيحة. تحقق من زر الأحرف الكبيرة، أو استخدم «نسيت كلمة المرور؟» بالأسفل.',
    'Forgot password?': 'نسيت كلمة المرور؟', 'Forgot your password?': 'نسيت كلمة المرور؟',
    'Ask Mum or Dad. They can give you a new password in a minute: they sign in, open Accounts and press "New password" next to your name.': 'اطلب من أمك أو أبيك. يمكنهما إعطاؤك كلمة مرور جديدة خلال دقيقة: يسجّلان الدخول ويفتحان «الحسابات» ويضغطان «كلمة مرور جديدة» بجانب اسمك.',
    'A code goes to Mum or Dad by email. When they give it to you, type it here with your new password.': 'يُرسل رمز إلى بريد أمك أو أبيك. عندما يعطيانك إياه، اكتبه هنا مع كلمة المرور الجديدة.',
    'A code goes to your email address. Type it here with your new password.': 'يُرسل رمز إلى بريدك الإلكتروني. اكتبه هنا مع كلمة المرور الجديدة.',
    'Who are you?': 'من أنت؟', 'Send the code to Mum or Dad': 'أرسل الرمز إلى أمي أو أبي', 'Send the code': 'أرسل الرمز', 'Send again': 'أرسل مرة أخرى', 'Sending…': 'جارٍ الإرسال…',
    'Code from the email': 'الرمز من البريد', '6-digit code': 'رمز من 6 أرقام', 'New password again': 'كلمة المرور الجديدة مرة أخرى', 'Type it again': 'اكتبها مرة أخرى',
    'New password (6+ characters)': 'كلمة مرور جديدة (6 أحرف على الأقل)', 'New password (4+ characters)': 'كلمة مرور جديدة (4 أحرف على الأقل)', 'Set new password': 'تعيين كلمة المرور الجديدة',
    'Use the recovery key instead': 'استخدم مفتاح الاسترداد بدلاً من ذلك', 'Send the code first.': 'أرسل الرمز أولاً.', 'The two passwords are different.': 'كلمتا المرور مختلفتان.',
    'New password saved. Sign in with it now.': 'تم حفظ كلمة المرور الجديدة. سجّل الدخول بها الآن.', 'Reset a parent password': 'إعادة تعيين كلمة مرور ولي الأمر', 'Recovery key': 'مفتاح الاسترداد',
    'Use the recovery key you printed or saved when the app was set up. It proves you are a parent, then you choose a new password.': 'استخدم مفتاح الاسترداد الذي طبعته أو حفظته عند إعداد التطبيق. يثبت أنك ولي الأمر، ثم تختار كلمة مرور جديدة.',
    'Tip: a parent can set up password codes by email in Settings → Security.': 'نصيحة: يمكن لولي الأمر إعداد رموز كلمة المرور عبر البريد في الإعدادات ← الأمان.',
    'Email is not set up yet (Settings → Security).': 'لم يتم إعداد البريد بعد (الإعدادات ← الأمان).', 'Gmail did not accept the address or app password. Check them in Settings → Security.': 'لم يقبل Gmail العنوان أو كلمة مرور التطبيق. تحقق منهما في الإعدادات ← الأمان.',
    'No internet connection, so the email could not be sent.': 'لا يوجد اتصال بالإنترنت، لذلك تعذر إرسال البريد.', 'A code was sent less than a minute ago. Check the email, or wait a minute.': 'أُرسل رمز قبل أقل من دقيقة. تحقق من البريد أو انتظر دقيقة.',
    'Too many codes in the last hour. Try again later.': 'رموز كثيرة خلال الساعة الأخيرة. حاول لاحقاً.', 'No parent email address is set (Settings → Security).': 'لم يُحدد بريد لولي الأمر (الإعدادات ← الأمان).',
    'Ask for a code first.': 'اطلب رمزاً أولاً.', 'That code has expired. Ask for a new one.': 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.', 'Too many wrong codes. Ask for a new one.': 'رموز خاطئة كثيرة. اطلب رمزاً جديداً.',
    'That code is not right.': 'الرمز غير صحيح.', 'This parent has no email address set. Use the recovery key instead.': 'لا يوجد بريد لولي الأمر هذا. استخدم مفتاح الاسترداد بدلاً من ذلك.', 'Pick who you are first.': 'اختر من أنت أولاً.',
    'Reader': 'القارئ',
    // menu
    'My goals': 'أهدافي', 'Messages': 'الرسائل', 'My diary': 'مذكراتي', 'Not feeling well': 'لست بخير', 'Me': 'أنا', 'Kids': 'الأبناء', 'Parents': 'الوالدان',
    // goals
    'reached': 'تحقق', 'nearly there': 'اقتربت', 'on the way': 'في الطريق', 'One less': 'واحد أقل', '+1 done': '+1 أُنجز', '✓ agreed by a parent': '✓ وافق عليه أحد الوالدين',
    'Agree': 'موافقة', 'not agreed yet': 'لم تتم الموافقة بعد', '+ New goal': '+ هدف جديد', 'Reached': 'تحقق', 'agreed': 'تمت الموافقة', 'Open goals': 'فتح الأهداف',
    'Goals the children set themselves and goals you set with them. Marks, reading minutes, study hours and finished books fill the progress in by themselves.': 'أهداف يضعها الأبناء بأنفسهم وأهداف تضعها معهم. تملأ الدرجات ودقائق القراءة وساعات المذاكرة والكتب المنتهية التقدّم تلقائياً.',
    'Set a target and watch it fill up. Your marks, reading minutes, study hours and finished books count by themselves. For your own goal, tick the steps as you go.': 'ضع هدفاً وشاهده يمتلئ. تُحتسب درجاتك ودقائق قراءتك وساعات مذاكرتك والكتب التي تنهيها تلقائياً. في هدفك الخاص، أشّر على الخطوات أولاً بأول.',
    'No goals yet.': 'لا أهداف بعد.', 'No goals yet. Press "+ New goal" to set your first one.': 'لا أهداف بعد. اضغط «+ هدف جديد» لتضع أول هدف.', 'No goals yet. Set one and watch it fill up.': 'لا أهداف بعد. ضع هدفاً وشاهده يمتلئ.',
    'Subject mark': 'درجة مادة', 'Reading minutes a week': 'دقائق القراءة أسبوعياً', 'Study hours a week': 'ساعات المذاكرة أسبوعياً', 'Books to finish': 'كتب لإنهائها', 'My own goal': 'هدفي الخاص',
    'Kind of goal': 'نوع الهدف', 'Goal (for your own goal, e.g. "Finish 10 past papers")': 'الهدف (لهدفك الخاص، مثلاً «حل 10 اختبارات سابقة»)', 'Target (mark, minutes, hours, books or count)': 'المستهدف (درجة أو دقائق أو ساعات أو كتب أو عدد)',
    'Steps, one per line (optional, for your own goal)': 'الخطوات، واحدة في كل سطر (اختياري، لهدفك الخاص)', 'By when (optional)': 'الموعد (اختياري)', 'Reward when it is reached (optional)': 'المكافأة عند تحقيقه (اختياري)',
    'Agreed by a parent': 'وافق عليه أحد الوالدين', 'Agreed': 'موافَق عليه', 'Goal': 'الهدف', 'Well done!': 'أحسنت!', 'From the children': 'من الأبناء',
    'Targets the children and parents set: a subject mark, reading or study each week, books to finish, or their own goal with steps.': 'أهداف يضعها الأبناء والوالدان: درجة مادة، أو قراءة أو مذاكرة أسبوعية، أو كتب لإنهائها، أو هدف خاص بخطوات.',
    // charts
    'Your overall this term': 'معدلك العام هذا الفصل', 'Worked out again for every week that brought marks.': 'يُعاد حسابه مع كل أسبوع وصلت فيه درجات.', 'The overall after each SABIS update.': 'المعدل العام بعد كل تحديث من SABIS.',
    'overall by week': 'المعدل حسب الأسبوع', 'SABIS update': 'تحديث SABIS', 'hover for details': 'مرّر المؤشر للتفاصيل', 'tap for details': 'اضغط للتفاصيل', 'What moved for you': 'ما الذي تغيّر لديك', 'What moved': 'ما الذي تغيّر',
    'No subject moved.': 'لم تتغير أي مادة.', 'This term vs last term': 'هذا الفصل مقارنة بالفصل السابق', 'Which way each of your subjects is heading': 'إلى أين تتجه كل مادة من موادك',
    'Every mark in subjects with two or more marks.': 'كل الدرجات في المواد التي لها درجتان أو أكثر.', 'Red = down, green = up, grey = steady or uneven.': 'الأحمر = تراجع، الأخضر = تحسن، الرمادي = ثابت أو متذبذب.',
    'Dashed = trend.': 'المتقطع = الاتجاه.', '◆ = starred mark.': '◆ = درجة بنجمة.', 'Dashed = trend. ◆ = starred mark.': 'المتقطع = الاتجاه. ◆ = درجة بنجمة.',
    'Every mark in subjects with two or more marks. Red = down, green = up, grey = steady or uneven. Dashed = trend. ◆ = starred mark.': 'كل الدرجات في المواد التي لها درجتان أو أكثر. الأحمر = تراجع، الأخضر = تحسن، الرمادي = ثابت أو متذبذب. المتقطع = الاتجاه. ◆ = درجة بنجمة.', 'steady': 'ثابت', 'SABIS update (gold = this one)': 'تحديث SABIS (الذهبي = هذا التحديث)', 'yesterday': 'أمس',
    // kids' records
    'Added by': 'أُضيف بواسطة', 'New teacher': 'معلم جديد', 'School trip': 'رحلة مدرسية', 'Category': 'التصنيف', 'Good for ages (e.g. 8-12)': 'مناسب للأعمار (مثلاً 8-12)', 'E-book file (PDF or EPUB)': 'ملف الكتاب (PDF أو EPUB)',
    'Not feeling well?': 'لست بخير؟', 'Tell your parents here. Write how you feel and, if you know it, your temperature. They get a message straight away.': 'أخبر والديك هنا. اكتب كيف تشعر، ودرجة حرارتك إن كنت تعرفها. تصلهما رسالة فوراً.',
    "I'm not feeling well": 'لست بخير', 'Your parents will see it. Get well soon!': 'سيراه والداك. أتمنى لك الشفاء العاجل!', 'My sick reports': 'بلاغاتي المرضية', 'You are marked as sick': 'أنت مسجّل مريضاً', 'I feel better': 'أشعر بتحسن',
    'The children can report feeling unwell from their own login; you add the doctor, medicine and school days missed. Days missed are counted without weekends and recorded holidays, unless you type the number.': 'يمكن للأبناء الإبلاغ عن شعورهم بالمرض من حساباتهم؛ وتضيف أنت الطبيب والدواء وأيام الغياب. تُحتسب أيام الغياب دون عطل نهاية الأسبوع والإجازات المسجلة، إلا إذا كتبت العدد.',
    'Open Sick records to add the doctor, medicine and the school days missed.': 'افتح سجل المرض لإضافة الطبيب والدواء وأيام الغياب.',
    // library and reader
    'Family library': 'مكتبة العائلة', 'Library': 'المكتبة', 'Search title, author or category': 'ابحث بالعنوان أو المؤلف أو التصنيف', '+ Add books': '+ إضافة كتب', 'Add a folder': 'إضافة مجلد', 'All': 'الكل',
    'Whole library': 'المكتبة كاملة', 'My to-read list': 'قائمة كتبي للقراءة', 'To read': 'للقراءة', 'Reading': 'أقرؤه', 'Finished': 'انتهيت منه', 'to read': 'للقراءة', 'reading': 'أقرؤه', 'finished': 'انتهيت منه',
    'Stories & novels': 'قصص وروايات', 'Islamic': 'إسلامي', 'Maths': 'الرياضيات', 'History & geography': 'التاريخ والجغرافيا', 'Exam prep': 'التحضير للاختبارات', 'Comics': 'قصص مصورة',
    'No book matches.': 'لا يوجد كتاب مطابق.', 'No books yet. Add PDF or EPUB files, or a whole folder.': 'لا كتب بعد. أضف ملفات PDF أو EPUB، أو مجلداً كاملاً.', 'No books for you yet. Ask Mum or Dad, or add your own.': 'لا كتب لك بعد. اطلب من أمك أو أبيك، أو أضف كتبك.',
    'Drop PDF or EPUB books (or a folder of them) here': 'أفلت كتب PDF أو EPUB هنا',
    'Daily reading helps comprehension. Aim for 20-30 minutes a day. Reading inside the app is logged for the children by itself.': 'القراءة اليومية تقوّي الفهم. الهدف 20-30 دقيقة يومياً. القراءة داخل التطبيق تُسجّل للأبناء تلقائياً.',
    'Open a book to read it here. Your reading time is logged by itself, and you can correct it in the reading log.': 'افتح كتاباً لتقرأه هنا. يُسجّل وقت قراءتك تلقائياً، ويمكنك تصحيحه في سجل القراءة.',
    'No file attached': 'لا يوجد ملف', 'Continue reading': 'متابعة القراءة', 'Read': 'اقرأ', 'Open in another app': 'فتح في تطبيق آخر', 'Share': 'مشاركة', 'My shelf': 'رفّي', 'My rating': 'تقييمي',
    'Who can see it': 'من يمكنه رؤيته', 'Everyone': 'الجميع', 'Shelves': 'الرفوف', 'not on the shelf': 'ليس على الرف', 'Remove this book from the library?': 'إزالة هذا الكتاب من المكتبة؟', 'Edit details': 'تعديل التفاصيل',
    'Edit book': 'تعديل الكتاب', 'New category…': 'تصنيف جديد…', 'Name of the new category': 'اسم التصنيف الجديد', 'No PDF or EPUB books in that folder': 'لا توجد كتب PDF أو EPUB في هذا المجلد', 'Add them': 'أضفها',
    'Drop PDF or EPUB files. For a whole folder, use "Add a folder".': 'أفلت ملفات PDF أو EPUB. لمجلد كامل استخدم «إضافة مجلد».', '← Library': '← المكتبة', 'You reached the end!': 'وصلت إلى النهاية!',
    'Mark as finished': 'تحديد كمنتهٍ', 'Well done! Marked as finished.': 'أحسنت! تم التحديد كمنتهٍ.', 'This book has no file.': 'لا يوجد ملف لهذا الكتاب.', 'Opened in another app.': 'فُتح في تطبيق آخر.',
    'The family library: PDF and EPUB books with covers and categories. Each child has their own shelf.': 'مكتبة العائلة: كتب PDF وEPUB بأغلفة وتصنيفات. لكل ابن رفّه الخاص.', 'Books': 'الكتب', 'Choose books': 'اختر الكتب',
    // private diary
    'My diary is locked': 'مذكراتي مقفلة', 'Type your 6-digit PIN.': 'اكتب رمزك المكوّن من 6 أرقام.', 'Forgot it? Ask a parent to reset your diary PIN in Accounts. Your pages stay locked, not deleted.': 'نسيته؟ اطلب من أحد والديك إعادة تعيين رمز المذكرات من «الحسابات». تبقى صفحاتك مقفلة ولا تُحذف.',
    'Choose a 6-digit PIN': 'اختر رمزاً من 6 أرقام', 'Type the same PIN again': 'اكتب الرمز نفسه مرة أخرى', 'The two PINs are different. Start again.': 'الرمزان مختلفان. ابدأ من جديد.', 'Your diary is ready': 'مذكراتك جاهزة',
    'Choose a new diary PIN': 'اختر رمزاً جديداً للمذكرات', 'Your own private diary': 'مذكراتك الخاصة',
    'A parent gave you a fresh diary. Pages written with your old PIN are still there, locked. If you remember the old PIN later, you can open them again.': 'أعطاك أحد والديك مذكرات جديدة. الصفحات التي كتبتها برمزك القديم ما زالت موجودة ومقفلة. إذا تذكرت الرمز القديم لاحقاً يمكنك فتحها.',
    'Only you can open it, with your own PIN. Not even Mum or Dad can read it. If you ever forget the PIN, a parent can give you a fresh diary, but the old pages stay locked until you remember the old PIN.': 'وحدك تستطيع فتحها برمزك الخاص. حتى أمك وأبوك لا يستطيعان قراءتها. إذا نسيت الرمز يوماً، يمكن لأحد والديك إعطاؤك مذكرات جديدة، لكن الصفحات القديمة تبقى مقفلة حتى تتذكر الرمز القديم.',
    'Only you can read this. It locks itself after 3 minutes, or when you leave this page.': 'وحدك تستطيع قراءة هذا. تُقفل تلقائياً بعد 3 دقائق أو عند مغادرة هذه الصفحة.', '+ New page': '+ صفحة جديدة',
    'No pages yet. Press "New page" to write your first one.': 'لا صفحات بعد. اضغط «صفحة جديدة» لتكتب أول صفحة.', 'Older pages (locked)': 'صفحات أقدم (مقفلة)',
    'These pages were written with your old PIN, before a parent gave you a fresh diary. Type the old PIN to read them.': 'كُتبت هذه الصفحات برمزك القديم قبل أن يعطيك أحد والديك مذكرات جديدة. اكتب الرمز القديم لقراءتها.',
    'Open with old PIN': 'افتح بالرمز القديم', 'Old PIN': 'الرمز القديم', 'old PIN': 'الرمز القديم', 'Type the PIN you used for that diary.': 'اكتب الرمز الذي استخدمته لتلك المذكرات.', 'Edit page': 'تعديل الصفحة', 'New page': 'صفحة جديدة',
    'A title for today (optional)': 'عنوان لليوم (اختياري)', 'Write anything you like…': 'اكتب ما تشاء…', 'How do you feel? (optional)': 'كيف تشعر؟ (اختياري)', 'Your page': 'صفحتك', 'Remove picture': 'إزالة الصورة',
    'Add a picture': 'إضافة صورة', 'Delete page': 'حذف الصفحة', 'Delete this page? It cannot be brought back.': 'حذف هذه الصفحة؟ لا يمكن استرجاعها.', 'Saved in your diary': 'حُفظت في مذكراتك', 'Your diary locked itself': 'أُقفلت مذكراتك تلقائياً',
    'Opening…': 'جارٍ الفتح…', 'Wrong PIN.': 'رمز خاطئ.', 'The PIN is 6 digits.': 'الرمز من 6 أرقام.', 'Make a PIN first.': 'أنشئ رمزاً أولاً.', 'The diary is locked.': 'المذكرات مقفلة.',
    'The diary locked itself. Type your PIN again.': 'أُقفلت المذكرات تلقائياً. اكتب رمزك مرة أخرى.', 'That is not the old PIN.': 'هذا ليس الرمز القديم.', 'Reset diary PIN': 'إعادة تعيين رمز المذكرات', 'For a forgotten diary PIN': 'لرمز مذكرات منسي',
    'Set their own goals, and add achievements, qualifications, school diary entries and "not feeling well" reports. You get a notification and can remove anything.': 'يضعون أهدافهم، ويضيفون الإنجازات والشهادات ومدخلات سجل المدرسة وبلاغات «لست بخير». يصلك إشعار ويمكنك حذف أي شيء.',
    'Keep a private diary behind their own PIN. Parents cannot read it; "Reset diary PIN" gives them a fresh diary if they forget it.': 'يحتفظون بمذكرات خاصة برمزهم. لا يستطيع الوالدان قراءتها؛ و«إعادة تعيين رمز المذكرات» تمنحهم مذكرات جديدة إذا نسوا الرمز.',
    'They cannot see the other children, payments, the company reimbursement, credentials, meetings, contacts or settings.': 'لا يمكنهم رؤية الأبناء الآخرين أو المدفوعات أو تعويض الشركة أو بيانات الدخول أو الاجتماعات أو جهات الاتصال أو الإعدادات.',
    // messages
    'Chats': 'المحادثات', '+ New chat': '+ محادثة جديدة', 'Groups and one-to-one': 'المجموعات والمحادثات الفردية', "The kids' chats with each other": 'محادثات الأبناء مع بعضهم', 'Group': 'مجموعة',
    'No messages yet': 'لا رسائل بعد', 'Message deleted': 'رسالة محذوفة', 'Voice note': 'رسالة صوتية', 'Attachment': 'مرفق', 'Pick a chat on the left.': 'اختر محادثة من القائمة.', 'Show older messages': 'عرض الرسائل الأقدم',
    'No messages yet. Say hello!': 'لا رسائل بعد. قل مرحباً!', 'No messages yet.': 'لا رسائل بعد.', 'Edit group': 'تعديل المجموعة', 'Parents can see chats between the kids.': 'يمكن للوالدين رؤية محادثات الأبناء مع بعضهم.',
    'You can read this chat between the kids. They know parents can see it.': 'يمكنك قراءة هذه المحادثة بين الأبناء. وهم يعلمون أن الوالدين يستطيعان رؤيتها.', 'Read only: you are not in this chat.': 'للقراءة فقط: لست في هذه المحادثة.',
    'Write a message…': 'اكتب رسالة…', 'Send': 'إرسال', 'Attach files': 'إرفاق ملفات', 'Attach pictures or files (up to 25 MB each)': 'إرفاق صور أو ملفات (حتى 25 ميغابايت لكل منها)', 'Record a voice note': 'تسجيل رسالة صوتية',
    'No microphone was found, or it is blocked in Windows settings.': 'لم يُعثر على ميكروفون، أو أنه محظور في إعدادات Windows.', 'Delete this message for everyone?': 'حذف هذه الرسالة للجميع؟', 'New chat': 'محادثة جديدة',
    'Pick one person for a one-to-one chat, or several for a group.': 'اختر شخصاً لمحادثة فردية، أو عدة أشخاص لمجموعة.', 'Group name (for two or more people)': 'اسم المجموعة (لشخصين أو أكثر)', 'Group name': 'اسم المجموعة',
    'Start': 'ابدأ', 'Pick at least one person': 'اختر شخصاً واحداً على الأقل', 'Delete group': 'حذف المجموعة', 'Delete this group? Its messages stay in the folder but the group disappears from the list.': 'حذف هذه المجموعة؟ تبقى رسائلها في المجلد لكن المجموعة تختفي من القائمة.',
    'Share in a chat': 'مشاركة في محادثة', 'Add a message (optional)': 'أضف رسالة (اختياري)', 'Message': 'الرسالة', 'Shared': 'مشاركة', 'Picture': 'صورة', 'File': 'ملف', 'Kids': 'الأبناء',
    'This chat is not yours.': 'هذه المحادثة ليست لك.', 'You are not in this chat.': 'لست في هذه المحادثة.', 'Nothing to send.': 'لا شيء للإرسال.', 'Message not found.': 'الرسالة غير موجودة.',
    'You can only delete your own messages.': 'يمكنك حذف رسائلك فقط.', 'The file is larger than 25 MB.': 'الملف أكبر من 25 ميغابايت.', 'Sign in first.': 'سجّل الدخول أولاً.',
    // settings
    'Style': 'المظهر', 'Premium & elegant': 'فاخر وأنيق', 'Navy, gold and serif headings. The default.': 'كحلي وذهبي وعناوين أنيقة. الافتراضي.', 'Modern & colourful': 'عصري وملوّن',
    'Bright colours and playful motion.': 'ألوان زاهية وحركة مرحة.', 'Clean & calm': 'نظيف وهادئ', 'Soft greens and quiet surfaces.': 'أخضر ناعم وأسطح هادئة.', 'Password codes by email': 'رموز كلمة المرور عبر البريد',
    '"Forgot password?" on the sign-in screen sends a 6-digit code by email. A parent\'s code goes to that parent; a child\'s code goes to the parents, so you approve every reset. It works on any PC that has opened the family data before; on a new PC the recovery key is still needed.': 'زر «نسيت كلمة المرور؟» في شاشة الدخول يرسل رمزاً من 6 أرقام عبر البريد. رمز ولي الأمر يذهب إليه؛ ورمز الابن يذهب إلى الوالدين، فتوافق أنت على كل إعادة تعيين. يعمل على أي جهاز فُتحت عليه بيانات العائلة من قبل؛ أما على جهاز جديد فما زال مفتاح الاسترداد مطلوباً.',
    'Not set up yet.': 'لم يتم الإعداد بعد.', 'Send codes from (Gmail address)': 'إرسال الرموز من (عنوان Gmail)', 'Gmail app password': 'كلمة مرور التطبيق في Gmail',
    'The app password comes from your Google account: Security → 2-Step Verification → App passwords. It only lets the app send email, and it is stored encrypted like your other logins. Never share it in a chat.': 'تأتي كلمة مرور التطبيق من حسابك في Google: الأمان ← التحقق بخطوتين ← كلمات مرور التطبيقات. تسمح للتطبيق بإرسال البريد فقط، وتُحفظ مشفرة مثل بقية بيانات الدخول. لا تشاركها أبداً في محادثة.',
    'That Gmail address does not look right.': 'عنوان Gmail هذا لا يبدو صحيحاً.', 'Type the app password too.': 'اكتب كلمة مرور التطبيق أيضاً.', 'Send a test email': 'إرسال رسالة تجريبية', 'Only a parent can do this.': 'ولي الأمر فقط يمكنه ذلك.',
    'Add at least one parent email address first.': 'أضف بريداً واحداً على الأقل لولي الأمر أولاً.', '16-letter app password from Google': 'كلمة مرور التطبيق المكوّنة من 16 حرفاً من Google',
    '•••••••••••••••• (saved; type to change)': '•••••••••••••••• (محفوظة؛ اكتب لتغييرها)',
  });
  const books = n => { const k = Number(n); return k === 1 ? 'كتاب واحد' : k === 2 ? 'كتابان' : k <= 10 ? `${k} كتب` : `${k} كتاباً`; };
  const unitAr = { min: 'د', h: 'س', books: 'كتب', steps: 'خطوات' };
  const V3 = [];
  const pat3 = (re, fn) => V3.push([re, fn]);
  pat3(/^Signing in as (.+)$/, m => `تسجيل الدخول باسم ${nm(m[1])}`);
  pat3(/^Code sent to (.+)\. Ask Mum or Dad for it\.$/, m => `أُرسل الرمز إلى ${m[1]}. اطلبه من أمك أو أبيك.`);
  pat3(/^Code sent to (.+)\. Check the inbox \(and the spam folder\)\.$/, m => `أُرسل الرمز إلى ${m[1]}. تحقق من البريد الوارد (ومجلد الرسائل غير المرغوب فيها).`);
  pat3(/^Reward: (.+)$/, m => `المكافأة: ${m[1]}`);
  pat3(/^reward: (.+)$/, m => `المكافأة: ${m[1]}`);
  pat3(/^by (\d.+)$/, m => `بحلول ${day(m[1])}`);
  pat3(/^Read (\d+) minutes a week$/, m => `اقرأ ${m[1]} دقيقة أسبوعياً`);
  pat3(/^Study ([\d.]+) hours a week$/, m => `ذاكر ${m[1]} ساعات أسبوعياً`);
  pat3(/^Finish (\d+) books?$/, m => `أنهِ ${books(m[1])}`);
  pat3(/^([\d.]+) \/ ([\d.]+)(?: (min|h|books|steps))?$/, m => `${m[1]} / ${m[2]}${m[3] ? ' ' + unitAr[m[3]] : ''}`);
  pat3(/^now ([\d.]+) (min|h|books|steps)$/, m => `الآن ${m[1]} ${unitAr[m[2]]}`);
  pat3(/^All (\d+) goals$/, m => `كل الأهداف (${m[1]})`);
  pat3(/^(.+)'s overall this term$/, m => `المعدل العام لـ${nm(m[1])} هذا الفصل`);
  pat3(/^In the SABIS update of (.+)\. Overall ([\d.]+) → ([\d.]+)\.$/, m => `في تحديث SABIS بتاريخ ${m[1]}. المعدل العام ${m[2]} ← ${m[3]}.`);
  pat3(/^In the last four weeks of marks\. Overall ([\d.]+) → ([\d.]+)\.$/, m => `في آخر أربعة أسابيع من الدرجات. المعدل العام ${m[1]} ← ${m[2]}.`);
  pat3(/^You went up ([\d.]+) in (.+)\. Keep going!$/, m => `ارتفعت ${m[1]} في ${sub(m[2])}. استمر!`);
  pat3(/^(.+) needs a push \((.+)\)\. A goal for it can help\.$/, m => `${sub(m[1])} تحتاج إلى دفعة (${m[2]}). وضع هدف لها قد يساعد.`);
  pat3(/^(Term \d|Full year) (\d{4}-\d{2}) → (Term \d|Full year) (\d{4}-\d{2})\. Overall ([\d.]+) → ([\d.]+)\.$/, m => `${D[m[1]]} ${m[2]} ← ${D[m[3]]} ${m[4]}. المعدل العام ${m[5]} ← ${m[6]}.`);
  pat3(/^Low mark (\d+)$/, m => `الحد الأدنى ${m[1]}`);
  pat3(/^avg ([\d.]+)$/, m => `المتوسط ${m[1]}`);
  pat3(/^(rising|sliding) about ([\d.]+) a (month|test)$/, m => `${m[1] === 'rising' ? 'في تحسن' : 'في تراجع'} بنحو ${m[2]} ${m[3] === 'month' ? 'شهرياً' : 'لكل اختبار'}`);
  pat3(/^SABIS update, (.+): overall ([\d.]+)(?: \(([^)]+)\))?(?:, (\d+) new marks?)?$/, m => `تحديث SABIS، ${m[1]}: المعدل العام ${m[2]}${m[3] ? ` (${m[3]})` : ''}${m[4] ? `، ${num(m[4], 'mark')} جديدة` : ''}`);
  pat3(/^(\d{1,2} \w{3}): overall ([\d.]+)(?: \(([^)]+)\))?(, with every mark so far)?$/, m => `${day(m[1])}: المعدل العام ${m[2]}${m[3] ? ` (${m[3]})` : ''}${m[4] ? '، مع كل الدرجات حتى الآن' : ''}`);
  pat3(/^([▲▼]) (.+) ([+−][\d.]+)$/, m => `${m[1]} ${sub(m[2])} ${m[3]}`);
  pat3(/^Last SABIS update: (.+)$/, m => `آخر تحديث من SABIS: ${translate(m[1])}`);
  pat3(/^Last update: (.+)$/, m => `آخر تحديث: ${translate(m[1])}`);
  pat3(/^Update of (.+)$/, m => `تحديث ${translate(m[1])}`);
  pat3(/^updated (.+)$/, m => `حُدّث ${translate(m[1])}`);
  pat3(/^(\d+) days ago$/, m => `قبل ${num(m[1], 'day')}`);
  pat3(/^(.+): overall ([\d.]+) → ([\d.]+)$/, m => `${nm(m[1])}: المعدل العام ${m[2]} ← ${m[3]}`);
  pat3(/^(.+): overall ([\d.]+)$/, m => `${nm(m[1])}: المعدل العام ${m[2]}`);
  pat3(/^Added by (.+), (.+)$/, m => `أُضيف بواسطة ${nm(m[1])}، ${m[2]}`);
  pat3(/^(.+) reached a goal: (.+)$/, m => `تحقق هدف ${nm(m[1])}: ${translate(m[2])}`);
  pat3(/^You reached your goal: (.+)$/, m => `حققت هدفك: ${translate(m[1])}`);
  pat3(/^(.+) added (an achievement|a qualification|a school diary entry|a sick report|a goal)(?:: (.+))?$/, m => `من ${nm(m[1])}: ${{ 'an achievement': 'إنجاز جديد', 'a qualification': 'شهادة جديدة', 'a school diary entry': 'مدخل جديد في سجل المدرسة', 'a sick report': 'بلاغ مرض', 'a goal': 'هدف جديد' }[m[2]]}${m[3] ? `: ${translate(m[3])}` : ''}`);
  pat3(/^(\d+) books?$/, m => books(m[1]));
  pat3(/^(\d+) books? finished(?: · reading: (.+))?$/, m => `الكتب المنتهية: ${m[1]}${m[2] ? ` · أقرأ: ${m[2]}` : ''}`);
  pat3(/^(\d+) books? added$/, m => `أُضيفت ${books(m[1])}`);
  pat3(/^Add (\d+) books? from "(.+)"\? Sub-folder names become categories\.$/, m => `إضافة ${books(m[1])} من «${m[2]}»؟ تصبح أسماء المجلدات الفرعية تصنيفات.`);
  pat3(/^(\d+) minutes? of reading logged$/, m => `سُجّلت ${num(m[1], 'minute')} من القراءة`);
  pat3(/^Part (\d+) \/ (\d+)$/, m => `الجزء ${m[1]} / ${m[2]}`);
  pat3(/^reading · (\d+)%$/, m => `أقرؤه · ${m[1]}%`);
  pat3(/^Could not open this (PDF|EPUB): (.+)$/, m => `تعذر فتح ملف ${m[1]} هذا: ${m[2]}`);
  pat3(/^(.+): not on the shelf$/, m => `${nm(m[1])}: ليس على الرف`);
  pat3(/^Diary from (.+)$/, m => `مذكرات من ${day(m[1])}`);
  pat3(/^Too many tries\. Wait (\d+) seconds\.$/, m => `محاولات كثيرة. انتظر ${m[1]} ثانية.`);
  pat3(/^Digit (\d)$/, m => `الرقم ${m[1]}`);
  pat3(/^(.+) can choose a new diary PIN now$/, m => `يمكن لـ${nm(m[1])} اختيار رمز جديد للمذكرات الآن`);
  pat3(/^Reset (.+)'s diary PIN\? .+$/, m => `إعادة تعيين رمز مذكرات ${nm(m[1])}؟ سيختار ${nm(m[1])} رمزاً جديداً ويحصل على مذكرات جديدة. تبقى الصفحات المكتوبة بالرمز القديم مقفلة: لا يستطيع أحد قراءتها، وأنت منهم، إلا إذا تذكر ${nm(m[1])} الرمز القديم.`);
  pat3(/^You: (.+)$/, m => `أنت: ${translate(m[1])}`);
  pat3(/^Seen by (.+)$/, m => `شاهدها ${m[1].split(', ').map(nm).join('، ')}`);
  pat3(/^Voice note (\d+) s$/, m => `رسالة صوتية ${m[1]} ث`);
  pat3(/^Sent to (.+)$/, m => `أُرسلت إلى ${translate(m[1])}`);
  pat3(/^(.+) is larger than 25 MB\.$/, m => `${m[1]} أكبر من 25 ميغابايت.`);
  pat3(/^Set up: codes are sent from (.+)\.$/, m => `تم الإعداد: تُرسل الرموز من ${m[1]}.`);
  pat3(/^Email for (.+)$/, m => `بريد ${nm(m[1])}`);
  pat3(/^The email for (.+) does not look right\.$/, m => `بريد ${nm(m[1])} لا يبدو صحيحاً.`);
  pat3(/^Test email sent to (.+)\.$/, m => `أُرسلت رسالة تجريبية إلى ${m[1]}.`);
  // ---- the phone app ----
  pat3(/^The OneDrive of (.+) has no M\. Ebrahim Family Hub folder\.$/, m => `لا يحتوي OneDrive الخاص بـ ${nm(m[1])} على مجلد M. Ebrahim Family Hub.`);
  pat3(/^OneDrive of (.+)$/, m => `OneDrive الخاص بـ ${nm(m[1])}`);
  pat3(/^Changed (.+)$/, m => `آخر تغيير ${m[1]}`);
  pat3(/^Your family data is in (.+)\. It is encrypted, so the first time on this phone a parent signs in to unlock it\. After that, this phone remembers it\.$/, m => `بيانات عائلتك في ${item(m[1])}. وهي مشفّرة، لذا في أول مرة على هذا الهاتف يسجل أحد الوالدين الدخول لفتحها، وبعدها يتذكرها الهاتف.`);
  pat3(/^OneDrive answered (\d+)$/, m => `ردّ OneDrive بالرمز ${m[1]}`);
  P.unshift(...V3);

  addD({
    'Sign in with the Microsoft account that keeps the family data in its OneDrive. Everything stays encrypted: this phone can read it only after a parent unlocks it once.': 'سجّل الدخول بحساب Microsoft الذي يحفظ بيانات العائلة في OneDrive. تبقى البيانات مشفّرة، ولا يستطيع هذا الهاتف قراءتها إلا بعد أن يفتحها أحد الوالدين مرة واحدة.',
    'Sign in with Microsoft': 'تسجيل الدخول بحساب Microsoft',
    'Install the app on this phone': 'تثبيت التطبيق على هذا الهاتف',
    'Tip: tap Share, then "Add to Home Screen", to keep the app on this iPhone.': 'نصيحة: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية» لإبقاء التطبيق على هذا الآيفون.',
    'On an iPhone, first add the app to the Home Screen: tap Share, then "Add to Home Screen". Then open Family Hub from the Home Screen and join there. The Home Screen app keeps its own data, apart from Safari, and iPhone notifications need it.': 'على الآيفون أضف التطبيق أولاً إلى الشاشة الرئيسية: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية». بعد ذلك افتح Family Hub من الشاشة الرئيسية وانضم من هناك. تطبيق الشاشة الرئيسية يحتفظ ببياناته بعيداً عن Safari، وإشعارات الآيفون تحتاج إليه.',
    'Finding your family data': 'جارٍ البحث عن بيانات عائلتك', 'Looking in OneDrive…': 'جارٍ البحث في OneDrive…',
    'Which family data?': 'أي بيانات للعائلة؟', 'No family data found': 'لم يُعثر على بيانات العائلة',
    'If the data is in another person\'s OneDrive, they share the "M. Ebrahim Family Hub" folder with this Microsoft account (Share, Can edit). Then paste the folder\'s link here, or open the invitation and choose "Add shortcut to My files".': 'إذا كانت البيانات في OneDrive لشخص آخر، فعليه مشاركة مجلد «M. Ebrahim Family Hub» مع حساب Microsoft هذا (مشاركة، يمكنه التعديل). ثم الصق رابط المجلد هنا، أو افتح الدعوة واختر «إضافة اختصار إلى ملفاتي».',
    'Use this folder': 'استخدام هذا المجلد', 'Link to the folder (optional)': 'رابط المجلد (اختياري)', 'Look again': 'البحث مرة أخرى', 'Use another Microsoft account': 'استخدام حساب Microsoft آخر',
    'Open this page in Safari or Chrome': 'افتح هذه الصفحة في Safari أو Chrome',
    'This browser cannot keep the app on the phone (it may be the browser inside another app). Open the link in Safari on an iPhone or in Chrome on Android, then add it to the Home Screen.': 'لا يستطيع هذا المتصفح إبقاء التطبيق على الهاتف (قد يكون المتصفح داخل تطبيق آخر). افتح الرابط في Safari على الآيفون أو في Chrome على أندرويد، ثم أضفه إلى الشاشة الرئيسية.',
    'Almost ready': 'أوشك على الجاهزية', 'This copy of the app does not have its Microsoft app ID yet, so it cannot reach OneDrive.': 'هذه النسخة من التطبيق لا تحمل بعدُ معرّف تطبيق Microsoft، لذا لا تستطيع الوصول إلى OneDrive.',
    'The Microsoft sign-in did not finish. Try again.': 'لم يكتمل تسجيل الدخول إلى Microsoft. حاول مرة أخرى.',
    'That link is not to a folder.': 'هذا الرابط ليس لمجلد.', 'That folder has no Family Hub data in it.': 'لا يحتوي هذا المجلد على بيانات Family Hub.',
    'Sign in to Microsoft again (Settings → This phone).': 'سجّل الدخول إلى Microsoft مرة أخرى (الإعدادات ← هذا الهاتف).',
    'This is done on the family PC.': 'يتم هذا على حاسوب العائلة.', 'Change parent passwords on the family PC.': 'غيّر كلمات مرور الوالدين على حاسوب العائلة.',
    'Remove parent logins on the family PC.': 'احذف حسابات الوالدين على حاسوب العائلة.', 'SABIS updates run on the family PC.': 'تتم تحديثات SABIS على حاسوب العائلة.',
    'There is no family data in this OneDrive folder.': 'لا توجد بيانات للعائلة في مجلد OneDrive هذا.', 'The family data file is missing from the OneDrive folder.': 'ملف بيانات العائلة غير موجود في مجلد OneDrive.',
    'The family data kept changing on another device. Try again.': 'ظلت بيانات العائلة تتغير على جهاز آخر. حاول مرة أخرى.',
    'That file is no longer available. Choose it again.': 'هذا الملف لم يعد متاحاً. اختره مرة أخرى.', 'This login has no web address.': 'هذا الحساب ليس له عنوان موقع.',
    'No connection. The phone will try again when it is online.': 'لا يوجد اتصال. سيحاول الهاتف مرة أخرى عند الاتصال بالإنترنت.',
    'The family folder is not chosen yet.': 'لم يُختر مجلد العائلة بعد.', 'This Microsoft account cannot open the family folder.': 'لا يستطيع حساب Microsoft هذا فتح مجلد العائلة.',
    'The Microsoft sign-in has expired.': 'انتهت صلاحية تسجيل الدخول إلى Microsoft.', 'The upload did not finish.': 'لم يكتمل الرفع.',
    'This browser cannot encrypt. Open the app over https in Safari or Chrome.': 'لا يستطيع هذا المتصفح التشفير. افتح التطبيق عبر https في Safari أو Chrome.',
    'This phone': 'هذا الهاتف',
    'This phone reads and saves the family data in OneDrive, encrypted. SABIS updates, reading marks from pictures, backups and password codes by email stay on the family PC.': 'يقرأ هذا الهاتف بيانات العائلة ويحفظها في OneDrive مشفّرة. أما تحديثات SABIS وقراءة الدرجات من الصور والنسخ الاحتياطية ورموز كلمات المرور بالبريد فتبقى على حاسوب العائلة.',
    'Microsoft account': 'حساب Microsoft', 'Family folder': 'مجلد العائلة',
    'Some changes are waiting for a connection. They are sent when the phone is online.': 'بعض التغييرات تنتظر الاتصال، وستُرسل عند اتصال الهاتف بالإنترنت.',
    'Up to date with OneDrive.': 'متزامن مع OneDrive.', 'Sync now': 'المزامنة الآن', 'Up to date': 'محدّث',
    'Sign in to Microsoft again': 'تسجيل الدخول إلى Microsoft مرة أخرى', 'Forget this phone': 'نسيان هذا الهاتف',
    'Forget the family data on this phone? A parent then unlocks it again with their password or the recovery key.': 'هل تريد نسيان بيانات العائلة على هذا الهاتف؟ بعدها يفتحها أحد الوالدين مرة أخرى بكلمة مروره أو بمفتاح الاسترداد.',
    'Sign out of Microsoft': 'تسجيل الخروج من Microsoft', 'Sign out of Microsoft on this phone?': 'هل تريد تسجيل الخروج من Microsoft على هذا الهاتف؟',
    'Company reimbursement and Credentials need the PIN, and amounts on Home and the calendar stay hidden until it is entered. It locks again when the app goes to the background.': 'تحتاج صفحتا تعويضات الشركة وبيانات الدخول إلى الرمز، وتبقى المبالغ في الرئيسية والتقويم مخفية حتى إدخاله. ويُقفل مجدداً عندما يذهب التطبيق إلى الخلفية.',
    'Phone': 'الهاتف',
    'This year\'s marks come from SABIS on the family PC. On the phone you can type marks for earlier years or other schools; reading marks from a photo is done on the PC.': 'درجات هذا العام تأتي من SABIS على حاسوب العائلة. على الهاتف يمكنك كتابة درجات السنوات السابقة أو مدارس أخرى، أما قراءة الدرجات من صورة فتتم على الحاسوب.',
    'Ask Mum or Dad. They can give you a new password in a minute: they open Accounts and press "New password" next to your name.': 'اطلب من أمك أو أبيك. يمكنهما إعطاؤك كلمة مرور جديدة خلال دقيقة: يفتحان صفحة الحسابات ويضغطان «كلمة مرور جديدة» بجانب اسمك.',
    'Use "Forgot password?" on the family PC: it sends a code by email, or takes the recovery key. The new password then works here too.': 'استخدم «نسيت كلمة المرور؟» على حاسوب العائلة: يرسل رمزاً بالبريد، أو يقبل مفتاح الاسترداد. وبعدها تعمل كلمة المرور الجديدة هنا أيضاً.',
    'SABIS updates': 'تحديثات SABIS', 'Marks, reports, announcements and homework come in on the family PC and reach this phone through OneDrive.': 'تصل الدرجات والتقارير والإعلانات والواجبات إلى حاسوب العائلة، ومنه إلى هذا الهاتف عبر OneDrive.',
    'Last update did not finish': 'آخر تحديث لم يكتمل', 'Not updated yet': 'لم يُحدَّث بعد', 'Open the app on the PC and press "Update from SABIS".': 'افتح التطبيق على الحاسوب واضغط «التحديث من SABIS».',
    'School': 'المدرسة', 'More': 'المزيد', 'Menu': 'القائمة', 'Main': 'الرئيسية', 'Back': 'رجوع', 'All chats': 'كل المحادثات', 'English': 'English', 'OneDrive': 'OneDrive',
  });

  // ---------------- the family cloud, devices, approvals, Control, Features, sounds, school connections (stage 1) ----------------
  Object.assign(D, {
    'Family cloud': 'سحابة العائلة', 'Control': 'التحكم', 'Features': 'الميزات', 'School connections': 'الاتصال بالمدرسة',
    'Set up the family cloud': 'إعداد سحابة العائلة', 'Join my family': 'الانضمام إلى عائلتي', 'Join my family instead': 'الانضمام إلى عائلتي بدلاً من ذلك',
    'Join my family (code from a family device)': 'الانضمام إلى عائلتي (برمز من جهاز العائلة)', 'Join your family': 'انضم إلى عائلتك', 'Join': 'انضمام',
    'Code from the family device': 'الرمز من جهاز العائلة', 'Name of this PC': 'اسم هذا الحاسوب', 'Name of this phone': 'اسم هذا الهاتف',
    'For example: Study room PC': 'مثال: حاسوب غرفة المذاكرة', 'For example: My phone': 'مثال: هاتفي', 'For example: School calendar': 'مثال: تقويم المدرسة',
    'The code has 8 letters and numbers, like ABCD-EFGH.': 'الرمز مكوّن من 8 أحرف وأرقام، مثل ABCD-EFGH.',
    'Give this PC a name, so you can recognise it in the list of devices.': 'أعطِ هذا الحاسوب اسماً لتتعرف عليه في قائمة الأجهزة.',
    'Give this phone a name, so it can be recognised in the list of devices.': 'أعطِ هذا الهاتف اسماً ليُعرف في قائمة الأجهزة.',
    'If a different family was set up on this PC before, it is put aside in Documents (renamed, not deleted).': 'إذا كانت هناك عائلة أخرى معدّة على هذا الحاسوب من قبل، تُنقل جانباً في المستندات (بتغيير الاسم، دون حذف).',
    'Bringing the family data to this PC': 'جارٍ إحضار بيانات العائلة إلى هذا الحاسوب', 'Waiting for approval...': 'بانتظار الموافقة...', 'Waiting for approval': 'بانتظار الموافقة',
    'This can take a few minutes the first time (pictures, documents and books come too). You can leave this window open.': 'قد يستغرق ذلك بضع دقائق في المرة الأولى (تأتي الصور والمستندات والكتب أيضاً). يمكنك ترك هذه النافذة مفتوحة.',
    'Approval code': 'رمز الموافقة', 'Approve': 'موافقة', 'Approved': 'تمت الموافقة', 'Check again': 'التحقق مرة أخرى', 'Not approved yet.': 'لم تتم الموافقة بعد.',
    'Approval needed': 'مطلوب موافقة', 'Send a new code': 'إرسال رمز جديد', 'A new code was sent': 'تم إرسال رمز جديد', 'Already approved on another device? Check': 'تمت الموافقة على جهاز آخر؟ تحقق',
    'Not connected to the family cloud.': 'غير متصل بسحابة العائلة.', 'This device was signed out of the family cloud by the organiser.': 'سجّل منظّم العائلة خروج هذا الجهاز من سحابة العائلة.',
    'Waiting for the organiser to approve this device.': 'بانتظار موافقة منظّم العائلة على هذا الجهاز.', 'Syncing...': 'جارٍ المزامنة...', 'Connected.': 'متصل.',
    'Organiser': 'المنظّم', 'Windows PC': 'حاسوب ويندوز', 'Phone or tablet': 'هاتف أو جهاز لوحي', 'Browser': 'متصفح',
    'Device': 'الجهاز', 'Devices': 'الأجهزة', 'Kind': 'النوع', 'Role': 'الدور', 'Last seen': 'آخر ظهور', 'this device': 'هذا الجهاز', 'waiting': 'بالانتظار',
    'Add a device': 'إضافة جهاز', "A child's device or a family PC": 'جهاز لأحد الأبناء أو حاسوب للعائلة', "The other parent's phone or PC": 'هاتف أو حاسوب الوالد الآخر', 'My own phone or PC': 'هاتفي أو حاسوبي',
    'Your own devices also get the security alerts and can manage devices.': 'أجهزتك تصلها تنبيهات الأمان أيضاً ويمكنها إدارة الأجهزة.',
    'Getting a code...': 'جارٍ الحصول على رمز...', 'expired': 'انتهت صلاحيته', 'The organiser approves this device with an e-mailed code.': 'يوافق المنظّم على هذا الجهاز برمز يصله بالبريد.',
    'Security alerts (only you see these)': 'تنبيهات الأمان (تراها أنت فقط)', 'No security alerts.': 'لا توجد تنبيهات أمان.', 'Mark all as seen': 'تعليم الكل كمقروء', 'Marked as seen': 'تم التعليم كمقروء',
    'Leave the family cloud': 'مغادرة سحابة العائلة', 'Disconnect this PC': 'فصل هذا الحاسوب', 'Disconnect': 'فصل', 'Disconnected': 'تم الفصل', 'Stop using the family cloud on this PC?': 'هل تريد التوقف عن استخدام سحابة العائلة على هذا الحاسوب؟',
    'This device': 'هذا الجهاز', 'Stored': 'المحفوظ', 'files': 'ملفات', 'Signed out': 'تم تسجيل الخروج', 'Sign out of the family cloud': 'تسجيل الخروج من سحابة العائلة',
    'The family organiser manages devices and approvals.': 'يدير منظّم العائلة الأجهزة والموافقات.',
    'It is a family device, so devices and approvals are managed from your own phone or PC.': 'هذا جهاز للعائلة، لذا تُدار الأجهزة والموافقات من هاتفك أو حاسوبك.',
    'E-mail is not set up yet, so codes cannot be sent. Approve devices and sign-ins on this page instead.': 'البريد غير مُعدّ بعد، لذا لا يمكن إرسال الرموز. وافق على الأجهزة وتسجيلات الدخول من هذه الصفحة.',
    'Family name': 'اسم العائلة', 'Your Gmail (approval codes and security alerts)': 'بريدك في Gmail (رموز الموافقة وتنبيهات الأمان)',
    'Type the Gmail address that should receive approval codes and security alerts.': 'اكتب عنوان Gmail الذي تصله رموز الموافقة وتنبيهات الأمان.',
    'If your family folder is in OneDrive, it moves to Documents on this PC. The OneDrive copy is left as a backup, and you can delete it later.': 'إذا كان مجلد العائلة في OneDrive فسيُنقل إلى المستندات على هذا الحاسوب، وتبقى نسخة OneDrive احتياطية ويمكنك حذفها لاحقاً.',
    "Your family's own sync service, on Cloudflare (free). It replaces OneDrive: phones and other PCs join with a code, everything stays encrypted, and the cloud never sees the family key.": 'خدمة المزامنة الخاصة بعائلتك على Cloudflare (مجاناً). تحل محل OneDrive: تنضم الهواتف والحواسيب الأخرى برمز، ويبقى كل شيء مشفراً، ولا ترى السحابة مفتاح العائلة أبداً.',
    'Encrypt them now': 'تشفيرها الآن', 'Older files encrypted': 'تم تشفير الملفات القديمة',
    'Your family folder moved from OneDrive to this PC (Documents). The OneDrive copy stays as a backup.': 'نُقل مجلد العائلة من OneDrive إلى هذا الحاسوب (المستندات). وتبقى نسخة OneDrive احتياطية.',
    'Family cloud and devices': 'سحابة العائلة والأجهزة', 'the family cloud': 'سحابة العائلة',
    'Your data is kept in this folder and the family cloud keeps every PC and phone up to date. Everything is encrypted before it leaves this PC.': 'تُحفظ بياناتك في هذا المجلد، وتُبقي سحابة العائلة كل حاسوب وهاتف محدّثاً. ويُشفَّر كل شيء قبل أن يغادر هذا الحاسوب.',
    'Your data is kept on this PC only (encrypted). Set up the family cloud (Family cloud in the menu) to use it on other PCs and phones.': 'بياناتك محفوظة على هذا الحاسوب فقط (مشفرة). أعدّ سحابة العائلة (سحابة العائلة في القائمة) لاستخدامها على حواسيب وهواتف أخرى.',
    'Waiting for approval…': 'بانتظار الموافقة…', 'This phone was signed out': 'تم تسجيل خروج هذا الهاتف', 'Join again with a new code': 'الانضمام مرة أخرى برمز جديد',
    "The family organiser approves new devices. A code was sent to the organiser's e-mail: type it here. Or the organiser approves this phone in Family cloud > Devices, then tap Check again.": 'يوافق منظّم العائلة على الأجهزة الجديدة. أُرسل رمز إلى بريد المنظّم: اكتبه هنا. أو يوافق المنظّم على هذا الهاتف من سحابة العائلة > الأجهزة، ثم اضغط «التحقق مرة أخرى».',
    'The family organiser signed this phone out of the family cloud. To use it again, ask for a new code.': 'سجّل منظّم العائلة خروج هذا الهاتف من سحابة العائلة. لاستخدامه مرة أخرى اطلب رمزاً جديداً.',
    "On a family device, the organiser opens Family cloud > Add a device. Scan the square shown there with this phone's camera, or type its code here.": 'على جهاز العائلة يفتح المنظّم سحابة العائلة > إضافة جهاز. امسح المربع الظاهر هناك بكاميرا هذا الهاتف، أو اكتب رمزه هنا.',
    'On a family device, the organiser opens Family cloud > Add a device and gets a code. Type that code here. The family data then comes to this PC from the family cloud, still encrypted.': 'على جهاز العائلة يفتح المنظّم سحابة العائلة > إضافة جهاز ويحصل على رمز. اكتب ذلك الرمز هنا، فتصل بيانات العائلة إلى هذا الحاسوب من سحابة العائلة وهي مشفرة.',
    'Install the app on this phone': 'تثبيت التطبيق على هذا الهاتف',
    'Up to date with the family cloud.': 'متزامن مع سحابة العائلة.', 'Turn on notifications': 'تفعيل الإشعارات', 'Notifications are on': 'الإشعارات مفعّلة',
    "Notifications are on: messages and family news arrive even when the app is closed, with the phone's own sound.": 'الإشعارات مفعّلة: تصل الرسائل وأخبار العائلة حتى والتطبيق مغلق، بصوت الهاتف نفسه.',
    'Get messages and family news even when the app is closed.': 'استلم الرسائل وأخبار العائلة حتى والتطبيق مغلق.',
    'On an iPhone, notifications work once the app is on the Home Screen (Share > Add to Home Screen).': 'على iPhone تعمل الإشعارات بعد إضافة التطبيق إلى الشاشة الرئيسية (مشاركة > إضافة إلى الشاشة الرئيسية).',
    "Notifications were not allowed. You can allow them in the phone's settings for this app.": 'لم يُسمح بالإشعارات. يمكنك السماح بها من إعدادات الهاتف لهذا التطبيق.',
    'This phone reads and saves the family data in the family cloud, encrypted. SABIS updates, reading marks from pictures and backups stay on the family PC.': 'يقرأ هذا الهاتف بيانات العائلة ويحفظها في سحابة العائلة مشفرة. أما تحديثات SABIS وقراءة الدرجات من الصور والنسخ الاحتياطية فتبقى على حاسوب العائلة.',
    'Leave': 'مغادرة', 'Leave the family cloud on this phone? To use it again it needs a new code from a family device.': 'هل تريد مغادرة سحابة العائلة على هذا الهاتف؟ لاستخدامه مجدداً يلزم رمز جديد من جهاز العائلة.',
    'Not on your account': 'غير متاح في حسابك', 'This section is not shown on your account. The family organiser chooses what each parent account sees.': 'هذا القسم لا يظهر في حسابك. يختار منظّم العائلة ما يراه كل حساب من حسابات الوالدين.',
    'Switched off': 'متوقف', 'This part of the app is switched off in Settings > Features.': 'هذا الجزء من التطبيق متوقف من الإعدادات > الميزات.',
    'Shown to the other parent account': 'يظهر لحساب الوالد الآخر', 'Hidden from the other parent account': 'مخفي عن حساب الوالد الآخر',
    'Company reimbursement, Settings, Family cloud and this Control page are on your account only. Money and Credentials start hidden, and they also ask for the PIN.': 'تعويضات الشركة والإعدادات وسحابة العائلة وصفحة التحكم هذه في حسابك فقط. ويبدأ المال وبيانات الدخول مخفيين، ويطلبان الرمز السري أيضاً.',
    'Children pages': 'صفحات الأبناء', 'School: records, marks, exams, goals and careers': 'المدرسة: السجلات والدرجات والاختبارات والأهداف والمهن', 'Messages': 'الرسائل',
    'Calendar, exam dates and holidays': 'التقويم ومواعيد الاختبارات والإجازات', 'Study hours and reading': 'ساعات المذاكرة والقراءة', 'Sick records and lunch box': 'سجل المرض وصندوق الغداء',
    'Money: payments and private courses': 'المال: المدفوعات والدروس الخصوصية', 'Family events, photos and documents': 'أحداث العائلة والصور والمستندات',
    'Child profiles and accounts': 'ملفات الأبناء والحسابات', 'Credentials (saved logins)': 'بيانات الدخول (الحسابات المحفوظة)',
    'School connection (updates, announcements, homework)': 'الاتصال بالمدرسة (التحديثات والإعلانات والواجبات)', 'Reading and the family library': 'القراءة ومكتبة العائلة',
    'Careers and future paths': 'المهن والمسارات المستقبلية', 'Payments and private courses': 'المدفوعات والدروس الخصوصية', "Children's private diaries": 'مذكرات الأبناء الخاصة',
    'Switch off what the family does not use: it leaves the menus, the pages, Home and the reminders. Nothing is deleted, and switching it on again brings it all back. Encryption, backups and locking are always on.': 'أوقف ما لا تستخدمه العائلة: يختفي من القوائم والصفحات والرئيسية والتذكيرات. لا يُحذف شيء، وإعادة تشغيله تعيد كل شيء. أما التشفير والنسخ الاحتياطي والقفل فتعمل دائماً.',
    'Notification sound on this PC': 'صوت الإشعارات على هذا الحاسوب', 'Volume': 'مستوى الصوت', 'Play': 'تشغيل', 'Chime': 'رنين', 'Bell': 'جرس', 'Two tones': 'نغمتان', 'Harp': 'هارب', 'Soft pop': 'نقرة خفيفة',
    "Windows' own sound": 'صوت ويندوز', 'No sound': 'بدون صوت', 'Quiet hours: no sound from': 'ساعات الهدوء: بدون صوت من', 'to': 'إلى',
    'During quiet hours notifications still appear, without sound. Phones use their own notification sound.': 'خلال ساعات الهدوء تظهر الإشعارات بدون صوت. وتستخدم الهواتف صوت الإشعارات الخاص بها.',
    'SABIS Digital Platform': 'منصة SABIS الرقمية', 'School calendar links': 'روابط تقويم المدرسة', 'Add calendar': 'إضافة تقويم', 'Read now': 'قراءة الآن', 'events': 'أحداث', 'events read': 'أحداث تمت قراءتها', 'not read yet': 'لم يُقرأ بعد',
    'Another school platform': 'منصة مدرسية أخرى', 'Remove this school calendar? Events already brought in stay.': 'هل تريد إزالة تقويم المدرسة هذا؟ تبقى الأحداث التي جُلبت.',
    'If the school shares its calendar as a link (iCal or webcal), add it here and its events come into the calendar every day.': 'إذا كانت المدرسة تشارك تقويمها برابط (iCal أو webcal) فأضفه هنا لتدخل أحداثه إلى التقويم كل يوم.',
    'For a school without SABIS: read report cards from a photo or PDF with Add marks, add its calendar link above if it has one, and enter homework and dates by hand. More platforms can be connected where the school allows it.': 'لمدرسة بدون SABIS: اقرأ الشهادات من صورة أو ملف PDF عبر «إضافة درجات»، وأضف رابط تقويمها أعلاه إن وُجد، وأدخل الواجبات والمواعيد يدوياً. ويمكن ربط منصات أخرى حيث تسمح المدرسة بذلك.',
    'Use a calendar link that starts with https:// or webcal://': 'استخدم رابط تقويم يبدأ بـ https:// أو webcal://', 'That link is not a calendar (iCal).': 'هذا الرابط ليس تقويماً (iCal).',
    'Reset the PIN': 'إعادة تعيين الرمز السري', 'Code sent to': 'أُرسل الرمز إلى', 'The e-mail for codes is not set up yet, so the PIN cannot be reset now.': 'البريد الخاص بالرموز غير مُعدّ بعد، لذا لا يمكن إعادة تعيين الرمز السري الآن.',
    'No connection to the family cloud. It will try again by itself.': 'لا يوجد اتصال بسحابة العائلة. ستحاول مرة أخرى تلقائياً.',
    'That code is not right. Check it and try again.': 'هذا الرمز غير صحيح. تحقق منه وحاول مرة أخرى.', 'That code was already used. Ask for a new one.': 'هذا الرمز استُخدم من قبل. اطلب رمزاً جديداً.',
    'That code has expired. Ask for a new one.': 'انتهت صلاحية هذا الرمز. اطلب رمزاً جديداً.', 'That code is not right.': 'هذا الرمز غير صحيح.', 'Too many wrong tries. Ask for a new code.': 'محاولات خاطئة كثيرة. اطلب رمزاً جديداً.',
    'That code is no longer valid. Ask for a new one.': 'هذا الرمز لم يعد صالحاً. اطلب رمزاً جديداً.', 'Too many tries. Wait a few minutes and try again.': 'محاولات كثيرة. انتظر بضع دقائق وحاول مرة أخرى.',
    'This device was signed out of the family cloud.': 'تم تسجيل خروج هذا الجهاز من سحابة العائلة.', 'This device is waiting for approval.': 'هذا الجهاز بانتظار الموافقة.',
    'There is no family data in the family cloud yet. Set it up on the family PC first.': 'لا توجد بيانات للعائلة في سحابة العائلة بعد. أعدّها على حاسوب العائلة أولاً.',
    'The family data is not in the family cloud yet. Set it up on the family PC first.': 'بيانات العائلة ليست في سحابة العائلة بعد. أعدّها على حاسوب العائلة أولاً.',
    'Only the family organiser can do this.': 'منظّم العائلة فقط يمكنه فعل ذلك.', 'Only a parent can do this.': 'الوالدان فقط يمكنهما فعل ذلك.',
    'This PC should join the family cloud of another PC': 'يجب أن ينضم هذا الحاسوب إلى سحابة العائلة على حاسوب آخر', 'Join with a code': 'الانضمام برمز',
    'Join the family cloud that was set up on another PC? The family data on this PC is put aside (renamed in Documents, not deleted) and the family data comes from the family cloud instead.': 'هل تريد الانضمام إلى سحابة العائلة المعدّة على حاسوب آخر؟ تُنقل بيانات العائلة على هذا الحاسوب جانباً (بتغيير اسمها في المستندات دون حذف) وتأتي بيانات العائلة من سحابة العائلة بدلاً منها.',
  });

  function translate(s) {
    if (!s || !/[A-Za-z]/.test(s)) return s;
    if (cache.has(s)) return cache.get(s);
    let out = core(s);
    if (out === null) {
      // leading / trailing punctuation around a known phrase
      const m = s.match(/^([\s·•,:;+\-–—(]*)([\s\S]*?)([\s·•,:;.\-–—)…?!]*)$/);
      if (m && (m[1] || m[3]) && m[2]) { const c = core(m[2]); if (c !== null) out = m[1] + c + m[3].replace(/\?/g, '؟'); }
    }
    if (out === null && s.includes(' · ')) {
      const parts = s.split(' · ');
      const tr = parts.map(p => { const c = core(p.trim()); if (c !== null) return c; if (p.includes(', ')) return p.split(', ').map(x => { const y = core(x); return y === null ? nm(x) : y; }).join('، '); return day(p); });
      if (tr.some((x, i) => x !== parts[i])) out = tr.join(' · ');
    }
    if (out === null && /\. [A-Z]/.test(s)) {
      const parts = s.split(/(?<=\.) (?=[A-Z])/);
      const tr = parts.map(p => { const c = core(p); return c === null ? p : c; });
      if (tr.some((x, i) => x !== parts[i])) out = tr.join(' ');
    }
    if (out === null) out = s;
    if (cache.size > 6000) cache.clear();
    cache.set(s, out);
    return out;
  }

  const t = s => (lang === 'ar' ? translate(String(s)) : String(s));
  const translateText = (s, l) => (l === 'ar' ? translate(String(s || '')) : String(s || ''));

  const SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT)$/;
  function apply(root) {
    if (lang !== 'ar' || !root || typeof document === 'undefined') return root;
    const skipEl = el => { for (let e = el; e && e !== root.parentNode; e = e.parentElement) { if (e.nodeType === 1 && (e.hasAttribute('data-noi18n') || (SKIP.test(e.tagName) && e.tagName !== 'SELECT'))) return true; } return false; };
    const walker = document.createTreeWalker(root, 4 /* text */, null);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    for (const n of nodes) {
      let v = n.nodeValue;
      if (!v) continue;
      if (/[A-Za-z]/.test(v) && !skipEl(n.parentElement)) {
        const trimmed = v.trim();
        const tr = translate(trimmed);
        if (tr !== trimmed) v = v.replace(trimmed, tr);
      }
      // keep "2026-27", "2026-12-06" and "7:30 - 8:15" in reading order inside Arabic text
      if (/\d\s*[-–]\s*\d/.test(v) && v.indexOf('\u2066') < 0) v = v.replace(/\d[\d:.,/]*(?:\s*[-–]\s*\d[\d:.,/]*)+/g, x => `\u2066${x}\u2069`);
      if (v !== n.nodeValue) n.nodeValue = v;
    }
    const els = root.nodeType === 1 ? [root].concat(Array.from(root.querySelectorAll('[placeholder],[title],[aria-label]'))) : Array.from(root.querySelectorAll ? root.querySelectorAll('[placeholder],[title],[aria-label]') : []);
    for (const el of els) {
      if (el.closest && el.closest('[data-noi18n]')) continue;
      for (const a of ['placeholder', 'title', 'aria-label']) {
        const v = el.getAttribute && el.getAttribute(a);
        if (v && /[A-Za-z]/.test(v)) { const tr = translate(v); if (tr !== v) el.setAttribute(a, tr); }
      }
    }
    return root;
  }

  function setLang(l) {
    lang = l === 'ar' ? 'ar' : 'en';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }
  }

  return { t, translate, translateText, apply, setLang, get lang() { return lang; }, _dict: D };
});
