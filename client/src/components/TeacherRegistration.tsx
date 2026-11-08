import { useState, type FormEvent } from "react";
import { adminHref } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export default function TeacherRegistration() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (!supabase) {
      setError("연결 설정이 필요합니다.");
      return;
    }
    setPending(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: new URL(adminHref, window.location.origin).href },
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        throw new Error("이메일 확인 설정이 필요합니다.");
      }
      setPassword("");
      setConfirmPassword("");
      setMessage("확인 메일을 받을 수 있는 계정이라면 메일을 확인해 주세요. 이메일 인증 후 대표 관리자의 승인이 필요합니다.");
    } catch (registrationError) {
      setError(registrationError instanceof Error && registrationError.message === "이메일 확인 설정이 필요합니다."
        ? "회원가입 설정 오류입니다. 담당자에게 이메일 확인 설정을 요청해 주세요."
        : "가입 요청을 처리하지 못했습니다. 입력 내용과 연결 상태를 확인해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return <section className="access-panel">
    <h1>선생님 회원가입</h1>
    <p>이메일을 인증한 뒤 대표 관리자가 확인하고 승인해야 자료를 관리할 수 있습니다.</p>
    <form className="login-form" autoComplete="off" onSubmit={submit}>
      <label>이메일<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" required /></label>
      <label>비밀번호<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
      <label>비밀번호 확인<input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button className="primary-button" type="submit" disabled={pending}>{pending ? "요청 중…" : "가입 요청"}</button>
    </form>
    <a className="secondary-button" href={adminHref}>로그인으로 돌아가기</a>
  </section>;
}
