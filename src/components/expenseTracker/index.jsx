import { useEffect, useMemo, useState } from "react";
import { FiArrowDownLeft, FiArrowUpRight, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "../confirmDialog";
import styles from "./styles.module.css";

const storageKey = "ledgerly-transactions";
const today = (offset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};
const starters = [
    { id: 1, name: "Monthly salary", category: "Income", amount: 85000, type: "income", date: today(0), note: "October pay" },
    { id: 2, name: "Apartment rent", category: "Home", amount: 24000, type: "expense", date: today(0), note: "October" },
    { id: 3, name: "Weekly groceries", category: "Food", amount: 3250, type: "expense", date: today(-1), note: "Market" },
    { id: 4, name: "Metro pass", category: "Travel", amount: 1800, type: "expense", date: today(-2), note: "" },
    { id: 5, name: "Design project", category: "Income", amount: 12000, type: "income", date: today(-3), note: "Freelance" },
];
const monthKey = today().slice(0, 7);
const categories = ["Home", "Food", "Travel", "Bills", "Health", "Shopping", "Fun", "Income", "Other"];
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const readTransactions = () => {
    try { const saved = localStorage.getItem(storageKey); return saved ? JSON.parse(saved) : starters; } catch { return starters; }
};

const ExpenseTracker = () => {
    const [transactions, setTransactions] = useState(readTransactions);
    const [type, setType] = useState("expense");
    const [filter, setFilter] = useState("All");
    const [query, setQuery] = useState("");
    const [budget, setBudget] = useState(() => Number(localStorage.getItem("ledgerly-budget")) || 45000);
    const [draft, setDraft] = useState({ name: "", category: "Food", amount: "", date: today(0), note: "" });
    const [pendingDelete, setPendingDelete] = useState(null);
    useEffect(() => localStorage.setItem(storageKey, JSON.stringify(transactions)), [transactions]);
    useEffect(() => localStorage.setItem("ledgerly-budget", String(budget)), [budget]);

    const monthTransactions = transactions.filter((item) => item.date.slice(0, 7) === monthKey);
    const income = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const categoryTotals = categories.filter((category) => category !== "Income").map((category) => ({ category, amount: monthTransactions.filter((item) => item.type === "expense" && item.category === category).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 4);
    const visible = useMemo(() => transactions.filter((item) => (filter === "All" || item.type === filter.toLowerCase()) && (item.name + item.category + item.note).toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [transactions, filter, query]);
    const addTransaction = (event) => {
        event.preventDefault();
        const amount = Number(draft.amount);
        if (!draft.name.trim() || amount <= 0) return;
        setTransactions((current) => [{ ...draft, id: Date.now(), name: draft.name.trim(), amount, type, category: type === "income" ? "Income" : draft.category }, ...current]);
        setDraft({ name: "", category: "Food", amount: "", date: today(0), note: "" });
    };
    const removeTransaction = () => {
        setTransactions((current) => current.filter((item) => item.id !== pendingDelete.id));
        setPendingDelete(null);
    };

    return <section className={styles.expenseTracker} id="workspace">
        <div className={styles.titleRow}><div><p className={styles.period}>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date())} OVERVIEW</p><h1>Money, <span>in view.</span></h1><p className={styles.description}>A clear picture of what came in and where it went.</p></div><div className={styles.periodControl}><span>Monthly budget</span><label><span>₹</span><input aria-label="Monthly spending budget" type="number" min="0" value={budget} onChange={(event) => setBudget(Math.max(0, Number(event.target.value)))} /></label></div></div>
        <div className={styles.summaryGrid}>
            <article className={styles.balanceCard}><span>Cash flow</span><strong>{money(income - expenses)}</strong><small>Income minus expenses</small><div className={styles.balanceMarks}><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
            <article><span>Income</span><strong className={styles.incomeValue}>{money(income)}</strong><small><FiArrowDownLeft aria-hidden="true" /> This month</small></article>
            <article><span>Expenses</span><strong>{money(expenses)}</strong><small><FiArrowUpRight aria-hidden="true" /> This month</small></article>
            <article><span>Budget left</span><strong className={expenses > budget ? styles.overBudget : styles.incomeValue}>{money(budget - expenses)}</strong><small>{budget ? Math.min(100, Math.round((expenses / budget) * 100)) : 0}% of budget used</small></article>
        </div>
        <div className={styles.columns}>
            <section className={styles.activity} id="activity">
                <div className={styles.sectionHeading}><div><h2>Recent activity</h2><p>Every deposit and purchase in one list.</p></div><label className={styles.search}><FiSearch aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" /></label></div>
                <div className={styles.filters} role="group" aria-label="Filter transactions">{["All", "Income", "Expense"].map((item) => <button type="button" className={filter === item ? styles.activeFilter : ""} aria-pressed={filter === item} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
                <div className={styles.transactionList}>{visible.map((item) => <article className={styles.transaction} key={item.id}>
                    <span className={item.type === "income" ? styles.incomeIcon : styles.expenseIcon}>{item.type === "income" ? <FiArrowDownLeft aria-hidden="true" /> : <FiArrowUpRight aria-hidden="true" />}</span>
                    <div className={styles.transactionName}><strong>{item.name}</strong><span>{item.category}{item.note ? " · " + item.note : ""}</span></div>
                    <time dateTime={item.date}>{new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(item.date + "T12:00:00"))}</time>
                    <strong className={item.type === "income" ? styles.incomeValue : ""}>{item.type === "income" ? "+" : "−"}{money(item.amount)}</strong>
                    <button type="button" className={styles.deleteButton} aria-label={"Delete " + item.name} onClick={() => setPendingDelete(item)}><FiTrash2 aria-hidden="true" /></button>
                </article>)}{visible.length === 0 && <p className={styles.empty}>No entries match this view.</p>}</div>
            </section>
            <aside className={styles.sideColumn}>
                <form className={styles.addPanel} id="add" onSubmit={addTransaction}>
                    <div className={styles.sectionHeading}><div><h2>New entry</h2><p>Record money in or out.</p></div><span className={styles.plusMark}><FiPlus aria-hidden="true" /></span></div>
                    <div className={styles.typeSwitch} role="group" aria-label="Entry type"><button type="button" className={type === "expense" ? styles.selectedExpense : ""} aria-pressed={type === "expense"} onClick={() => setType("expense")}><FiArrowUpRight aria-hidden="true" /> Expense</button><button type="button" className={type === "income" ? styles.selectedIncome : ""} aria-pressed={type === "income"} onClick={() => setType("income")}><FiArrowDownLeft aria-hidden="true" /> Income</button></div>
                    <label>Description<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="What was it for?" /></label>
                    <label>Amount<div className={styles.amountInput}><span>₹</span><input required min="1" type="number" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} placeholder="0" /></div></label>
                    <div className={styles.formRow}><label>Category<select value={type === "income" ? "Income" : draft.category} disabled={type === "income"} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.filter((item) => type === "income" ? item === "Income" : item !== "Income").map((item) => <option key={item}>{item}</option>)}</select></label><label>Date<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label></div>
                    <label>Note <span className={styles.optional}>(optional)</span><input value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Add a detail" /></label>
                    <button type="submit" className={styles.submitButton}>Add {type}<FiPlus aria-hidden="true" /></button>
                </form>
                <section className={styles.spendingPanel}><div className={styles.sectionHeading}><div><h2>Spending by category</h2><p>Where this month's expenses landed.</p></div></div>{categoryTotals.length ? categoryTotals.map((item) => <div className={styles.categoryRow} key={item.category}><div><span>{item.category}</span><strong>{money(item.amount)}</strong></div><div className={styles.bar}><span style={{ width: Math.max(5, item.amount / Math.max(...categoryTotals.map((category) => category.amount)) * 100) + "%" }} /></div></div>) : <p className={styles.empty}>Add an expense to see your category mix.</p>}<p className={styles.localNote}>Your entries are saved in this browser.</p></section>
            </aside>
        </div>
        {pendingDelete && <ConfirmDialog title="Delete this transaction?" description={'"' + pendingDelete.name + '" will be removed from your activity.'} confirmLabel="Delete entry" onCancel={() => setPendingDelete(null)} onConfirm={removeTransaction} />}
    </section>;
};
export default ExpenseTracker;