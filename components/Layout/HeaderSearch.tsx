import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/_topbar.module.css";

export default function HeaderSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const value = query.trim();
    if (!value) {
      router.push("/public/search");
      return;
    }
    router.push(`/public/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <form className={styles.searchWrap} onSubmit={submit} role="search">
      <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className={styles.searchInput}
        placeholder="Search platform (Ctrl+K)..."
        aria-label="Search platform"
      />
      <span className={styles.searchShortcut} aria-hidden="true">Ctrl+K</span>
    </form>
  );
}
