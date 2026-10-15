// PORTAL STATE
    const state = {
      lang: 'en',
      theme: 'light',
      sidebarCollapsed: false,
      userRole: 'Student',
      userName: 'Portal User',
      activeView: 'dashboard',
      savedCalendarImg: localStorage.getItem('prizza_calendar_img') || null
    };

    // TRANSLATION DICTIONARY
    const i18n = {
      en: {
        dashboard: "Dashboard",
        assignments: "Prep & Homework",
        resources: "Learning Resources",
        news: "School Notices",
        blog: "School Blog",
        calendar: "Term Calendar",
        heading: "Dashboard Overview",
        sub: "Current term status, alerts, and pending assignments.",
        stat1: "Pending Homework",
        stat2: "Active Notices",
        stat3: "Learning Resources",
        upcomingTitle: "Recent Prep & Tasks",
        viewAll: "View All Prep",
        asTag: "Academic Tasks",
        asTitle: "Prep & Homework",
        resTag: "Revision & Documents",
        resTitle: "Learning Resources",
        newsTag: "Official Updates",
        newsTitle: "School Notices",
        blogTag: "Articles & Publications",
        blogTitle: "School Blog",
        calTag: "Academic Schedule",
        calTitle: "Term Calendar & Schedule",
        schedHeading: "Academic Timetable",
        schedSub: "Official schedule for all Key Stages. Admin updates will reflect in the image box on the right.",
        daysTitle: "Weekly Overview",
        uploadBtn: "Upload Schedule Image",
        dropTitle: "Click or drag image file here"
      },
      ar: {
        dashboard: "اللوحة الرئيسية",
        assignments: "الواجبات والتحضير",
        resources: "المصادر التعليمية",
        news: "إشعارات المدرسة",
        blog: "مدونة المدرسة",
        calendar: "الجدول الدراسي",
        heading: "نظرة عامة على اللوحة",
        sub: "حالة الفصل الدراسي الحالي والإشعارات والواجبات.",
        stat1: "واجبات معلقة",
        stat2: "إشعارات نشطة",
        stat3: "مصادر تعليمية",
        upcomingTitle: "المهام والواجبات الأخيرة",
        viewAll: "عرض كل الواجبات",
        asTag: "المهام الأكاديمية",
        asTitle: "الواجبات والتحضير",
        resTag: "المراجعة والمستندات",
        resTitle: "المصادر التعليمية",
        newsTag: "التحديثات الرسمية",
        newsTitle: "إشعارات المدرسة",
        blogTag: "المقالات والمنشورات",
        blogTitle: "مدونة المدرسة",
        calTag: "الجدول الأكاديمي",
        calTitle: "الجدول والتقويم الدراسي",
        schedHeading: "الجدول الدراسي الأكاديمي",
        schedSub: "الجدول الرسمي لجميع المراحل. ستظهر تحديثات المسؤول في صندوق الصور.",
        daysTitle: "النظرة العامة الأسبوعية",
        uploadBtn: "رفع صورة الجدول",
        dropTitle: "انقر أو اسحب ملف الصورة هنا"
      }
    };

    window.onload = function() {
      applyLanguageText();
      checkSavedCalendar();
    };

    // INTERFACE HANDLERS
    function toggleLanguage() {
      state.lang = state.lang === 'en' ? 'ar' : 'en';
      document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = state.lang;
      document.getElementById('lang-btn').innerText = state.lang === 'en' ? 'العربية' : 'English';
      applyLanguageText();
    }

    function toggleTheme() {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      const icon = document.getElementById('theme-icon');
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
        icon.className = 'fa-regular fa-sun';
      } else {
        document.documentElement.classList.remove('dark');
        icon.className = 'fa-regular fa-moon';
      }
    }

    function toggleSidebarCollapse() {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      const sidebar = document.getElementById('sidebar');
      const wrapper = document.getElementById('main-wrapper');
      const icon = document.getElementById('collapse-icon');

      if (state.sidebarCollapsed) {
        sidebar.classList.add('sidebar-collapsed');
        wrapper.className = 'flex-grow ltr:pl-20 rtl:pr-20 transition-all duration-300 w-full min-h-screen flex flex-col';
        icon.className = 'fa-solid fa-chevron-right text-xs';
      } else {
        sidebar.classList.remove('sidebar-collapsed');
        wrapper.className = 'flex-grow ltr:pl-64 rtl:pr-64 transition-all duration-300 w-full min-h-screen flex flex-col';
        icon.className = 'fa-solid fa-chevron-left text-xs';
      }
    }

    function applyLanguageText() {
      const t = i18n[state.lang];
      document.getElementById('txt-nav-dashboard').innerText = t.dashboard;
      document.getElementById('txt-nav-assignments').innerText = t.assignments;
      document.getElementById('txt-nav-resources').innerText = t.resources;
      document.getElementById('txt-nav-news').innerText = t.news;
      document.getElementById('txt-nav-blog').innerText = t.blog;
      document.getElementById('txt-nav-calendar').innerText = t.calendar;

      document.getElementById('txt-dash-heading').innerText = t.heading;
      document.getElementById('txt-dash-sub').innerText = t.sub;

      document.getElementById('txt-stat-1').innerText = t.stat1;
      document.getElementById('txt-stat-2').innerText = t.stat2;
      document.getElementById('txt-stat-3').innerText = t.stat3;
      document.getElementById('txt-upcoming-title').innerText = t.upcomingTitle;
      document.getElementById('txt-view-all').innerText = t.viewAll;

      document.getElementById('lbl-as-tag').innerText = t.asTag;
      document.getElementById('lbl-as-title').innerText = t.asTitle;

      document.getElementById('lbl-res-tag').innerText = t.resTag;
      document.getElementById('lbl-res-title').innerText = t.resTitle;

      document.getElementById('lbl-news-tag').innerText = t.newsTag;
      document.getElementById('lbl-news-title').innerText = t.newsTitle;

      document.getElementById('lbl-blog-tag').innerText = t.blogTag;
      document.getElementById('lbl-blog-title').innerText = t.blogTitle;

      document.getElementById('lbl-cal-tag').innerText = t.calTag;
      document.getElementById('lbl-cal-title').innerText = t.calTitle;
      document.getElementById('lbl-sched-heading').innerText = t.schedHeading;
      document.getElementById('lbl-sched-sub').innerText = t.schedSub;
      document.getElementById('lbl-days-title').innerText = t.daysTitle;
      document.getElementById('lbl-upload-btn-txt').innerText = t.uploadBtn;
      document.getElementById('txt-drag-title').innerText = t.dropTitle;
    }

    function switchView(viewName) {
      state.activeView = viewName;
      document.querySelectorAll('.content-view').forEach(v => v.classList.add('hidden'));
      document.getElementById(`view-${viewName}`).classList.remove('hidden');

      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.className = 'nav-item w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-charcoal-muted dark:text-gray-400 hover:text-charcoal dark:hover:text-white hover:bg-paper-200/50 dark:hover:bg-darkbg-card transition-all';
      });
      const activeNav = document.getElementById(`nav-${viewName}`);
      if (activeNav) {
        activeNav.className = 'nav-item w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-britishNavy dark:text-white bg-paper-200/80 dark:bg-darkbg-card';
      }
    }

    // MODAL CONTROL & AUTHENTICATION HANDLERS
    function openAuthModal() { document.getElementById('auth-modal').classList.remove('hidden'); }
    function closeAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }

    function selectRole(role) {
      state.userRole = role;
      document.querySelectorAll('.role-tab').forEach(b => {
        b.className = 'role-tab py-2 rounded-lg text-charcoal-muted dark:text-darkbg-muted';
      });
      document.getElementById(`role-${role}`).className = 'role-tab py-2 rounded-lg bg-white dark:bg-darkbg-card text-charcoal dark:text-white shadow-sm';
      document.getElementById('btn-auth-submit').innerText = `Sign In as ${role}`;
    }

    function handleAuthSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('auth-email-input').value;
      state.userName = email ? email.split('@')[0] : 'Portal User';

      document.getElementById('user-display-name').innerText = state.userName;
      document.getElementById('user-display-role').innerText = `${state.userRole} Account`;

      if (state.userRole === 'Admin') {
        document.getElementById('admin-upload-wrap').classList.remove('hidden');
      } else {
        document.getElementById('admin-upload-wrap').classList.add('hidden');
      }

      closeAuthModal();
    }

    // ADMIN TIMETABLE IMAGE UPLOADER
    function openUploaderModal() { document.getElementById('uploader-modal').classList.remove('hidden'); }
    function closeUploaderModal() { document.getElementById('uploader-modal').classList.add('hidden'); }

    function handleCalendarFileSelect(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          state.tempCalendarImg = evt.target.result;
          document.getElementById('upload-prev-img').src = evt.target.result;
          document.getElementById('upload-prev-wrap').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    }

    function saveUploadedCalendarImg() {
      if (state.tempCalendarImg) {
        state.savedCalendarImg = state.tempCalendarImg;
        localStorage.setItem('prizza_calendar_img', state.tempCalendarImg);
        checkSavedCalendar();
        closeUploaderModal();
      }
    }

    function checkSavedCalendar() {
      if (state.savedCalendarImg) {
        document.getElementById('schedule-image-display').src = state.savedCalendarImg;
      }
    }

    // FILTER STUBS
    function filterPrep(filterKey) {}
    function filterResources(filterKey) {}
  