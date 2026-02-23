import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

initAuthGuard(async () => {
  await loadAccounts();
});

async function loadAccounts() {

  const uid = getUid();
  if (!uid) return;

  // 1️⃣ تحميل الموكلين
  const clientsSnap = await getDocs(
    collection(db, "users", uid, "clients")
  );

  // 2️⃣ تحميل المعاملات
  const transactionsSnap = await getDocs(
    collection(db, "users", uid, "transactions")
  );

  // 3️⃣ تحميل القضايا (عشان agreedFees)
  const casesSnap = await getDocs(
    collection(db, "users", uid, "cases")
  );

  let transactions = [];

  transactionsSnap.forEach(docSnap => {
    transactions.push(docSnap.data());
  });

  let totalFees = 0;
  let totalPaid = 0;

  const table = document.getElementById("clientsAccountsTable");
  table.innerHTML = "";

  clientsSnap.forEach(docSnap => {

    const client = docSnap.data();
    const clientId = docSnap.id;

    const clientTransactions =
      transactions.filter(t => t.clientId === clientId);

    let fees = 0;
    let paid = 0;
    let expenses = 0;

    // ✅ الأتعاب المتفق عليها من القضايا
    casesSnap.forEach(caseDoc => {
      const c = caseDoc.data();
      if (c.clientId === clientId) {
        fees += Number(c.agreedFees) || 0;
      }
    });

    // ✅ أتعاب المراحل + الدفعات + المصروفات
    clientTransactions.forEach(t => {

      const amount = Number(t.amount) || 0;

        if (t.type === "fee") fees += amount;

        // المصروف على الموكل يدخل في حسابه
        if (t.type === "expenseClient") fees += amount;

        if (t.type === "payment") paid += amount;    });

    const remaining = fees - paid;

    totalFees += fees;
    totalPaid += paid;

    table.innerHTML += `
      <tr>
        <td>${client.name}</td>
        <td>${fees}</td>
        <td>${paid}</td>
        <td>${remaining}</td>
        <td>
          <button onclick="openClientAccount('${clientId}')">عرض</button>
        </td>
      </tr>
    `;
  });

  document.getElementById("totalFees").textContent = totalFees;
  document.getElementById("totalPaid").textContent = totalPaid;
  document.getElementById("totalRemaining").textContent =
    totalFees - totalPaid;
}

window.openClientAccount = function(id) {
  window.location.href = `client-account-details.html?id=${id}`;
};