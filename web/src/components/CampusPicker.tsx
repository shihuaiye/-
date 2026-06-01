import { useMemo, useState } from "react";
import {
  WUHAN_UNIVERSITIES,
  findCampus,
  findUniversity,
  formatCampusLabel,
  searchUniversities,
  type CampusSelection,
} from "../constants/wuhanUniversities.ts";

export type CampusPickerValue = CampusSelection;

type Props = {
  value: CampusPickerValue | null;
  onChange: (value: CampusPickerValue) => void;
};

const emptySelection = (): CampusPickerValue => ({
  universityId: "",
  universityName: "",
  campusId: "",
  campusName: "",
  meetPoint: "",
  latitude: 0,
  longitude: 0,
});

export function CampusPicker({ value, onChange }: Props) {
  const [keyword, setKeyword] = useState("");
  const selectedUniId = value?.universityId || "";

  const filtered = useMemo(() => searchUniversities(keyword), [keyword]);
  const selectedUni = findUniversity(selectedUniId);

  const pickUniversity = (universityId: string) => {
    const uni = findUniversity(universityId);
    if (!uni) return;
    const first = uni.campuses[0];
    onChange({
      universityId: uni.id,
      universityName: uni.name,
      campusId: first?.id || "",
      campusName: first?.name || "",
      meetPoint: value?.meetPoint || "",
      latitude: first?.latitude ?? 0,
      longitude: first?.longitude ?? 0,
    });
  };

  const pickCampus = (campusId: string) => {
    if (!selectedUni) return;
    const campus = findCampus(selectedUni.id, campusId);
    if (!campus) return;
    onChange({
      universityId: selectedUni.id,
      universityName: selectedUni.name,
      campusId: campus.id,
      campusName: campus.name,
      meetPoint: value?.meetPoint || "",
      latitude: campus.latitude,
      longitude: campus.longitude,
    });
  };

  return (
    <div className="campus-picker">
      <div className="campus-picker-header">
        <label className="field-label">交易院校与校区</label>
        <p className="campus-picker-hint muted">
          面向武汉高校圈，先选学校再选校区，可补充具体自提点（宿舍楼、校门等）
        </p>
      </div>

      <div className="campus-picker-search">
        <input
          className="field-input"
          placeholder="搜索学校名称或简称，如「武大」「华科」"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="campus-picker-universities">
        {filtered.length === 0 ? (
          <p className="muted campus-picker-empty">未找到匹配的学校</p>
        ) : (
          filtered.map((uni) => (
            <button
              key={uni.id}
              type="button"
              className={
                selectedUniId === uni.id
                  ? "campus-uni-card active"
                  : "campus-uni-card"
              }
              onClick={() => pickUniversity(uni.id)}
            >
              <span className="campus-uni-name">{uni.name}</span>
              <span className="campus-uni-short muted">{uni.shortName}</span>
              <span className="campus-uni-count muted">
                {uni.campuses.length} 个校区
              </span>
            </button>
          ))
        )}
      </div>

      {selectedUni && (
        <div className="campus-picker-campuses panel">
          <div className="campus-picker-step-label">
            选择 <strong>{selectedUni.name}</strong> 的校区
          </div>
          <div className="campus-picker-campus-grid">
            {selectedUni.campuses.map((c) => (
              <button
                key={c.id}
                type="button"
                className={
                  value?.campusId === c.id ? "chip active" : "chip"
                }
                onClick={() => pickCampus(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="campus-picker-meet">
        <label className="field-label">具体自提点（选填）</label>
        <input
          className="field-input"
          placeholder="例如：信息学部宿舍楼下、南门快递站"
          value={value?.meetPoint || ""}
          disabled={!value?.universityId}
          onChange={(e) => {
            if (!value?.universityId) return;
            onChange({ ...value, meetPoint: e.target.value });
          }}
        />
      </div>

      {value?.universityId && value.campusId && (
        <div className="campus-picker-summary">
          <span className="campus-picker-summary-label">已选位置</span>
          <span>{formatCampusLabel(value)}</span>
        </div>
      )}
    </div>
  );
}

export function campusSelectionFromPublishForm(form: {
  school: string;
  schoolDetail: string;
  latitude?: number;
  longitude?: number;
}): CampusPickerValue | null {
  if (!form.school) return null;
  const uni =
    WUHAN_UNIVERSITIES.find((u) => u.name === form.school) ||
    WUHAN_UNIVERSITIES.find((u) => form.school.includes(u.name));
  if (!uni) {
    return {
      ...emptySelection(),
      universityName: form.school,
      campusName: form.schoolDetail,
      meetPoint: "",
      latitude: form.latitude ?? 0,
      longitude: form.longitude ?? 0,
    };
  }
  const campus =
    uni.campuses.find((c) => c.name === form.schoolDetail) || uni.campuses[0];
  return {
    universityId: uni.id,
    universityName: uni.name,
    campusId: campus?.id || "",
    campusName: campus?.name || form.schoolDetail,
    meetPoint: "",
    latitude: form.latitude ?? campus?.latitude ?? 0,
    longitude: form.longitude ?? campus?.longitude ?? 0,
  };
}

export function applyCampusToPublishForm(
  sel: CampusPickerValue,
  prev: { school: string; schoolDetail: string; campus: string; latitude?: number; longitude?: number },
) {
  return {
    ...prev,
    school: sel.universityName,
    schoolDetail: sel.campusName,
    campus: formatCampusLabel(sel),
    latitude: sel.latitude,
    longitude: sel.longitude,
  };
}
