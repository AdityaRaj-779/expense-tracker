 
"use strict";

// ==========================================
// SPENDWISE - EXPENSE TRACKER
// Main JavaScript File
// ==========================================

// 1. Select HTML elements
const expenseForm = document.getElementById("expenseForm");
const expenseId = document.getElementById("expenseId");
const expenseTitle = document.getElementById("expenseTitle");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDate = document.getElementById("expenseDate");

const formHeading = document.getElementById("formHeading");
const saveExpenseBtn = document.getElementById("saveExpenseBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const totalSpent = document.getElementById("totalSpent");
const monthlySpent = document.getElementById("monthlySpent");
const transactionCount = document.getElementById("transactionCount");
const topCategory = document.getElementById("topCategory");
const currentMonth = document.getElementById("currentMonth");

const categoryChart = document.getElementById("categoryChart");
const expenseTableBody = document.getElementById("expenseTableBody");
const emptyExpenses = document.getElementById("emptyExpenses");

const filterCategory = document.getElementById("filterCategory");
const filterMonth = document.getElementById("filterMonth");
const sortExpenses = document.getElementById("sortExpenses");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const themeToggle = document.getElementById("themeToggle");
const exportBtn = document.getElementById("exportBtn");

// 2. Local storage keys
const STORAGE_KEY = "spendwise_expenses";
const THEME_KEY = "spendwise_theme";

// 3. Load saved expenses
function loadExpenses() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(item =>
            item &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            typeof item.amount === "number" &&
            Number.isFinite(item.amount) &&
            item.amount > 0 &&
            typeof item.category === "string" &&
            typeof item.date === "string"
        );
    } catch (error) {
        console.error("Unable to load expenses:", error);
        return [];
    }
}

let expenses = loadExpenses();

// 4. Save expenses in localStorage
function saveExpenses() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(expenses)
        );
        return true;
    } catch (error) {
        console.error("Unable to save expenses:", error);
        alert("Could not save your expenses in this browser.");
        return false;
    }
}

// 5. Format amount in Indian Rupees
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// 6. Format date for display
function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");

    if (!year || !month || !day) {
        return dateString;
    }

    return `${day}/${month}/${year}`;
}

// 7. Get today's date in local time
function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// 8. Generate a unique expense ID
function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
}

// 9. Reset expense form
function resetForm() {
    expenseForm.reset();
    expenseId.value = "";
    expenseDate.value = getToday();

    formHeading.textContent = "Add an expense";
    saveExpenseBtn.textContent = "Add expense";
    cancelEditBtn.hidden = true;
}

// 10. Add or update an expense
function handleExpenseSubmit(event) {
    event.preventDefault();

    const title = expenseTitle.value.trim();
    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value;

    // Form validation
    if (!title) {
        alert("Please enter an expense title.");
        expenseTitle.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter an amount greater than zero.");
        expenseAmount.focus();
        return;
    }

    if (!category) {
        alert("Please select a category.");
        expenseCategory.focus();
        return;
    }

    if (!date || !Number.isFinite(
        new Date(`${date}T00:00:00`).getTime()
    )) {
        alert("Please select a valid date.");
        expenseDate.focus();
        return;
    }

    const editingId = expenseId.value;

    const expenseData = {
        id: editingId || generateId(),
        title,
        amount,
        category,
        date
    };

    const previousExpenses = [...expenses];

    if (editingId) {
        // UPDATE existing expense
        const index = expenses.findIndex(
            item => item.id === editingId
        );

        if (index === -1) {
            alert("Expense not found.");
            resetForm();
            return;
        }

        expenses[index] = expenseData;
    } else {
        // CREATE new expense
        expenses.push(expenseData);
    }

    if (!saveExpenses()) {
        expenses = previousExpenses;
        return;
    }

    resetForm();
    render();
}

// 11. Edit an expense
function editExpense(id) {
    const expense = expenses.find(item => item.id === id);

    if (!expense) {
        return;
    }

    expenseId.value = expense.id;
    expenseTitle.value = expense.title;
    expenseAmount.value = expense.amount;
    expenseCategory.value = expense.category;
    expenseDate.value = expense.date;

    formHeading.textContent = "Edit expense";
    saveExpenseBtn.textContent = "Update expense";
    cancelEditBtn.hidden = false;

    expenseForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    expenseTitle.focus();
}

// 12. Delete an expense
function deleteExpense(id) {
    const expense = expenses.find(item => item.id === id);

    if (!expense) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${expense.title}"?`
    );

    if (!confirmed) {
        return;
    }

    const previousExpenses = [...expenses];

    expenses = expenses.filter(item => item.id !== id);

    if (!saveExpenses()) {
        expenses = previousExpenses;
        return;
    }

    if (expenseId.value === id) {
        resetForm();
    }

    render();
}

// 13. Calculate dashboard totals
function renderSummary() {
    const total = expenses.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    const today = getToday();
    const month = today.slice(0, 7);

    const monthlyTotal = expenses
        .filter(item => item.date.startsWith(month))
        .reduce((sum, item) => sum + item.amount, 0);

    const categoryTotals = {};

    expenses.forEach(item => {
        categoryTotals[item.category] =
            (categoryTotals[item.category] || 0) + item.amount;
    });

    const highestCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0];

    totalSpent.textContent = formatCurrency(total);
    monthlySpent.textContent = formatCurrency(monthlyTotal);
    transactionCount.textContent = expenses.length;

    topCategory.textContent = highestCategory
        ? highestCategory[0]
        : "—";

    currentMonth.textContent = new Date().toLocaleDateString(
        "en-IN",
        {
            month: "long",
            year: "numeric"
        }
    );
}

// 14. Display category spending chart
function renderChart() {
    categoryChart.replaceChildren();

    if (expenses.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-state";
        message.textContent =
            "Add expenses to see your spending breakdown.";

        categoryChart.appendChild(message);
        return;
    }

    const categoryTotals = {};

    expenses.forEach(item => {
        categoryTotals[item.category] =
            (categoryTotals[item.category] || 0) + item.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    const highestAmount = sortedCategories[0][1];

    sortedCategories.forEach(([category, amount]) => {
        const row = document.createElement("div");
        row.className = "chart-row";

        const info = document.createElement("div");
        info.className = "chart-info";

        const name = document.createElement("span");
        name.textContent = category;

        const value = document.createElement("span");
        value.textContent = formatCurrency(amount);

        info.append(name, value);

        const track = document.createElement("div");
        track.className = "chart-track";

        const fill = document.createElement("div");
        fill.className = "chart-fill";

        const percentage = (amount / highestAmount) * 100;
        fill.style.width = `${percentage}%`;

        track.appendChild(fill);
        row.append(info, track);
        categoryChart.appendChild(row);
    });
}

// 15. Filter and sort expenses
function getFilteredExpenses() {
    let result = [...expenses];

    const selectedCategory = filterCategory.value;
    const selectedMonth = filterMonth.value;
    const selectedSort = sortExpenses.value;

    if (selectedCategory !== "all") {
        result = result.filter(
            item => item.category === selectedCategory
        );
    }

    if (selectedMonth) {
        result = result.filter(
            item => item.date.startsWith(selectedMonth)
        );
    }

    switch (selectedSort) {
        case "oldest":
            result.sort((a, b) =>
                a.date.localeCompare(b.date)
            );
            break;

        case "highest":
            result.sort((a, b) => b.amount - a.amount);
            break;

        case "lowest":
            result.sort((a, b) => a.amount - b.amount);
            break;

        default:
            result.sort((a, b) =>
                b.date.localeCompare(a.date)
            );
    }

    return result;
}

// 16. Create a table cell safely
function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

// 17. Display expense table
function renderExpenses() {
    expenseTableBody.replaceChildren();

    const visibleExpenses = getFilteredExpenses();

    emptyExpenses.hidden = visibleExpenses.length > 0;

    visibleExpenses.forEach(expense => {
        const row = document.createElement("tr");

        const titleCell = createCell(expense.title);

        const categoryCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "category-badge";
        badge.textContent = expense.category;
        categoryCell.appendChild(badge);

        const dateCell = createCell(
            formatDate(expense.date)
        );

        const amountCell = createCell(
            formatCurrency(expense.amount)
        );

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-secondary";
        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = expense.id;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = expense.id;

        actionsCell.append(editButton, deleteButton);

        row.append(
            titleCell,
            categoryCell,
            dateCell,
            amountCell,
            actionsCell
        );

        expenseTableBody.appendChild(row);
    });
}

// 18. Main render function
function render() {
    renderSummary();
    renderChart();
    renderExpenses();
}

// 19. Event delegation for edit and delete buttons
expenseTableBody.addEventListener("click", event => {
    const button = event.target.closest(
        "button[data-action]"
    );

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        editExpense(id);
    } else if (action === "delete") {
        deleteExpense(id);
    }
});

// 20. Export expenses as CSV
function exportCSV() {
    if (expenses.length === 0) {
        alert("There are no expenses to export.");
        return;
    }

    const escapeCSV = value => {
        const text = String(value);

        // Prevent spreadsheet formula execution
        const safeText = /^[\s]*[=+\-@]/.test(text)
            ? "'" + text
            : text;

        return `"${safeText.replace(/"/g, '""')}"`;
    };

    const rows = [
        ["Title", "Amount", "Category", "Date"],
        ...expenses.map(item => [
            item.title,
            item.amount,
            item.category,
            item.date
        ])
    ];

    const csv = rows
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF", csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "spendwise-expenses.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 21. Dark and light mode
function applyTheme(theme) {
    const dark = theme === "dark";

    document.body.classList.toggle("dark-mode", dark);

    themeToggle.textContent = dark
        ? "☀️ Light mode"
        : "🌙 Dark mode";

    themeToggle.setAttribute(
        "aria-pressed",
        String(dark)
    );
}

function toggleTheme() {
    const darkMode = document.body.classList.contains(
        "dark-mode"
    );

    const newTheme = darkMode ? "light" : "dark";

    applyTheme(newTheme);

    try {
        localStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
        console.error("Unable to save theme:", error);
    }
}

// 22. Attach event listeners
expenseForm.addEventListener(
    "submit",
    handleExpenseSubmit
);

cancelEditBtn.addEventListener("click", resetForm);

filterCategory.addEventListener("change", render);
filterMonth.addEventListener("change", render);
sortExpenses.addEventListener("change", render);

clearFiltersBtn.addEventListener("click", () => {
    filterCategory.value = "all";
    filterMonth.value = "";
    sortExpenses.value = "newest";
    render();
});

exportBtn.addEventListener("click", exportCSV);
themeToggle.addEventListener("click", toggleTheme);

// 23. Initialize application
function initializeApp() {
    resetForm();

    let savedTheme = "light";

    try {
        savedTheme =
            localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
        console.error("Unable to read theme:", error);
    }

    applyTheme(savedTheme);
    render();
}

initializeApp();
