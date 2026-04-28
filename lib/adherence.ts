import { RiskLevel, AdherenceStats } from '@/types';

export function calculateAdherence(takenDoses: number, totalExpectedDoses: number): AdherenceStats {
  const adherenceRate = totalExpectedDoses > 0 ? (takenDoses / totalExpectedDoses) * 100 : 100;
  const missedCount = Math.max(0, totalExpectedDoses - takenDoses); // Manfiy bo'lmasligi uchun
  
  let riskLevel: RiskLevel = 'green';
  if (adherenceRate < 50) {
    riskLevel = 'red';
  } else if (adherenceRate < 80) {
    riskLevel = 'yellow';
  }
  
  return {
    takenDoses,
    totalDoses: totalExpectedDoses,
    adherenceRate,
    riskLevel,
    missedCount
  };
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'green': return 'text-success';
    case 'yellow': return 'text-warning';
    case 'red': return 'text-danger';
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'green': return 'bg-success';
    case 'yellow': return 'bg-warning';
    case 'red': return 'bg-danger';
  }
}
