import { ArrowLeft, CheckCircle2, LogOut, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { SchoolItem, SchoolItemCategory } from "../../../drizzle/schema";
import SchoolItemCard from "@/components/SchoolItemCard";
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from "@/lib/categories";
import { formatDateRange, todayString } from "@/lib/school-items";
import { adminHref, homeHref } from "@/lib/site";
import { createPublicSchoolItem, deletePublicSchoolItem, isSupabaseConfigured, listPublicSchoolItems, updatePublicSchoolItem } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

type FormState = { title: string; category: SchoolItemCategory; startDate: string; endDate: string; description: string };
const newForm = (): FormState => ({ title: "", category: "school-event", startDate: todayString(), endDate: "", description: "" });

export default function Admin() {
  const auth = useSupabaseAuth();
  const [form, setForm] = useState<FormState>(newForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [items, setItems] = useState<SchoolItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    document.title = "관리자 · School Log";
    return () => { document.title = "School Log · 학교 공개 기록"; };
  }, []);

  useEffect(() => {
    if (auth.role !== "admin") return;
    let active = true;
    setListLoading(true);
    setListError(null);
    listPublicSchoolItems().then(nextItems => { if (active) setItems(nextItems); }).catch(error => { if (active) setListError(error instanceof Error ? error.message : "목록을 불러오지 못했습니다."); }).finally(() => { if (active) setListLoading(false); });
    return () => { active = false; };
  }, [auth.role, refreshKey]);

  const groupedItems = useMemo(() => [...items].sort((a, b) => b.startDate.localeCompare(a.startDate)), [items]);
  const beginEdit = (item: SchoolItem) => { setEditingId(item.id); setForm({ title: item.title, category: item.category, startDate: item.startDate, endDate: item.endDate || "", description: item.description || "" }); setFormError(null); setNotice(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const clearEditor = () => { setEditingId(null); setForm(newForm()); setFormError(null); };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); setNotice(null);
    if (!form.title.trim()) return setFormError("제목을 입력해 주세요.");
    if (!form.startDate) return setFormError("시작일을 선택해 주세요.");
    if (form.endDate && form.endDate < form.startDate) return setFormError("종료일은 시작일 이후여야 합니다.");
    const input = { title: form.title.trim(), category: form.category, startDate: form.startDate, endDate: form.endDate || null, description: form.description.trim() || null };
    setActionPending(true);
    try {
      if (editingId) await updatePublicSchoolItem(editingId, input); else await createPublicSchoolItem(input);
      setNotice(editingId ? "자료를 수정했습니다." : "자료를 등록했습니다.");
      toast.success(editingId ? "자료를 수정했습니다." : "자료를 등록했습니다.");
      clearEditor(); setRefreshKey(value => value + 1);
    } catch (error) {
      setFormError(error instanceof Error && error.message.includes("row-level") ? "관리자 권한이 없어 저장할 수 없습니다." : "저장하지 못했습니다. 연결 상태와 입력 내용을 확인해 주세요.");
    } finally { setActionPending(false); }
  };

  const handleDelete = async (item: SchoolItem) => {
    if (!window.confirm(`“${item.title}” 자료를 삭제할까요?`)) return;
    setActionPending(true);
    try { await deletePublicSchoolItem(item.id); setNotice("자료를 삭제했습니다."); toast.success("자료를 삭제했습니다."); setRefreshKey(value => value + 1); }
    catch { setNotice("삭제하지 못했습니다. 관리자 권한과 연결 상태를 확인해 주세요."); }
    finally { setActionPending(false); }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoginError(null); setLoginPending(true);
    try { await auth.signIn(email.trim(), password); setPassword(""); }
    catch { setLoginError("로그인하지 못했습니다. 관리자 이메일과 비밀번호를 확인해 주세요."); }
    finally { setLoginPending(false); }
  };

  if (auth.loading) return <div className="admin-shell"><div className="admin-loading"><div className="loading-mark" /><strong>관리자 권한을 확인하는 중입니다.</strong></div></div>;
  if (!isSupabaseConfigured) return <div className="admin-shell"><AdminHeader /><AccessPanel title="연결 설정이 필요합니다." description="GitHub Pages에서 관리자 기능을 사용하려면 Supabase URL과 공개 키를 배포 환경 변수로 설정해 주세요." action={null} /> </div>;
  if (!auth.user) return <div className="admin-shell"><AdminHeader /><section className="access-panel"><div className="access-icon"><ShieldCheck size={27} /></div><p className="eyebrow"><span className="eyebrow-line" /> ADMIN ACCESS</p><h1>관리자 전용 공간입니다.</h1><p>학교 공개 자료를 관리하려면 등록된 관리자 계정으로 로그인해 주세요.</p><form className="login-form" autoComplete="off" onSubmit={handleLogin}><label>관리자 이메일<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" required /></label><label>비밀번호<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="off" required /></label>{loginError && <p className="form-error" role="alert">{loginError}</p>}<button className="primary-button" type="submit" disabled={loginPending}>{loginPending ? "로그인 중…" : "관리자 로그인"}<ArrowLeft size={17} className="button-arrow" /></button></form><a className="back-home" href={homeHref}>← 공개 기록으로 돌아가기</a></section></div>;
  if (auth.role !== "admin") return <div className="admin-shell"><AdminHeader userName={auth.user.email || "사용자"} onLogout={() => void auth.signOut()} /><AccessPanel title="관리자 권한이 없습니다." description="현재 계정은 로그인되어 있지만 자료를 수정할 수 없습니다. 학교 담당자에게 관리자 권한 발급을 요청해 주세요." action={<button className="secondary-button" type="button" onClick={() => void auth.signOut()}><LogOut size={16} /> 로그아웃</button>} /></div>;

  return <div className="admin-shell"><AdminHeader userName={auth.user.email || "관리자"} onLogout={() => void auth.signOut()} /><main className="admin-main container"><div className="admin-title-row"><div><p className="eyebrow"><span className="eyebrow-line" /> MANAGEMENT CONSOLE</p><h1>공개 자료 관리</h1><p>학교가 공개를 승인한 일정과 공지만 등록해 주세요.</p></div><div className="admin-count"><strong>{items.length}</strong><span>전체 자료</span></div></div>{notice && <div className="notice-banner"><CheckCircle2 size={17} /> {notice}<button type="button" aria-label="안내 닫기" onClick={() => setNotice(null)}><X size={16} /></button></div>}
    <div className="admin-grid"><section className="editor-panel"><div className="panel-heading"><div><span className="panel-number">{editingId ? "02" : "01"}</span><h2>{editingId ? "자료 수정" : "새 자료 등록"}</h2></div>{editingId && <button className="icon-button" type="button" onClick={clearEditor} aria-label="수정 취소"><X size={17} /></button>}</div><p className="panel-help">입력한 내용은 저장 즉시 공개 화면에 반영됩니다.</p><form onSubmit={handleSubmit} className="item-form" noValidate><label>제목<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="예: 2학기 중간고사" maxLength={200} required /></label><label>자료 종류<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value as SchoolItemCategory })}>{CATEGORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><div className="form-two-col"><label>시작일<input type="date" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} required /></label><label>종료일 <span className="optional">선택</span><input type="date" value={form.endDate} min={form.startDate} onChange={event => setForm({ ...form, endDate: event.target.value })} /></label></div><label>공개 안내 <span className="optional">선택</span><textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="학생과 보호자에게 전달할 내용을 적어 주세요." rows={5} maxLength={5000} /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="form-actions"><button className="primary-button" type="submit" disabled={actionPending}>{actionPending ? "저장 중…" : editingId ? "수정 저장" : "자료 등록"}<Plus size={17} /></button>{editingId && <button className="secondary-button" type="button" onClick={clearEditor}>취소</button>}</div></form></section><section className="admin-list-panel"><div className="panel-heading"><div><span className="panel-number">03</span><h2>등록된 자료</h2></div><span className="panel-caption">최근 시작일 순</span></div>{listLoading && <div className="inline-state"><div className="loading-mark small-loader" /> 자료를 불러오는 중입니다.</div>}{listError && <div className="inline-state error-text">자료 목록을 불러오지 못했습니다. <button type="button" onClick={() => setRefreshKey(value => value + 1)}>다시 시도</button></div>}{!listLoading && !listError && groupedItems.length === 0 && <div className="admin-empty"><Plus size={22} /><strong>아직 등록된 자료가 없습니다.</strong><p>왼쪽 입력창에서 첫 번째 공개 기록을 등록해 보세요.</p></div>}<div className="admin-record-list">{groupedItems.map(item => <div className="admin-record" key={item.id}><div className="admin-record-top"><span className={`category-pill category-${item.category}`}>{CATEGORY_LABELS[item.category]}</span><span>{formatDateRange(item.startDate, item.endDate)}</span></div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}<div className="admin-record-actions"><button type="button" onClick={() => beginEdit(item)}><Pencil size={14} /> 수정</button><button type="button" className="danger-action" onClick={() => void handleDelete(item)} disabled={actionPending}><Trash2 size={14} /> 삭제</button></div></div>)}</div></section></div><div className="admin-preview-note"><span>PUBLIC PREVIEW</span><p>자료가 공개 화면에서 어떻게 보이는지 확인하려면</p><a href={homeHref}>공개 기록 화면 열기 ↗</a></div></main></div>;
}

function AdminHeader({ userName, onLogout }: { userName?: string; onLogout?: () => void }) { return <header className="admin-topbar"><div className="container admin-topbar-inner"><a href={homeHref} className="brand" aria-label="School Log 홈"><span className="brand-mark">SL</span><span className="brand-copy"><strong>SCHOOL LOG</strong><small>MANAGEMENT CONSOLE</small></span></a>{userName && <div className="admin-user"><span><b>{userName}</b><small>관리자</small></span><button type="button" onClick={onLogout} aria-label="로그아웃"><LogOut size={17} /></button></div>}</div></header>; }

function AccessPanel({ title, description, action }: { title: string; description: string; action: React.ReactNode }) { return <section className="access-panel"><div className="access-icon warning"><ShieldCheck size={27} /></div><p className="eyebrow"><span className="eyebrow-line" /> ACCESS LIMITED</p><h1>{title}</h1><p>{description}</p>{action}<a className="back-home" href={homeHref}>← 공개 기록으로 돌아가기</a></section>; }
