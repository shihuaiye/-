import type { Role } from "../types";

type LoginForm = { username: string; password: string };
type RegForm = { username: string; password: string; role: Role };

type Props = {
  loginForm: LoginForm;
  regForm: RegForm;
  showRegister: boolean;
  strength: { label: string; color: string };
  setLoginForm: (value: LoginForm) => void;
  setRegForm: (value: RegForm) => void;
  setShowRegister: (value: boolean) => void;
  onLogin: () => void;
  onRegister: () => void;
};

export function AuthView({
  loginForm,
  regForm,
  showRegister,
  strength,
  setLoginForm,
  setRegForm,
  setShowRegister,
  onLogin,
  onRegister,
}: Props) {
  return (
    <div className="layout-auth">
      <div className="auth-card">
        <h1>校园二手交易平台</h1>
        <p>演示账号：admin / admin123，普通用户：user01 / user123</p>
        <input
          placeholder="用户名"
          value={loginForm.username}
          onChange={(e) => {
            const username = e.target.value;
            setLoginForm({
              username,
              password: username.trim() ? loginForm.password : "",
            });
            if (!username.trim()) {
              localStorage.removeItem("sh-password");
            }
          }}
        />
        <input
          type="password"
          placeholder="密码"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm({ ...loginForm, password: e.target.value })
          }
        />
        <div className="row">
          <button onClick={onLogin}>登录</button>
          <button className="ghost" onClick={() => setShowRegister(true)}>
            去注册
          </button>
          <button
            className="ghost danger"
            onClick={() => {
              setLoginForm({ username: "", password: "" });
              localStorage.removeItem("sh-username");
              localStorage.removeItem("sh-password");
            }}
          >
            清除
          </button>
        </div>
      </div>

      {showRegister && (
        <div className="modal-mask" onClick={() => setShowRegister(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>注册账号</h3>
            <input
              placeholder="用户名"
              value={regForm.username}
              onChange={(e) =>
                setRegForm({ ...regForm, username: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="密码"
              value={regForm.password}
              onChange={(e) =>
                setRegForm({ ...regForm, password: e.target.value })
              }
            />
            <p style={{ color: strength.color, margin: "0 0 10px" }}>
              密码强度：{strength.label}
            </p>
            <select
              value={regForm.role}
              onChange={(e) =>
                setRegForm({ ...regForm, role: e.target.value as Role })
              }
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员（需审核）</option>
            </select>
            <div className="row">
              <button onClick={onRegister}>确认注册</button>
              <button className="ghost" onClick={() => setShowRegister(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
