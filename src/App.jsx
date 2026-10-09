import { useEffect, useState } from "react";
import styles from "./App.module.css";
import SiteHeader from "./components/siteHeader";
import SiteFooter from "./components/siteFooter";
import BackToTop from "./components/backToTop";
import ExpenseTracker from "./components/expenseTracker";

const repository = "https://github.com/a2rp/expense-tracker";
const App = () => {
    const [showBackToTop, setShowBackToTop] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return <div className={styles["app-shell"]} id="top">
        <SiteHeader title="Ledgerly" mark="L" navItems={[["Overview", "#workspace"], ["Transactions", "#activity"], ["Add entry", "#add"]]} repoUrl={repository} />
        <main className={styles["page-content"]}><ExpenseTracker /></main>
        <SiteFooter repoUrl={repository} />
        <BackToTop visible={showBackToTop} />
    </div>;
};
export default App;