import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const clientId = params.get("id");

initAuthGuard(async () => {
  await loadCases();
  await loadTransactions();
});


// تحميل القضايا لربط العملية بقضية
async function loadCases() {

  const uid = getUid();
  if (!uid) return;

  const snapshot = await getDocs(
    collection(db, "users", uid, "cases")
  );

  const select = document.getElementById("caseSelect");
  select.innerHTML = `<option value="">بدون قضية</option>`;

  snapshot.forEach(docSnap => {
    const c = docSnap.data();

    select.innerHTML += `
      <option value="${docSnap.id}">
        ${c.caseNumber} - ${c.court}
      </option>
    `;
  });
}



// تحميل العمليات + الحساب
async function loadTransactions() {

  const uid = getUid();
  if (!uid) return;

  const table = document.getElementById("transactionsTable");
  table.innerHTML = "";

  let fees = 0;
  let paid = 0;

  // 1️⃣ قراءة الأتعاب المتفق عليها من القضايا
  const casesSnap = await getDocs(
    collection(db, "users", uid, "cases")
  );

  casesSnap.forEach(caseDoc => {
    const c = caseDoc.data();
    if (c.clientId === clientId) {
      fees += Number(c.agreedFees) || 0;
    }
  });

  // 2️⃣ قراءة العمليات المالية
  const snapshot = await getDocs(
    collection(db, "users", uid, "transactions")
  );

  snapshot.forEach(docSnap => {

    const t = docSnap.data();

    if (t.clientId !== clientId) return;

    if (t.type === "fee") fees += Number(t.amount);

    // المصروف اللي يتحمله الموكل يتحسب كأتعاب عليه
    if (t.type === "expenseClient") fees += Number(t.amount);

    if (t.type === "payment") paid += Number(t.amount);
        table.innerHTML += `
    <tr>
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>${t.caseNumber || "-"}</td>
        <td>${t.amount}</td>
        <td>${t.note || "-"}</td>
        <td>
          <button onclick="editTransaction('${docSnap.id}')">✏️</button>
          <button onclick="deleteTransaction('${docSnap.id}')">🗑️</button>
        </td>
    </tr>
    `; 
 });

  document.getElementById("feesTotal").textContent = fees;
  document.getElementById("paidTotal").textContent = paid;
  document.getElementById("remainingTotal").textContent = fees - paid;
}



// حفظ عملية (إضافة أو تعديل)
document.getElementById("transactionForm")
  .addEventListener("submit", async function(e) {

    e.preventDefault();

    const uid = getUid();
    if (!uid) return;

    const caseSelect = document.getElementById("caseSelect");
    const selectedOption =
      caseSelect.options[caseSelect.selectedIndex];

    const transactionData = {
      clientId,
      caseId: caseSelect.value,
      caseNumber: selectedOption.textContent,
      type: document.getElementById("type").value,
      amount: document.getElementById("amount").value,
      note: document.getElementById("note").value,
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString()
    };

    const editId = localStorage.getItem("editTransactionId");

    if (editId) {

      await updateDoc(
        doc(db, "users", uid, "transactions", editId),
        transactionData
      );

      localStorage.removeItem("editTransactionId");

    } else {

      await addDoc(
        collection(db, "users", uid, "transactions"),
        transactionData
      );
    }

    document.getElementById("transactionForm").reset();
    loadTransactions();
  });



// حذف عملية
window.deleteTransaction = async function(id) {

  if (!confirm("حذف العملية؟")) return;

  const uid = getUid();

  await deleteDoc(
    doc(db, "users", uid, "transactions", id)
  );

  loadTransactions();
};



// تعديل عملية
window.editTransaction = async function(id) {

  const uid = getUid();

  const snap = await getDoc(
    doc(db, "users", uid, "transactions", id)
  );

  const t = snap.data();

  document.getElementById("type").value = t.type;
  document.getElementById("amount").value = t.amount;
  document.getElementById("note").value = t.note;
  document.getElementById("caseSelect").value = t.caseId || "";

  localStorage.setItem("editTransactionId", id);

  window.scrollTo({ top: 0, behavior: "smooth" });
};