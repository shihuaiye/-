import type { Role } from "../types";

type LoginForm = { username: string; password: string };
type RegForm = {
  username: string;
  password: string;
  role: Role;
  school: string;
};

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
        <div className="auth-brand">
          <span className="auth-brand-icon">🏫</span>
          <div>
            <h1>珞珈优选</h1>
            <p>校园二手优选平台</p>
          </div>
        </div>

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
        <div className="row auth-actions">
          <button className="primary wide" onClick={onLogin}>
            登录
          </button>
          <button className="ghost wide" onClick={() => setShowRegister(true)}>
            注册
          </button>
        </div>
      </div>

      {showRegister && (
        <div className="modal-mask" onClick={() => setShowRegister(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="auth-brand auth-brand-small">
              <span className="auth-brand-icon">🏫</span>
              <div>
                <h3>注册珞珈优选</h3>
              </div>
            </div>
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
              value={regForm.school}
              onChange={(e) =>
                setRegForm({ ...regForm, school: e.target.value })
              }
            >
              <option value="武汉大学">武汉大学</option>
              <option value="华中科技大学">华中科技大学</option>
              <option value="武汉理工大学">武汉理工大学</option>
              <option value="中南财经政法大学">中南财经政法大学</option>
              <option value="华中师范大学">华中师范大学</option>
              <option value="中国地质大学（武汉）">中国地质大学（武汉）</option>
              <option value="中央民族大学">中央民族大学</option>
            </select>
            <select
              value={regForm.role}
              onChange={(e) =>
                setRegForm({ ...regForm, role: e.target.value as Role })
              }
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员（需审核）</option>
            </select>
            <div className="row auth-actions">
              <button className="primary wide" onClick={onRegister}>
                确认注册
              </button>
              <button
                className="ghost wide"
                onClick={() => setShowRegister(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
