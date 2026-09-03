// Placeholder data — swap these for real API calls later.

export type IncidentSeverity = "critical" | "high" | "moderate";
export type IncidentStatus = "active" | "responding" | "contained";

export interface Incident {
  id: string;
  title: string;
  category: string;
  location: string;
  distance: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: string;
  responders: number;
}

export const incidents: Incident[] = [
  {
    id: "inc-1042",
    title: "Multi-vehicle collision",
    category: "Traffic Accident",
    location: "Park St & Camac St crossing",
    distance: "0.6 km",
    severity: "critical",
    status: "active",
    reportedAt: "2 min ago",
    responders: 4,
  },
  {
    id: "inc-1041",
    title: "Apartment fire, 3rd floor",
    category: "Fire",
    location: "Ballygunge Circular Rd",
    distance: "1.2 km",
    severity: "critical",
    status: "responding",
    reportedAt: "9 min ago",
    responders: 11,
  },
  {
    id: "inc-1039",
    title: "Elderly man collapsed",
    category: "Medical",
    location: "Rabindra Sarobar Lake, Gate 2",
    distance: "1.8 km",
    severity: "high",
    status: "responding",
    reportedAt: "14 min ago",
    responders: 2,
  },
  {
    id: "inc-1037",
    title: "Flooded underpass, vehicles stuck",
    category: "Flood",
    location: "EM Bypass underpass",
    distance: "2.4 km",
    severity: "moderate",
    status: "contained",
    reportedAt: "31 min ago",
    responders: 6,
  },
];

export const currentUser = {
  name: "Ananya Roy",
  platformId: "CSOS-KOL-00847",
  profession: "Paramedic",
  verified: true,
  badges: ["ID Verified", "First Aid Certified", "Background Checked"],
  skills: ["CPR", "Trauma care", "Triage", "Ambulance driving"],
  volunteerMode: true,
};

export const adminStats = [
  { label: "Active Emergencies", value: "23", delta: "+4 in last hour", tone: "sos" as const },
  { label: "Volunteers Online", value: "412", delta: "86 within 2 km", tone: "safe" as const },
  { label: "Connected Hospitals", value: "17", delta: "3 on standby", tone: "info" as const },
  { label: "Flagged Reports", value: "5", delta: "2 pending review", tone: "warning" as const },
];
