import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import {
  ref,
  deleteObject,
  listAll
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

import { storage } from "./firebase.js";

initAuthGuard(async () => {
  await loadCase();
});

async function loadCase() {

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("caseContainer").innerHTML = "قضية غير موجودة";
    return;
  }

  const uid = getUid();
  if (!uid) return;

  const snap = await getDoc(doc(db, "users", uid, "cases", id));

  if (!snap.exists()) {
    document.getElementById("caseContainer").innerHTML = "قضية غير موجودة";
    return;
  }

  const c = snap.data();

  let year = "-";
  if (c.caseYear) year = c.caseYear;
  else if (c.createdAt) {
    if (typeof c.createdAt === "object" && c.createdAt.seconds) {
      year = new Date(c.createdAt.seconds * 1000).getFullYear();
    } else {
      year = new Date(c.createdAt).getFullYear();
    }
  }

  const attachments = c.attachments?.files || [];

  document.getElementById("caseContainer").innerHTML = `
  
  <div class="form-container">
    
    <h2>📌 بيانات القضية</h2>
    <p><strong>رقم الدعوى:</strong> ${c.caseNumber || "-"}</p>
    <p><strong>سنة الدعوى:</strong> ${year}</p>
    <p><strong>المحكمة:</strong> ${c.court || "-"}</p>
    <p><strong>النوع:</strong> ${c.caseType || "-"}</p>
    <p><strong>الحالة:</strong> ${c.status || "-"}</p>
    <p><strong>المرحلة:</strong> ${c.stage || "-"}</p>

    <hr>

    <h3>👤 الموكل</h3>
    <p>${c.clientName || "-"}</p>

    <hr>

    <h3>⚔️ بيانات الخصم</h3>
    <p><strong>الاسم:</strong> ${c.opponentName || "-"}</p>
    <p><strong>العنوان:</strong> ${c.opponentAddress || "-"}</p>
    <p><strong>الموبايل:</strong> ${c.opponentPhone || "-"}</p>

    <hr>

    <h3>📝 الملاحظات</h3>
    <p>${c.notes || "لا يوجد"}</p>

    <hr>

    <h3>📎 المرفقات</h3>
    ${
      attachments.length
        ? attachments.map(f => `
            <div>
              <a href="${f.url}" target="_blank">📎 ${f.name}</a>
            </div>
          `).join("")
        : "<p>لا يوجد مرفقات</p>"
    }
    <hr>
    <h3>📅 الجلسات المرتبطة</h3>
    <div id="sessionsContainer">
      جاري تحميل الجلسات...
    </div>
  </div>
  `;
  async function loadSessionsForCase(caseId) {

  const uid = getUid();
  if (!uid) return;

  const snapshot = await getDocs(
    collection(db, "users", uid, "sessions")
  );

  let sessions = [];

  snapshot.forEach(docSnap => {
    const s = docSnap.data();
    if (s.caseId === caseId) {
      sessions.push({
        id: docSnap.id,
        ...s
      });
    }
  });

  // ترتيب حسب التاريخ
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

  const container = document.getElementById("sessionsContainer");

  if (!sessions.length) {
    container.innerHTML = "<p>لا يوجد جلسات لهذه القضية</p>";
    return;
  }

  container.innerHTML = `
    <table class="sessions-table">
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>الوقت</th>
          <th>المحكمة</th>
          <th>الدائرة</th>
          <th>القرار</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>
        ${sessions.map(s => {

  const today = new Date();
  const sessionDate = new Date(s.date);

  let rowClass = "";

  if (sessionDate.toDateString() === today.toDateString()) {
    rowClass = "session-today";
  } else if (sessionDate > today) {
    rowClass = "session-upcoming";
  } else {
    rowClass = "session-past";
  }

  return `
    <tr class="${rowClass}">
      <td>${s.date || "-"}</td>
      <td>${s.time || "-"}</td>
      <td>${s.court || "-"}</td>
      <td>${s.circle || "-"}</td>
      <td>${s.notes || "-"}</td>
        <td>—</td>
    </tr>
  `;
}).join("")}
      </tbody>
    </table>
  `;
}
loadSessionsForCase(id);
}


window.addSession = function(id) {
  window.location.href = `sessions.html?caseId=${id}`;
};