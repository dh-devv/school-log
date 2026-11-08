import { CalendarDays, ChevronDown, Filter, LibraryBig, Menu, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SchoolItem, SchoolItemCategory } from "../../../drizzle/schema";
import SchoolItemCard from "@/components/SchoolItemCard";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { isCurrentItem, isPastItem, todayString } from "@/lib/school-items";
import { isSupabaseConfigured, listPublicSchoolItems } from "@/lib/supabase";
import { adminHref, homeHref, recordsHref } from "@/lib/site";

export default function Home() {
  const [category, setCategory] = useState<SchoolItemCategory | "all">("all");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const today = todayString();

  useEffect(() => {
    document.title = "School Log · 학교 공개 기록";
    let active = true;
    setLoading(true);
    setLoadError(null);
    listPublicSchoolItems({ category: category === "all" ? undefined : category, date: date || undefined })
      .then(nextItems => { if (active) setItems(nextItems); })
      .catch(error => { if (active) setLoadError(error instanceof Error ? error.message : "조회에 실패했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category, date, reloadKey]);

  const activeItems = useMemo(() => items.filter(item => !isPastItem(item, today)), [items, today]);
  const pastItems = useMemo(() => items.filter(item => isPastItem(item, today)), [items, today]);
  const currentCount = items.filter(item => isCurrentItem(item, today)).length;

  const resetFilters = () => { setCategory("all"); setDate(""); };
  const retry = () => { setReloadKey(value => value + 1); };

  return (
    <div className="site-shell">
      <header className="topbar container">
        <a href={homeHref} className="brand" aria-label="School Log 홈"><span className="brand-mark">SL</span><span className="brand-copy"><strong>SCHOOL LOG</strong><small>PUBLIC SCHOOL RECORDS</small></span></a>
        <nav className="topnav" aria-label="주요 메뉴"><a href={recordsHref}>기록 둘러보기</a><a className="admin-link" href={adminHref}><span>관리자</span><span className="admin-link-arrow">↗</span></a></nav>
        <button className="mobile-menu-button" type="button" aria-label="메뉴 열기" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><Menu size={20} /></button>
        {menuOpen && <nav className="mobile-nav" aria-label="모바일 메뉴"><a href={recordsHref} onClick={() => setMenuOpen(false)}>기록 둘러보기</a><a href={adminHref} onClick={() => setMenuOpen(false)}>관리자 ↗</a></nav>}
      </header>

      <main>
        <section className="hero container">
          <div className="hero-kicker"><span>2026 / SCHOOL YEAR</span><span className="kicker-rule" /><span>공개 승인 자료</span></div>
          <div className="hero-grid"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> 오늘의 학교 기록</p><h1>학교의 중요한 날짜를<br /><em>한 곳에서</em> 확인하세요.</h1><p className="hero-description">학교가 공개를 승인한 일정과 공지를 모았습니다.<br className="desktop-only" /> 날짜와 종류를 선택해 필요한 기록을 찾아보세요.</p><a href={recordsHref} className="hero-cta">기록 확인하기 <span>↓</span></a></div><div className="today-panel" aria-label="오늘 요약"><div className="today-panel-top"><span>LOCAL DATE</span><CalendarDays size={18} aria-hidden="true" /></div><div className="today-date"><span>{new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date()).toUpperCase()}</span><strong>{new Date().getDate()}</strong></div><div className="today-panel-bottom"><span>{new Intl.DateTimeFormat("ko-KR", { weekday: "long" }).format(new Date())}</span><strong><b>{currentCount}</b> 진행 중</strong></div></div></div>
        </section>

        <section className="record-section container" id="records">
          <div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> SCHOOL RECORDS</p><h2>공개 기록</h2></div><p className="section-note">지난 기록도 보관되어 있습니다.<br />필요한 날짜를 검색해 보세요.</p></div>
          <div className="filter-bar" aria-label="기록 검색 필터"><div className="filter-label"><Filter size={16} aria-hidden="true" /><span>FILTER BY</span></div><label className="filter-field date-filter"><span className="sr-only">날짜로 검색</span><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label className="filter-field select-filter"><span className="sr-only">종류로 검색</span><select value={category} onChange={event => setCategory(event.target.value as SchoolItemCategory | "all")}><option value="all">모든 종류</option>{CATEGORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></label><button className="today-filter" type="button" onClick={() => setDate(today)}><span className="today-filter-dot" /> 오늘 일정</button>{(date || category !== "all") && <button className="reset-filter" type="button" onClick={resetFilters}><X size={15} aria-hidden="true" /> 초기화</button>}<button className="mobile-filter-toggle" type="button" onClick={() => setMobileFiltersOpen(value => !value)} aria-expanded={mobileFiltersOpen}><Search size={16} /> 검색 조건</button></div>
          {mobileFiltersOpen && <div className="mobile-filter-panel"><p>날짜와 종류를 선택하면 공개 기록을 좁혀볼 수 있습니다.</p><button type="button" onClick={() => setMobileFiltersOpen(false)}>검색 조건 닫기</button></div>}
          <div className="records-layout"><aside className="records-aside"><div className="aside-index">01</div><div><strong>PUBLIC<br />ARCHIVE</strong><p>학교의 시간을<br />차곡차곡 기록합니다.</p></div><div className="aside-legend"><span><i className="legend-dot current" /> 진행 중</span><span><i className="legend-dot upcoming" /> 예정</span><span><i className="legend-dot past" /> 지난 기록</span></div></aside><div className="record-feed">
            {loading && <div className="state-panel"><div className="loading-mark" /><strong>기록을 불러오는 중입니다.</strong><p>잠시만 기다려 주세요.</p></div>}
            {!loading && loadError && <div className="state-panel state-error"><div className="state-icon">!</div><strong>{isSupabaseConfigured ? "기록을 불러오지 못했습니다." : "공개 기록 연결 설정이 필요합니다."}</strong><p>{isSupabaseConfigured ? "잠시 후 다시 시도해 주세요." : "GitHub Pages 배포 환경에 Supabase 변수를 추가해 주세요."}</p><button type="button" onClick={retry}>다시 시도</button></div>}
            {!loading && !loadError && items.length === 0 && <div className="state-panel"><div className="state-icon muted"><Search size={22} /></div><strong>조건에 맞는 공개 자료가 없습니다.</strong><p>날짜나 종류를 바꿔 다시 검색해 보세요.</p><button type="button" onClick={resetFilters}>필터 초기화</button></div>}
            {!loading && !loadError && items.length > 0 && <>{activeItems.length > 0 && <div className="feed-group"><div className="feed-group-heading"><span><span className="group-marker active" /> 지금 확인할 기록</span><b>{activeItems.length}</b></div>{activeItems.map(item => <SchoolItemCard key={item.id} item={item} />)}</div>}{pastItems.length > 0 && <div className="feed-group archive-group"><div className="feed-group-heading"><span><span className="group-marker archive" /> 지난 기록</span><b>{pastItems.length}</b></div>{pastItems.map(item => <SchoolItemCard key={item.id} item={item} />)}</div>}</>}
          </div></div>
        </section>
      </main>
      <footer className="site-footer container"><div className="footer-brand"><span className="brand-mark small">SL</span><span>School Log</span></div><div className="footer-center"><LibraryBig size={15} aria-hidden="true" /> 학교 공개 정보 아카이브</div><span className="footer-year">© 2026 SCHOOL LOG</span></footer>
    </div>
  );
}
