export type CampusSite = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type WuhanUniversity = {
  id: string;
  name: string;
  shortName: string;
  campuses: CampusSite[];
};

/** 武汉地区高校及主要校区（用于发布定位、距离排序） */
export const WUHAN_UNIVERSITIES: WuhanUniversity[] = [
  {
    id: "whu",
    name: "武汉大学",
    shortName: "武大",
    campuses: [
      { id: "whu-wenli", name: "文理学部", latitude: 30.5418, longitude: 114.3654 },
      { id: "whu-xinxi", name: "信息学部", latitude: 30.5289, longitude: 114.3598 },
      { id: "whu-gongxue", name: "工学部", latitude: 30.5355, longitude: 114.3682 },
      { id: "whu-yixue", name: "医学部", latitude: 30.5512, longitude: 114.3486 },
    ],
  },
  {
    id: "hust",
    name: "华中科技大学",
    shortName: "华科",
    campuses: [
      { id: "hust-main", name: "主校区", latitude: 30.5149, longitude: 114.4183 },
      { id: "hust-tongji", name: "同济校区", latitude: 30.5798, longitude: 114.2712 },
    ],
  },
  {
    id: "wut",
    name: "武汉理工大学",
    shortName: "理工",
    campuses: [
      { id: "wut-mafang", name: "马房山校区", latitude: 30.5186, longitude: 114.3487 },
      { id: "wut-yujia", name: "余家头校区", latitude: 30.5921, longitude: 114.3821 },
      { id: "wut-nanhu", name: "南湖校区", latitude: 30.5042, longitude: 114.3315 },
    ],
  },
  {
    id: "zuel",
    name: "中南财经政法大学",
    shortName: "中南财",
    campuses: [
      { id: "zuel-shouyi", name: "首义校区", latitude: 30.5341, longitude: 114.3318 },
      { id: "zuel-nanhu", name: "南湖校区", latitude: 30.4758, longitude: 114.3892 },
    ],
  },
  {
    id: "ccnu",
    name: "华中师范大学",
    shortName: "华师",
    campuses: [
      { id: "ccnu-main", name: "主校区（桂子山）", latitude: 30.5195, longitude: 114.3591 },
    ],
  },
  {
    id: "hzau",
    name: "华中农业大学",
    shortName: "华农",
    campuses: [
      { id: "hzau-main", name: "主校区", latitude: 30.4752, longitude: 114.3578 },
    ],
  },
  {
    id: "scuec",
    name: "中南民族大学",
    shortName: "民大",
    campuses: [
      { id: "scuec-main", name: "主校区", latitude: 30.4895, longitude: 114.3912 },
    ],
  },
  {
    id: "cug",
    name: "中国地质大学（武汉）",
    shortName: "地大",
    campuses: [
      { id: "cug-nanwang", name: "南望山校区", latitude: 30.5218, longitude: 114.4045 },
      { id: "cug-future", name: "未来城校区", latitude: 30.4521, longitude: 114.4988 },
    ],
  },
  {
    id: "wust",
    name: "武汉科技大学",
    shortName: "武科大",
    campuses: [
      { id: "wust-huangjiahu", name: "黄家湖校区", latitude: 30.3942, longitude: 114.3215 },
      { id: "wust-qingshan", name: "青山校区", latitude: 30.6321, longitude: 114.4128 },
    ],
  },
  {
    id: "hubu",
    name: "湖北大学",
    shortName: "湖大",
    campuses: [
      { id: "hubu-main", name: "主校区（沙湖）", latitude: 30.5792, longitude: 114.3385 },
      { id: "hubu-yangguang", name: "阳逻校区", latitude: 30.7125, longitude: 114.5521 },
    ],
  },
  {
    id: "wtu",
    name: "武汉纺织大学",
    shortName: "纺大",
    campuses: [
      { id: "wtu-sunshine", name: "阳光校区", latitude: 30.3812, longitude: 114.3188 },
    ],
  },
  {
    id: "hbut",
    name: "湖北工业大学",
    shortName: "湖工大",
    campuses: [
      { id: "hbut-main", name: "主校区", latitude: 30.4328, longitude: 114.3012 },
    ],
  },
  {
    id: "jhun",
    name: "江汉大学",
    shortName: "江大",
    campuses: [
      { id: "jhun-main", name: "主校区", latitude: 30.5012, longitude: 114.2185 },
    ],
  },
  {
    id: "hbue",
    name: "湖北经济学院",
    shortName: "经院",
    campuses: [
      { id: "hbue-main", name: "主校区", latitude: 30.4185, longitude: 114.4521 },
    ],
  },
  {
    id: "whpu",
    name: "武汉轻工大学",
    shortName: "轻工",
    campuses: [
      { id: "whpu-main", name: "金银湖校区", latitude: 30.6521, longitude: 114.2188 },
    ],
  },
  {
    id: "hbucm",
    name: "湖北中医药大学",
    shortName: "中医药",
    campuses: [
      { id: "hbucm-main", name: "黄家湖校区", latitude: 30.4012, longitude: 114.2895 },
    ],
  },
];

export const findUniversity = (universityId: string) =>
  WUHAN_UNIVERSITIES.find((u) => u.id === universityId);

export const findCampus = (universityId: string, campusId: string) =>
  findUniversity(universityId)?.campuses.find((c) => c.id === campusId);

export const searchUniversities = (keyword: string) => {
  const q = keyword.trim().toLowerCase();
  if (!q) return WUHAN_UNIVERSITIES;
  return WUHAN_UNIVERSITIES.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.shortName.toLowerCase().includes(q) ||
      u.campuses.some((c) => c.name.toLowerCase().includes(q)),
  );
};

export type CampusSelection = {
  universityId: string;
  universityName: string;
  campusId: string;
  campusName: string;
  meetPoint: string;
  latitude: number;
  longitude: number;
};

export const formatCampusLabel = (sel: Pick<CampusSelection, "universityName" | "campusName" | "meetPoint">) => {
  const base = `${sel.universityName} · ${sel.campusName}`;
  return sel.meetPoint.trim() ? `${base} · ${sel.meetPoint.trim()}` : base;
};

/** 兼容旧版 PRESET_LOCATIONS / 距离计算 */
export const flattenCampusLocations = () =>
  WUHAN_UNIVERSITIES.flatMap((u) =>
    u.campuses.map((c) => ({
      label: u.name,
      campus: formatCampusLabel({
        universityName: u.name,
        campusName: c.name,
        meetPoint: "",
      }),
      latitude: c.latitude,
      longitude: c.longitude,
    })),
  );
