"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AdminIcon from "@/components/admin/AdminIcons";
import AdminProfileTag from "@/components/admin/AdminProfileTag";
import {
  AdminSidebarNav,
  type AdminSidebarProps,
} from "@/components/admin/AdminSidebar";

type AdminHeaderProps = {
  title?: string;
  sidebar?: AdminSidebarProps;
};

const HEADER_LINKS = [
  { href: "/invoice", label: "Invoice App" },
] as const;

export default function AdminHeader({
  title = "Dashboard",
  sidebar,
}: AdminHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        sheetRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const mobileSheet =
    menuOpen && mounted
      ? createPortal(
          <div
            ref={sheetRef}
            className="admin-header-mobile-sheet"
            role="dialog"
            aria-label="Navigation"
          >
            <div className="admin-header-mobile-sheet-body">
              <div className="admin-sidebar-card admin-header-mobile-nav-card">
                <div className="admin-sidebar-header admin-header-mobile-card-head">
                  <AdminProfileTag />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Navigation
                  </p>
                </div>

                {sidebar ? (
                  <AdminSidebarNav
                    {...sidebar}
                    embedded
                    onNavigate={closeMenu}
                  />
                ) : null}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <header className="admin-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="admin-header-brand hidden lg:block">
          <Link href="/" className="admin-header-back">
            <AdminIcon name="chevron-left" size={14} />
            Back to website
          </Link>
          <h1 className="truncate">{title}</h1>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 lg:flex-none lg:justify-end">
          <div className="admin-header-brand min-w-0 lg:hidden">
            <Link href="/" className="admin-header-back">
              <AdminIcon name="chevron-left" size={14} />
              Back to website
            </Link>
            <h1 className="truncate text-base">{title}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden lg:inline-flex">
              <AdminProfileTag />
            </span>

            <nav className="hidden items-center gap-2 lg:flex">
              {HEADER_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="btn-outline text-xs">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div ref={menuRef} className="lg:hidden">
              <button
                type="button"
                className="admin-header-menu-button"
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                aria-label="Open navigation menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <AdminIcon name="menu" size={16} />
                <span>Menu</span>
                <AdminIcon
                  name="chevron-down"
                  size={14}
                  className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileSheet}
    </header>
  );
}
