import { RiskLevel } from '@/types';
import { getRiskColor, getRiskBgColor } from '@/lib/adherence';

interface RiskIndicatorProps {
  level: RiskLevel;
  adherenceRate: number;
}

export default function RiskIndicator({ level, adherenceRate }: RiskIndicatorProps) {
  const labels = {
    green: 'Yaxshi',
    yellow: 'Xavf Ostida',
    red: 'Jiddiy'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${getRiskBgColor(level)} transition-smooth animate-pulse`} />
      <div>
        <p className={`text-sm font-semibold ${getRiskColor(level)}`}>
          {labels[level]}
        </p>
        <p className="text-xs text-gray-500">
          {adherenceRate.toFixed(0)}% rioya
        </p>
      </div>
    </div>
  );
}
