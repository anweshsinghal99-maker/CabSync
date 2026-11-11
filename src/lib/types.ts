import type { HostelKey, HubName } from "./constants";
export type ParsedTicket = { passenger_name: string; pnr_display: string; pnr_hash: string; transit_type: "TRAIN" | "FLIGHT" | "BUS"; transit_number: string; destination_hub: HubName; departure_date: string; transit_departure_time: string; recommended_campus_leave_time: string };
export type StudentProfile = { email: string; gender: "Female" | "Male" | "Non-binary" | "Prefer not to say" };
export type LuggageSize = "Small" | "Medium" | "Large";
export type PodMember = { id: string; name: string; hostel: HostelKey; luggage: LuggageSize; female?: boolean };
export type Pod = { id: string; destination_hub: HubName; departure_date: string; campus_leave_time: string; female_only: boolean; members: PodMember[]; fare: number };
