export type HostelKey = "Main Gate" | "Hostel FRG / Block F" | "Hostel J / K / L Cluster" | "Hostel M / O Cluster" | "Girls Hostel Cluster (E / G / I / N)";
export type HubName = "Patiala Railway Station" | "Rajpura Junction Railway Station" | "Ambala Cantt Junction" | "Chandigarh Airport (IXC) / ISBT-43";

export const CAMPUS_NODES: Record<HostelKey, [number, number]> = {
  "Main Gate": [30.3529, 76.3737], "Hostel FRG / Block F": [30.3558, 76.3692],
  "Hostel J / K / L Cluster": [30.3571, 76.3645], "Hostel M / O Cluster": [30.3585, 76.3618],
  "Girls Hostel Cluster (E / G / I / N)": [30.3538, 76.3710],
};
export const TRANSIT_HUBS: Record<HubName, { coords: [number, number]; fare: number; buffer: number }> = {
  "Patiala Railway Station": { coords: [30.3398, 76.4026], fare: 250, buffer: 45 },
  "Rajpura Junction Railway Station": { coords: [30.4840, 76.5936], fare: 800, buffer: 90 },
  "Ambala Cantt Junction": { coords: [30.3382, 76.8267], fare: 1400, buffer: 120 },
  "Chandigarh Airport (IXC) / ISBT-43": { coords: [30.6735, 76.7885], fare: 1800, buffer: 150 },
};
export const hubNames = Object.keys(TRANSIT_HUBS) as HubName[];
