export type Route = '口服' | '外用' | '其他';

export type MedicineForm = '片' | '粒' | '胶囊' | '袋' | '包' | '毫克(mg)' | '毫升(ml)' | '滴' | '喷' | '贴' | '支' | '勺' | '无';

export interface Profile {
  id: string;
  name: string; // 称呼，如“妈妈”
  avatar: string; // emoji
  color: string; // 头像底色
  createdAt: number;
}

export interface Medicine {
  id: string;
  profileId: string;
  name: string;
  route: Route;
  dose: string; // 每次用量，如 “1”
  unit: MedicineForm; // “片/粒/毫升...”
  frequency: string; // 频次描述，如 “每日3次”
  times: string[]; // 服药时间 HH:MM
  note: string;
  createdAt: number;
}

export interface InteractionItem {
  title: string;
  content: string;
}

export interface AppState {
  profiles: Profile[];
  activeProfileId: string | null;
  medicines: Medicine[];
  // taken: { [dateStr]: string[] } 元素为 `${medId}|${time}`
  taken: Record<string, string[]>;
}