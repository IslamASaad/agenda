export const translations = {
  ar: {
    subtitle: "إدارة القضايا والجلسات للمحامين",
    dashboard: "الرئيسية",
    cases: "القضايا",
    sessions: "الجلسات",
    clients: "الموكلين",
    welcome: "أهلاً بك في Agenda",
    todaySessions: "جلسات اليوم",
    weekSessions: "جلسات الأسبوع",
    openCases: "القضايا المفتوحة",
    upcomingSessions: "الجلسات القادمة",
    addSession: "إضافة جلسة",
    date: "التاريخ",
    case: "القضية",
    court: "المحكمة",
    notes: "ملاحظات",
    nav_home: "الرئيسية",
    nav_clients: "الموكلين",
    nav_cases: "القضايا",
    nav_sessions: "الجلسات"
  },
  en: {
    subtitle: "Legal Agenda Management",
    dashboard: "Dashboard",
    cases: "Cases",
    sessions: "Sessions",
    clients: "Clients",
    welcome: "Welcome to Agenda",
    todaySessions: "Today's Sessions",
    weekSessions: "This Week Sessions",
    openCases: "Open Cases",
    upcomingSessions: "Upcoming Sessions",
    addSession: "Add Session",
    date: "Date",
    case: "Case",
    court: "Court",
    notes: "Notes",
    nav_home: "Dashboard",
    nav_clients: "Clients",
    nav_cases: "Cases",
    nav_sessions: "Sessions"
  }
};

/* =========================
   LANGUAGE SYSTEM
========================= */

let currentLang = localStorage.getItem("lang") || "ar";

export function initI18n() {
  applyTranslations(currentLang);
}

export function toggleLanguage() {
  currentLang = currentLang === "ar" ? "en" : "ar";
  localStorage.setItem("lang", currentLang);
  applyTranslations(currentLang);
}

function applyTranslations(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}