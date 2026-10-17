// Arabic / English for the whole site. Instead of editing every template, this translates any visible text,
// placeholder, tooltip, toast, confirm() and prompt() that matches an entry below — including content added later.
(() => {
  const D = {
    // ----- navigation & shell -----
    'Prizza — British Curriculum Portal': 'برايزا — بوابة المنهج البريطاني', 'School Portal': 'بوابة المدرسة',
    'Dashboard': 'لوحة التحكم', 'Prep & Homework': 'الواجبات والتحضير', 'Learning Resources': 'مصادر التعلم',
    'Zoom Sessions': 'جلسات زوم', 'Quizzes': 'الاختبارات', 'Users': 'المستخدمون', 'Voice Rooms': 'الغرف الصوتية', 'Files': 'الملفات',
    'School Notices': 'إعلانات المدرسة', 'School Blog': 'مدونة المدرسة', 'Term Calendar': 'تقويم الفصل',
    'New post': 'منشور جديد', 'Enable notifications': 'تفعيل الإشعارات', 'Notifications on': 'الإشعارات مفعّلة', 'Install app': 'تثبيت التطبيق',
    'Join WhatsApp channel': 'انضم إلى قناة واتساب', 'Set WhatsApp link': 'ضبط رابط واتساب', 'Portal User': 'مستخدم البوابة',
    'Student Account': 'حساب طالب', 'Teacher Account': 'حساب معلم', 'Admin Account': 'حساب مشرف',
    // ----- dashboard & lists -----
    'Dashboard Overview': 'نظرة عامة', 'Current term status, alerts, and pending assignments.': 'حالة الفصل الحالي والتنبيهات والواجبات المعلّقة.',
    'Pending Homework': 'واجبات معلّقة', 'Active Notices': 'إعلانات نشطة', 'Recent Prep & Tasks': 'أحدث الواجبات والمهام', 'View All Prep': 'عرض كل الواجبات',
    'Academic Tasks': 'المهام الدراسية', 'All Tasks': 'كل المهام', 'Pending': 'معلّقة', 'Submitted': 'تم التسليم', 'Mark done': 'تحديد كمنجز',
    'Revision & Documents': 'المراجعة والمستندات', 'All': 'الكل', 'Videos': 'فيديوهات', 'Documents': 'مستندات',
    'Official Updates': 'التحديثات الرسمية', 'Articles & Publications': 'مقالات ومنشورات',
    'Academic Schedule': 'الجدول الدراسي', 'Term Calendar & Schedule': 'تقويم الفصل والجدول', 'Upload Schedule Image': 'رفع صورة الجدول',
    'Academic Timetable': 'الجدول الأكاديمي', 'Official schedule for all Key Stages. Admin updates will reflect in the image box on the right.': 'الجدول الرسمي لجميع المراحل. تظهر تحديثات المشرف في مربع الصورة.',
    'Weekly Overview': 'نظرة أسبوعية', 'Insert or update the term schedule image stored in the system database.': 'أضف أو حدّث صورة جدول الفصل المخزّنة في النظام.',
    'Click or drag image file here': 'انقر أو اسحب ملف الصورة هنا', 'PNG, JPG, or WebP': 'PNG أو JPG أو WebP', 'Publish to System': 'نشر في النظام',
    'Important': 'مهم', 'Delete': 'حذف', 'Copy for WhatsApp': 'نسخ لواتساب', 'Open link': 'فتح الرابط', 'Read more': 'اقرأ المزيد', 'Open': 'فتح',
    'Nothing pending — nice work!': 'لا توجد مهام معلّقة — أحسنت!', 'No tasks here yet.': 'لا توجد مهام هنا بعد.', 'No resources yet.': 'لا توجد مصادر بعد.',
    'No notices yet.': 'لا توجد إعلانات بعد.', 'No blog posts yet.': 'لا توجد مقالات بعد.',
    // ----- post modal -----
    'School notice': 'إعلان مدرسي', 'Prep / Homework': 'واجب / تحضير', 'Learning resource': 'مصدر تعليمي', 'Blog post': 'مقال', 'Details': 'التفاصيل', 'Title': 'العنوان',
    'Due date (homework only)': 'تاريخ التسليم (للواجبات فقط)', 'Important — send a push notification to everyone': 'مهم — إرسال إشعار للجميع', 'Publish': 'نشر',
    'Link (optional, https://…)': 'الرابط (اختياري، https://…)', 'Preview': 'معاينة',
    // ----- files -----
    'Library': 'المكتبة', 'New folder': 'مجلد جديد', 'Upload files': 'رفع ملفات', 'Notify students': 'إشعار الطلاب', 'Create': 'إنشاء', 'Folder name': 'اسم المجلد',
    'Search all files…': 'ابحث في كل الملفات…', 'All files': 'كل الملفات', 'No files match your search.': 'لا توجد ملفات مطابقة لبحثك.', 'Nothing here yet.': 'لا يوجد شيء هنا بعد.',
    'Empty folder — drag files here or use “Upload files”.': 'المجلد فارغ — اسحب الملفات هنا أو استخدم «رفع ملفات».',
    'Delete folder': 'حذف المجلد', 'Delete file': 'حذف الملف', 'Download': 'تنزيل',
    // ----- sessions -----
    'Live classes': 'حصص مباشرة', 'Sessions': 'الجلسات', 'Join live classes and look back at past sessions.': 'انضم إلى الحصص المباشرة وراجع الجلسات السابقة.',
    'New session': 'جلسة جديدة', 'Edit session': 'تعديل الجلسة', 'Zoom': 'زوم', 'Google Meet': 'جوجل ميت', 'Microsoft Teams': 'مايكروسوفت تيمز', 'YouTube Live': 'يوتيوب مباشر', 'Online': 'عبر الإنترنت', 'Other': 'أخرى',
    'YouTube Live (plays in the site)': 'يوتيوب مباشر (يُعرض داخل الموقع)', 'Other (plays in the site if the link allows embedding)': 'أخرى (تُعرض داخل الموقع إذا سمح الرابط)',
    'Session name (e.g. Maths — Algebra revision)': 'اسم الجلسة (مثال: الرياضيات — مراجعة الجبر)', 'Meeting link (https://…)': 'رابط الاجتماع (https://…)',
    'Starts': 'يبدأ', 'Ends': 'ينتهي', 'Notes for students (optional)': 'ملاحظات للطلاب (اختياري)', 'Send a push notification to everyone': 'إرسال إشعار للجميع',
    'Save session': 'حفظ الجلسة', 'Cancel': 'إلغاء', '● Live now': '● مباشر الآن', 'Live now': 'مباشر الآن', 'Upcoming': 'قادمة', 'Completed': 'مكتملة',
    'Upcoming sessions': 'الجلسات القادمة', 'Past sessions': 'الجلسات السابقة', 'Present': 'حاضر', 'Absent': 'غائب', 'Join in site': 'انضم داخل الموقع', 'Join now': 'انضم الآن',
    'No sessions scheduled yet.': 'لا توجد جلسات مجدولة بعد.', 'Loading…': 'جارٍ التحميل…', 'Nobody joined while it was live.': 'لم ينضم أحد أثناء البث.',
    'Open in new tab': 'فتح في تبويب جديد', 'Leave': 'مغادرة', 'Edit': 'تعديل', 'Attendance': 'الحضور', 'Unknown': 'غير معروف',
    'Session updated': 'تم تحديث الجلسة', 'Session scheduled': 'تمت جدولة الجلسة', 'The link must start with https://': 'يجب أن يبدأ الرابط بـ https://',
    'End time must be after the start time.': 'يجب أن يكون وقت الانتهاء بعد وقت البدء.',
    'Starts in about 15 minutes. Open Prizza → Zoom Sessions to join.': 'تبدأ خلال نحو 15 دقيقة. افتح برايزا ← جلسات زوم للانضمام.',
    // ----- quizzes -----
    'Practice': 'تدريب', 'Test yourself and see your score straight away.': 'اختبر نفسك واعرف نتيجتك فورًا.', 'New quiz': 'اختبار جديد', 'Quiz title': 'عنوان الاختبار',
    'Description (optional)': 'الوصف (اختياري)', 'Add question': 'إضافة سؤال', 'Publish quiz': 'نشر الاختبار', 'Results': 'النتائج', 'No quizzes yet.': 'لا توجد اختبارات بعد.',
    'Start': 'ابدأ', 'Try again': 'حاول مجددًا', '← Back to quizzes': '→ العودة إلى الاختبارات', 'Submit answers': 'إرسال الإجابات', 'Your score': 'نتيجتك',
    'All quizzes': 'كل الاختبارات', 'No attempts yet.': 'لا توجد محاولات بعد.', 'Question': 'سؤال', 'Remove': 'إزالة', 'Question text': 'نص السؤال', 'Correct answer': 'الإجابة الصحيحة',
    'Tick the circle next to the correct answer. Leave unused options blank.': 'حدد الدائرة بجوار الإجابة الصحيحة. اترك الخيارات غير المستخدمة فارغة.',
    'This quiz has no questions.': 'لا توجد أسئلة في هذا الاختبار.', 'Some questions are unanswered. Submit anyway?': 'بعض الأسئلة بلا إجابة. هل تريد الإرسال على أي حال؟',
    'Each question needs text, at least 2 options, and a filled-in correct answer.': 'يحتاج كل سؤال إلى نص وخيارين على الأقل وإجابة صحيحة معبّأة.',
    'Add at least one question.': 'أضف سؤالًا واحدًا على الأقل.', 'Quiz published': 'تم نشر الاختبار',
    // ----- users -----
    'Admin': 'الإدارة', 'Change roles, reset passwords or remove accounts.': 'غيّر الأدوار أو أعد تعيين كلمات المرور أو احذف الحسابات.', 'Search users…': 'ابحث عن مستخدمين…',
    '(you)': '(أنت)', 'Reset password': 'إعادة تعيين كلمة المرور', 'No users found.': 'لا يوجد مستخدمون.', 'Delete user': 'حذف المستخدم',
    'student': 'طالب', 'teacher': 'معلم', 'admin': 'مشرف', 'Role updated — they need to refresh the site.': 'تم تحديث الدور — يجب أن يحدّث المستخدم الموقع.',
    'New password for this user (at least 6 characters):': 'كلمة مرور جديدة لهذا المستخدم (6 أحرف على الأقل):', 'Password changed': 'تم تغيير كلمة المرور', 'User deleted': 'تم حذف المستخدم',
    // ----- voice -----
    'Talk & draw': 'تحدّث وارسم', 'Join a channel to talk by voice and share a live whiteboard. Your call keeps running while you browse other pages.': 'انضم إلى قناة للتحدث صوتيًا ومشاركة سبورة مباشرة. تستمر مكالمتك أثناء تصفحك الصفحات الأخرى.',
    'Voice channels': 'القنوات الصوتية', 'Voice connected': 'متصل بالصوت', 'No voice channel joined': 'لم تنضم إلى أي قناة صوتية',
    'Pick a channel on the left to start talking and drawing together.': 'اختر قناة من القائمة لبدء التحدث والرسم معًا.', 'Students can draw': 'يمكن للطلاب الرسم',
    'Drawing is locked by the teacher': 'الرسم مقفل من قبل المعلم', 'No channels yet.': 'لا توجد قنوات بعد.', 'New channel': 'قناة جديدة', 'Delete channel': 'حذف القناة',
    'Mute': 'كتم', 'Deafen': 'إيقاف الصوت', 'Pen': 'قلم', 'Eraser': 'ممحاة', 'Size': 'الحجم', 'Save as image': 'حفظ كصورة', 'Clear board': 'مسح السبورة', 'Colour': 'اللون',
    'Microphone blocked — allow it in your browser settings to join.': 'الميكروفون محظور — اسمح به من إعدادات المتصفح للانضمام.',
    'Could not connect to the room. Try again.': 'تعذّر الاتصال بالغرفة. حاول مجددًا.', 'Clear the board for everyone?': 'مسح السبورة للجميع؟', 'New voice channel name:': 'اسم القناة الصوتية الجديدة:',
    // ----- general UI / toasts -----
    'Collapse Sidebar': 'طيّ القائمة الجانبية', 'Toggle Theme': 'تبديل المظهر', 'Schedule Graphic': 'صورة الجدول',
    'Delete this post?': 'حذف هذا المنشور؟', 'Posted': 'تم النشر', 'Posted — notifying everyone': 'تم النشر — جارٍ إشعار الجميع', 'Schedule published': 'تم نشر الجدول',
    'Copied — paste it into your WhatsApp channel': 'تم النسخ — الصقه في قناة واتساب', 'Could not copy automatically.': 'تعذّر النسخ تلقائيًا.',
    'Not supported here. On iPhone: Share → Add to Home Screen, then open the app and try again.': 'غير مدعوم هنا. على آيفون: مشاركة ← إضافة إلى الشاشة الرئيسية، ثم افتح التطبيق وحاول مجددًا.',
    'Notifications turned off': 'تم إيقاف الإشعارات', 'Notifications are blocked — allow them in your browser/site settings.': 'الإشعارات محظورة — اسمح بها من إعدادات المتصفح/الموقع.',
    'Notifications enabled!': 'تم تفعيل الإشعارات!', 'Prizza installed!': 'تم تثبيت برايزا!',
    'iPhone/iPad: tap Share → Add to Home Screen. Desktop/Android: use the install icon in the address bar or browser menu.': 'آيفون/آيباد: اضغط مشاركة ← إضافة إلى الشاشة الرئيسية. الكمبيوتر/أندرويد: استخدم أيقونة التثبيت في شريط العنوان أو قائمة المتصفح.',
    'Paste your WhatsApp channel invite link (https://whatsapp.com/channel/…). Leave empty to remove it.': 'الصق رابط دعوة قناة واتساب (https://whatsapp.com/channel/…). اتركه فارغًا لإزالته.',
    "That doesn't look like a WhatsApp invite link.": 'هذا لا يبدو رابط دعوة واتساب.', 'WhatsApp link saved': 'تم حفظ رابط واتساب',
    // ----- login -----
    'Prizza — Log in': 'برايزا — تسجيل الدخول', 'All important news, homework and updates in one place — sent straight to your phone for your convenience.': 'كل الأخبار المهمة والواجبات والتحديثات في مكان واحد — تصلك مباشرة على هاتفك.',
    'Log in': 'تسجيل الدخول', 'Sign up': 'إنشاء حساب', 'Create account': 'إنشاء الحساب', 'Full name': 'الاسم الكامل', 'Username': 'اسم المستخدم', 'Password': 'كلمة المرور',
    'letters, numbers, _ or .': 'حروف وأرقام و _ أو .', "Please be respectful — harassment isn't tolerated.": 'يرجى الالتزام بالاحترام — لا نتسامح مع الإساءة والتنمّر.',
    'Username: 3–20 letters, numbers, _ or .': 'اسم المستخدم: من 3 إلى 20 حرفًا أو رقمًا أو _ أو .', 'Account created — now log in.': 'تم إنشاء الحساب — سجّل الدخول الآن.',
    'Invalid login credentials': 'اسم المستخدم أو كلمة المرور غير صحيحة', 'User already registered': 'اسم المستخدم مستخدم بالفعل', 'Email signups are disabled': 'التسجيل معطّل حاليًا',
    'Signup is disabled': 'التسجيل معطّل حاليًا', 'Email rate limit exceeded': 'تجاوزت عدد المحاولات، حاول لاحقًا', 'Failed to fetch': 'تعذّر الاتصال بالخادم',
  };


  Object.assign(D, {
    'School setup': 'إعداد المدرسة', 'Create schools and classes, then generate class codes for students to sign up.': 'أنشئ المدارس والفصول، ثم أنشئ رموز الفصول ليسجّل بها الطلاب.',
    'Schools & classes': 'المدارس والفصول', 'New school name': 'اسم المدرسة الجديدة', 'Add school': 'إضافة مدرسة', 'New class name (e.g. Year 9A)': 'اسم الفصل الجديد (مثال: الصف التاسع أ)', 'Add class': 'إضافة فصل',
    'Class codes': 'رموز الفصول', 'Class code': 'رمز الفصل', 'Label (e.g. Year 9A — autumn intake)': 'تسمية (مثال: الصف التاسع أ — دفعة الخريف)', 'Max sign-ups': 'أقصى عدد للتسجيلات', 'Valid for (days)': 'الصلاحية (بالأيام)',
    'Generate code': 'إنشاء الرمز', "Save this code now — for your safety it is shown only once and can't be recovered.": 'احفظ هذا الرمز الآن — لأمانك يظهر مرة واحدة فقط ولا يمكن استرجاعه.',
    'Copy': 'نسخ', 'Copied': 'تم النسخ', 'Done': 'تم', 'Revoke': 'إلغاء الرمز', 'Active': 'نشط', 'Expired': 'منتهي', 'Full': 'مكتمل', 'Revoked': 'ملغى',
    'No schools yet — add one first.': 'لا توجد مدارس بعد — أضف واحدة أولًا.', 'No codes yet.': 'لا توجد رموز بعد.', 'Create a class first.': 'أنشئ فصلًا أولًا.', 'Code created': 'تم إنشاء الرمز',
    'Revoke this code?': 'إلغاء هذا الرمز؟', 'Delete this code?': 'حذف هذا الرمز؟', 'No class': 'بدون فصل', 'Class updated': 'تم تحديث الفصل',
    'Ask your teacher for your class code.': 'اطلب رمز الفصل من معلمك.', 'Please enter your class code.': 'يرجى إدخال رمز الفصل.',
    'Could not create the account. Check your class code and try again.': 'تعذّر إنشاء الحساب. تحقق من رمز الفصل وحاول مجددًا.',
    'Create account (no class code needed)': 'إنشاء حساب (لا يحتاج رمز فصل)', 'Password (min 8 characters)': 'كلمة المرور (8 أحرف على الأقل)', 'Account created': 'تم إنشاء الحساب',
    'Password must be at least 8 characters': 'يجب ألا تقل كلمة المرور عن 8 أحرف', 'New password for this user (at least 8 characters):': 'كلمة مرور جديدة لهذا المستخدم (8 أحرف على الأقل):',
  });

  Object.assign(D, {
    'Space': 'المساحة', 'Shared with everyone': 'مشترك مع الجميع', 'Move': 'نقل', 'Move to…': 'نقل إلى…', 'Moved': 'تم النقل',
    'Notifications are only available for “Shared with everyone”.': 'الإشعارات متاحة فقط للمساحة «مشترك مع الجميع».',
    'This school or class still has files or folders. Move or delete them first.': 'لا تزال هذه المدرسة أو الفصل يحتوي على ملفات أو مجلدات. انقلها أو احذفها أولًا.',
    'Not allowed, or item not found': 'غير مسموح، أو العنصر غير موجود',
  });

  const R = [ // [pattern, builder] for text that contains names, dates or numbers
    [/^Due (.+?)( · Overdue)?$/, (d, o) => `يُسلَّم في ${d}${o ? ' · متأخر' : ''}`],
    [/^(\d+) questions? · Best score:$/, n => `${n} سؤال · أفضل نتيجة:`],
    [/^(.*) \(whole school\)$/, n => `${n} (المدرسة كاملة)`], [/^(\d+) questions?$/, n => `${n} سؤال`], [/^(.*) — (.*) · (\d+)\/(\d+) used · Expires (.*)$/, (s, c, u, m, d) => `${s} — ${c} · ${u}/${m} مستخدم · ينتهي ${d}`],
    [/^Delete school “(.*)” and all its classes and codes\?$/, n => `حذف المدرسة «${n}» وكل فصولها ورموزها؟`], [/^Delete class “(.*)” and its codes\?$/, n => `حذف الفصل «${n}» ورموزه؟`], [/^(\d+) items?$/, n => `${n} عنصر`],
    [/^(\d+) questions — open Quizzes to take it\.$/, n => `${n} سؤال — افتح الاختبارات لتبدأ.`],
    [/^(.*) — results$/, t => `${t} — النتائج`], [/^Attendance — (.*)$/, t => `الحضور — ${t}`],
    [/^(\d+)\/(\d+) in channel$/, (a, b) => `${a}/${b} في القناة`], [/^(@\S+) · joined (.*)$/, (u, d) => `${u} · انضم في ${d}`],
    [/^Search results for “(.*)”$/, q => `نتائج البحث عن «${q}»`], [/^(.*) ✗ your answer$/, o => `${o} ✗ إجابتك`],
    [/^Option ([A-D])$/, l => `الخيار ${l}`],
    [/^New: (.*)$/, t => `جديد: ${t}`], [/^New session: (.*)$/, t => `جلسة جديدة: ${t}`], [/^New quiz: (.*)$/, t => `اختبار جديد: ${t}`],
    [/^New files: (.*)$/, t => `ملفات جديدة: ${t}`], [/^Starting soon: (.*)$/, t => `تبدأ قريبًا: ${t}`],
    [/^Uploading (\d+)\/(\d+): (.*)$/, (i, n, f) => `جارٍ رفع ${i}/${n}: ${f}`], [/^Uploaded (\d+) files?$/, n => `تم رفع ${n} ملف`],
    [/^This channel is full \((\d+) people\)\.$/, n => `القناة ممتلئة (${n} أشخاص).`], [/^Could not enable notifications: (.*)$/, e => `تعذّر تفعيل الإشعارات: ${e}`],
    [/^Delete “(.*)” with (\d+) subfolder\(s\) and (\d+) file\(s\)\? This can't be undone\.$/, (n, a, b) => `حذف «${n}» مع ${a} مجلد فرعي و${b} ملف؟ لا يمكن التراجع.`],
    [/^Delete “(.*)” and all its results\?$/, n => `حذف «${n}» وكل نتائجه؟`], [/^Delete channel “(.*)”\?$/, n => `حذف القناة «${n}»؟`], [/^Delete “(.*)”\?$/, n => `حذف «${n}»؟`],
    [/^Permanently delete (.*)\? This can't be undone\.$/, n => `حذف ${n} نهائيًا؟ لا يمكن التراجع.`], [/^Signed in as (.*)\. Sign out\?$/, n => `أنت مسجّل باسم ${n}. هل تريد تسجيل الخروج؟`],
    [/^Password should be at least (\d+) characters\.?$/, n => `يجب ألا تقل كلمة المرور عن ${n} أحرف.`],
    [/^new row violates row-level security policy.*$/, () => 'ليست لديك صلاحية لتنفيذ هذا الإجراء.'],
  ];

  const norm = s => s.replace(/\s+/g, ' ').trim();
  function translate(s) {
    const n = norm(String(s ?? '')); if (!n) return null;
    if (Object.prototype.hasOwnProperty.call(D, n)) return D[n];
    for (const [re, fn] of R) { const m = n.match(re); if (m) return fn(...m.slice(1)); }
    return null;
  }
  if (typeof document === 'undefined') { if (typeof module !== 'undefined') module.exports = { translate }; return; }

  // ---------------- DOM translator ----------------
  let lang = 'en';
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const skip = el => el.closest && el.closest('script,style,[data-no-i18n]');

  function doText(n) {
    if (lang !== 'ar' || n.__t === n.nodeValue) return;
    const v = n.nodeValue, tr = translate(v); if (tr == null) return;
    n.__o = v; n.__t = v.match(/^\s*/)[0] + tr + v.match(/\s*$/)[0]; n.nodeValue = n.__t;
  }
  function doAttrs(el) {
    if (lang !== 'ar') return;
    ATTRS.forEach(a => {
      const v = el.getAttribute && el.getAttribute(a); if (!v) return;
      el.__ta = el.__ta || {}; if (el.__ta[a] === v) return;
      const tr = translate(v); if (tr == null) return;
      el.__oa = el.__oa || {}; el.__oa[a] = v; el.__ta[a] = tr; el.setAttribute(a, tr);
    });
  }
  function walk(root) {
    if (root.nodeType === 3) { if (!root.parentElement || !skip(root.parentElement)) doText(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 3) { if (n.parentElement && !skip(n.parentElement)) doText(n); } else if (!skip(n)) doAttrs(n);
    }
  }
  function restore() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 3) { if (n.__t !== undefined && n.nodeValue === n.__t) n.nodeValue = n.__o; delete n.__t; delete n.__o; }
      else if (n.__oa) { for (const a in n.__oa) if (n.getAttribute(a) === n.__ta[a]) n.setAttribute(a, n.__oa[a]); n.__oa = n.__ta = null; }
    }
    if (document.__title) { document.title = document.__title; document.__title = null; }
  }

  function setLang(l) {
    lang = l;
    try { localStorage.setItem('prizza_lang', l); } catch {}
    document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    const b = document.getElementById('lang-login'); if (b) b.textContent = l === 'ar' ? 'English' : 'العربية';
    if (l === 'ar') { document.__title = document.__title || document.title; const t = translate(document.__title); if (t) document.title = t; walk(document.body); }
    else restore();
    document.dispatchEvent(new Event('pz-lang'));
  }

  new MutationObserver(ms => {
    if (lang !== 'ar') return;
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') walk(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  // native dialogs
  const _c = window.confirm.bind(window), _p = window.prompt.bind(window), _a = window.alert.bind(window);
  const tr = m => (lang === 'ar' ? translate(m) : null) ?? m;
  window.confirm = m => _c(tr(m)); window.prompt = (m, d) => _p(tr(m), d); window.alert = m => _a(tr(m));

  window.I18N = {
    get lang() { return lang; }, t: s => (lang === 'ar' ? translate(s) : null) ?? s, sync: setLang,
    locale: () => (lang === 'ar' ? 'ar-u-nu-latn' : undefined),
    toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
  };

  // The original page has its own toggle (and its own partial Arabic): keep both in step.
  if (typeof toggleLanguage === 'function' && typeof state !== 'undefined') {
    const orig = toggleLanguage;
    window.toggleLanguage = function () { orig(); setLang(state.lang); };
  }
  document.addEventListener('DOMContentLoaded', () => {
    let saved = 'en'; try { saved = localStorage.getItem('prizza_lang') || 'en'; } catch {}
    const lb = document.getElementById('lang-login'); if (lb) lb.onclick = () => window.I18N.toggle();
    if (saved !== 'ar') return;
    if (typeof state !== 'undefined' && typeof toggleLanguage === 'function') { if (state.lang === 'en') toggleLanguage(); } else setLang('ar');
  });
})();
