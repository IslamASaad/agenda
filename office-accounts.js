import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const filterType = document.getElementById("filterType");
const yearInput = document.getElementById("yearInput");
const monthInput = document.getElementById("monthInput");

// التحكم في ظهور السنة / الشهر
filterType.addEventListener("change", () => {

  yearInput.hidden = true;
  monthInput.hidden = true;

  if (filterType.value === "year") yearInput.hidden = false;
  if (filterType.value === "month") monthInput.hidden = false;

  loadOfficeAccounts();
});

yearInput.addEventListener("input", loadOfficeAccounts);
monthInput.addEventListener("change", loadOfficeAccounts);

// تحميل أولي
initAuthGuard(async () => {
  await loadOfficeAccounts();
});

async function loadOfficeAccounts() {

  const uid = getUid();
  if (!uid) return;

  const snapshot = await getDocs(
    collection(db, "users", uid, "transactions")
  );

  const incomeTable = document.getElementById("incomeTable");
  const expenseTable = document.getElementById("expenseTable");

  incomeTable.innerHTML = "";
  expenseTable.innerHTML = "";

  let income = 0;
  let expenses = 0;

  const type = filterType.value;
  const yearVal = yearInput.value;
  const monthVal = monthInput.value;

  snapshot.forEach(docSnap => {

    const t = docSnap.data();
    const date = new Date(t.createdAt);

    let include = true;

    // فلترة حسب السنة
    if (type === "year" && yearVal) {
      include = date.getFullYear() == yearVal;
    }

    // فلترة حسب الشهر
    if (type === "month" && monthVal) {
      const [year, month] = monthVal.split("-");
      include =
        date.getFullYear() == year &&
        date.getMonth() + 1 == month;
    }

    if (!include) return;

    // الدخل
    if (t.type === "payment") {
      income += Number(t.amount);

      incomeTable.innerHTML += `
        <tr>
          <td>${t.date}</td>
          <td>${t.clientName || "-"}</td>
          <td>${t.caseNumber || "-"}</td>
          <td>${t.amount}</td>
        </tr>
      `;
    }

    // مصروفات المكتب
    if (t.type === "expenseOffice") {
      expenses += Number(t.amount);

      expenseTable.innerHTML += `
        <tr>
          <td>${t.date}</td>
          <td>${t.note || "-"}</td>
          <td>${t.amount}</td>
        </tr>
      `;
    }

  });

  document.getElementById("totalIncome").textContent = income;
  document.getElementById("totalExpenses").textContent = expenses;
  document.getElementById("netProfit").textContent = income - expenses;
}