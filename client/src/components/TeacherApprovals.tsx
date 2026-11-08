import { useCallback, useEffect, useState } from "react";
import { approveTeacher, listPendingTeachers, type PendingTeacher } from "@/lib/supabase";

export default function TeacherApprovals() {
  const [accounts, setAccounts] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await listPendingTeachers());
    } catch {
      setError("가입 대기 목록을 불러오지 못했습니다. 데이터베이스 설정과 연결 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function approve(account: PendingTeacher) {
    if (!window.confirm(`${account.email} 계정이 학교에서 지정한 선생님인지 확인했나요? 승인하면 공개 자료를 등록·수정·삭제할 수 있습니다.`)) return;
    setPendingId(account.id);
    setError(null);
    setMessage(null);
    try {
      await approveTeacher(account.id);
      setMessage(`${account.email} 계정을 승인했습니다.`);
      await refresh();
    } catch {
      setError("계정을 승인하지 못했습니다. 권한과 연결 상태를 확인해 주세요.");
    } finally {
      setPendingId(null);
    }
  }

  return <section className="editor-panel" aria-labelledby="teacher-approvals-title">
    <div className="panel-heading"><div><h2 id="teacher-approvals-title">선생님 가입 승인</h2><p>학교 담당자인지 별도로 확인한 계정만 승인해 주세요.</p></div></div>
    {loading && <p role="status">가입 대기 목록을 불러오는 중입니다.</p>}
    {error && <p className="form-error" role="alert">{error} <button type="button" onClick={() => void refresh()}>다시 시도</button></p>}
    {message && <p role="status">{message}</p>}
    {!loading && !error && accounts.length === 0 && <p>이메일 인증을 마친 대기 계정이 없습니다.</p>}
    {!loading && accounts.map(account => <div key={account.id} className="teacher-approval-row">
      <span>{account.email}</span>
      <button className="secondary-button" type="button" disabled={pendingId !== null} onClick={() => void approve(account)}>
        {pendingId === account.id ? "승인 중…" : "승인"}
      </button>
    </div>)}
  </section>;
}
