import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const timeToMinutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
export const fmtTime = (time: string) => new Date(`2020-01-01T${time}:00`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
