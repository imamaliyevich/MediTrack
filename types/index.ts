export interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string[];
  durationDays: number;
  startDate: string;
}

export interface TreatmentContract {
  id: string;
  patientName: string;
  doctorName: string;
  medications: Medication[];
  adherenceTarget: number;
  consequences: string;
  startDate: string;
  endDate: string;
  signed: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string; // "08:00" format
  timestamp: string;
  verified: boolean;
  photoProof?: string;
  missed?: boolean;
}

export type RiskLevel = 'green' | 'yellow' | 'red';

export interface AdherenceStats {
  takenDoses: number;
  totalDoses: number;
  adherenceRate: number;
  riskLevel: RiskLevel;
  missedCount: number;
}

export interface AIMessage {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}
