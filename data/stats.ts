export type Stat = {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
};

export const stats: Stat[] = [
  { value: 150, suffix: "M+", label: "Monthly trades executed" },
  { value: 3, suffix: "M+", label: "Traders worldwide" },
  { value: 500, suffix: "B+", prefix: "$", label: "Monthly trading volume" },
  { value: 20, suffix: "+", label: "Years of combined experience" },
];
