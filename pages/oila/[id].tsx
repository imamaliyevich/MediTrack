import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TreatmentContract, MedicationLog, AdherenceStats } from '@/types';
import { calculateAdherence } from '@/lib/adherence';
import RiskIndicator from '@/components/RiskIndicator';

export default function FamilyPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [contract, setContract] = useState<TreatmentContract | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [stats, setStats] = useState<AdherenceStats>(calculateAdherence(0, 0));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatientData(id as string);
    }
  }, [id]);

  useEffect(() => {
    if (contract) {
      // Barcha dorilarning jami schedule'larini hisoblash
      const totalSchedules = contract.medications.reduce((total, med) => total + med.schedule.length, 0);
      const totalDoses = totalSchedules * 7; // 7 kun uchun
      const takenDoses = logs.filter(l => !l.missed).length;
      setStats(calculateAdherence(takenDoses, totalDoses));
    }
  }, [logs, contract]);

  const loadPatientData = (patientId: string) => {
    const savedData = localStorage.getItem(`patient_${patientId}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setContract(data.contract);
      setLogs(data.logs || []);
    } else {
      setNotFound(true);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link topilmadi</h2>
          <p className="text-gray-600 mb-6">
            Siz kiritgan link mavjud emas yoki noto'g'ri. Iltimos, to'g'ri linkni tekshiring yoki shifokoringizga murojaat qiling.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-smooth"
            >
              Qayta urinish
            </button>
            <p className="text-sm text-gray-500">
              Yordam kerakmi? Shifokoringizga murojaat qiling
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Oila Paneli</h1>
        </div>

        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {contract.patientName}ning Rioyasi
            </h2>
            <div className="flex items-center justify-between">
              <RiskIndicator level={stats.riskLevel} adherenceRate={stats.adherenceRate} />
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.adherenceRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-500">{stats.takenDoses} / {stats.totalDoses} dori</p>
              </div>
            </div>
          </div>

          {stats.missedCount >= 3 && (
            <div className="bg-danger bg-opacity-10 border border-danger rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-danger mb-1">Jiddiy Ogohlantirish</h3>
                  <p className="text-sm text-gray-700">
                    {contract.patientName} {stats.missedCount} marta dorini qabul qilmadi. Iltimos, yordam bering.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">So'nggi Faoliyat</h3>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {logs.slice(-10).reverse().map(log => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString('uz-UZ')}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    log.verified ? 'bg-success bg-opacity-10 text-success' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {log.verified ? 'Tasdiqlangan' : 'Qabul qilindi'}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Hozircha faoliyat yo'q</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
