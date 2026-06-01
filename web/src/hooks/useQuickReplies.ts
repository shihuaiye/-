import { useCallback, useState } from "react";
import { api } from "../services/api.ts";
import { BUILTIN_QUICK_REPLIES } from "../constants.ts";

export function useQuickReplies(authHeaders: () => HeadersInit) {
  const [builtin, setBuiltin] = useState<string[]>([...BUILTIN_QUICK_REPLIES]);
  const [custom, setCustom] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const loadQuickReplies = useCallback(async () => {
    const json = await api.profile.quickReplies(authHeaders());
    if (!json.success) return;
    setBuiltin(json.data.builtin);
    setCustom(json.data.custom);
  }, [authHeaders]);

  const saveCustom = async () => {
    const json = await api.profile.saveQuickReplies(custom, authHeaders());
    if (!json.success) return alert(json.message);
    setCustom(json.data.custom);
    setShowEditor(false);
    alert("快捷回复已保存");
  };

  const addCustom = () => {
    const text = draft.trim();
    if (!text) return;
    if (custom.includes(text) || builtin.includes(text)) {
      return alert("该回复已存在");
    }
    setCustom((prev) => [...prev, text].slice(0, 12));
    setDraft("");
  };

  const removeCustom = (text: string) => {
    setCustom((prev) => prev.filter((x) => x !== text));
  };

  const allReplies = [...builtin, ...custom];

  return {
    builtin,
    custom,
    draft,
    setDraft,
    showEditor,
    setShowEditor,
    allReplies,
    loadQuickReplies,
    saveCustom,
    addCustom,
    removeCustom,
  };
}
