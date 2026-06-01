import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.ts";
import type { Role, User } from "../types";
import { passwordStrength } from "../utils.ts";

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("sh-token") || "");
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    password: "",
    role: "user" as Role,
    school: "武汉大学",
  });
  const [showRegister, setShowRegister] = useState(false);

  const authHeaders = useCallback(
    (): HeadersInit => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const hydrateUser = (u: User) => {
    const school = localStorage.getItem(`sh-school-${u.username}`);
    return school ? { ...u, school } : u;
  };

  const fetchMe = useCallback(async () => {
    if (!token) return;
    const json = await api.auth.me(authHeaders());
    if (json.success) setUser(hydrateUser(json.data));
  }, [token, authHeaders]);

  const login = async () => {
    const json = await api.auth.login(loginForm);
    if (!json.success) return alert(json.message);
    setToken(json.data.token);
    setUser(hydrateUser(json.data.user));
    localStorage.setItem("sh-token", json.data.token);
    localStorage.removeItem("sh-password");
  };

  const register = async () => {
    const strength = passwordStrength(regForm.password);
    if (!strength.pass) {
      return alert("密码强度过弱，请至少满足8位并包含数字/字母组合");
    }
    const json = await api.auth.register(regForm);
    if (!json.success) return alert(json.message);
    if (regForm.school) {
      localStorage.setItem(`sh-school-${regForm.username}`, regForm.school);
    }
    alert(json.message || "注册成功，请登录");
    setShowRegister(false);
    setRegForm({ username: "", password: "", role: "user", school: "武汉大学" });
  };

  const logout = () => {
    localStorage.removeItem("sh-token");
    localStorage.removeItem("sh-password");
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const savedUsername = localStorage.getItem("sh-username");
    if (savedUsername) {
      setLoginForm((f) => ({ ...f, username: savedUsername }));
    }
  }, []);

  return {
    token,
    user,
    setUser,
    loginForm,
    setLoginForm,
    regForm,
    setRegForm,
    showRegister,
    setShowRegister,
    authHeaders,
    login,
    register,
    logout,
    passwordStrength,
  };
}
