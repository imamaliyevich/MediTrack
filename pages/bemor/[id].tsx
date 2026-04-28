import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TreatmentContract, MedicationLog, AdherenceStats, Medication } from '@/types';
import { calculateAdherence } from '@/lib/adherence';
import { calculateDaysPassed, calculateExpectedDoses } from '@/lib/dateUtils';
import RiskIndicator from '@/components/RiskIndicator';
import MedicationSchedule from '@/components/MedicationSchedule';
import AIChat from '@/components/AIChat';
import ContractView from '@/components/ContractView';
import axios from 'axios';

export default function PatientPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [view, setView] = useState<'loading' | 'contract' | 'dashboard' | 'notfound'>('loading');
  const [contract, setContract] = useState<TreatmentContract | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [stats, setStats] = useState<AdherenceStats>(calculateAdherence(0, 0));
  const [showAIChat, setShowAIChat] = useState(false);
  const [escalationLevel, setEscalationLevel] = useState(0);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  useEffect(() => {
    if (id) {
      loadPatientData(id as string);
    }
  }, [id]);

  useEffect(() => {
    if (contract) {
      // Yangi hisoblash usuli
      const daysPassed = calculateDaysPassed(contract.startDate);
      const totalExpectedDoses = calculateExpectedDoses(contract.medications, daysPassed);
      const takenDoses = logs.filter(l => !l.missed).length;
      
      const newStats = calculateAdherence(takenDoses, totalExpectedDoses);
      setStats(newStats);
      
      console.log('Hisoblash:', {
        daysPassed,
        totalExpectedDoses,
        takenDoses,
        missedCount: newStats.missedCount
      });
    }
  }, [logs, contract]);

  useEffect(() => {
    if (stats.missedCount >= 2 && escalationLevel < 2) {
      setEscalationLevel(2);
      setShowAIChat(true);
    } else if (stats.missedCount === 1 && escalationLevel < 1) {
      setEscalationLevel(1);
    }
  }, [stats.missedCount]);

  const loadPatientData = async (patientId: string) => {
    try {
      const contractResponse = await axios.get(`/api/contracts/${patientId}`);
      const contractData = contractResponse.data;
      
      const logsResponse = await axios.get(`/api/logs/${patientId}`);
      const logsData = logsResponse.data;
      
      setContract(contractData);
      setLogs(logsData);
      setView(contractData.signed ? 'dashboard' : 'contract');
      
      if (contractData.medications && contractData.medications.length > 0) {
        setSelectedMedication(contractData.medications[0]);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      setView('notfound');
    }
  };

  const handleSignContract = async () => {
    if (contract && id) {
      try {
        const updatedContract = { ...contract, signed: true };
        await axios.put(`/api/contracts/${id}`, updatedContract);
        setContract(updatedContract);
        setView('dashboard');
      } catch (error) {
        console.error('Error signing contract:', error);
      }
    }
  };

  const handleMedicationConfirm = async (scheduledTime: string, withPhoto: boolean) => {
    if (!selectedMedication || !id) return;
    
    const newLog: MedicationLog = {
      id: Date.now().toString(),
      medicationId: selectedMedication.id,
      scheduledTime: scheduledTime,
      timestamp: new Date().toISOString(),
      verified: withPhoto,
      missed: false
    };
    
    // Darhol lokal holatni yangilaymiz
    setLogs([...logs, newLog]);
    
    // Keyin API ga yuboramiz
    try {
      await axios.post(`/api/logs/${id}`, newLog);
    } catch (error) {
      console.error('Error saving log:', error);
      // Agar xatolik bo'lsa, logni qaytarib olamiz
      setLogs(logs.filter(log => log.id !== newLog.id));
    }
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (view === 'notfound') {
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

  if (view === 'contract' && contract) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <ContractView contract={contract} onSign={handleSignContract} />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Shartnoma Topilmadi</h2>
          <p className="text-gray-600 mb-6">
            Ushbu link hali faol emas yoki noto'g'ri. Iltimos, shifokoringizdan to'g'ri linkni so'rang.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-smooth"
          >
            Bosh Sahifaga Qaytish
          </button>
        </div>
      </div>
    );
  }

  const activeMedications = contract.medications.filter(med => {
    const daysPassed = Math.floor((Date.now() - new Date(med.startDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysPassed < med.durationDays;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Davolash Paneli</h1>
          <button
            onClick={() => setShowAIChat(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-smooth flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            AI Yordamchi
          </button>
        </div>

        <div className="grid gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Rioya Holati</h2>
                <p className="text-sm text-gray-500">
                  Davolanish: {new Date(contract.startDate).toLocaleDateString('uz-UZ')} - {new Date(contract.endDate).toLocaleDateString('uz-UZ')}
                </p>
              </div>
              <RiskIndicator level={stats.riskLevel} adherenceRate={stats.adherenceRate} />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{stats.takenDoses}</p>
                <p className="text-xs text-gray-500 mt-1">Qabul qilindi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDoses}</p>
                <p className="text-xs text-gray-500 mt-1">Jami kerak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-danger">{stats.missedCount}</p>
                <p className="text-xs text-gray-500 mt-1">O'tkazildi</p>
              </div>
            </div>
          </div>

          {escalationLevel > 0 && (
            <div className={`rounded-lg p-4 border ${
              escalationLevel === 1 
                ? 'bg-warning bg-opacity-10 border-warning' 
                : 'bg-danger bg-opacity-10 border-danger'
            }`}>
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${escalationLevel === 1 ? 'text-warning' : 'text-danger'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">
                  {escalationLevel === 1 
                    ? 'Eslatma: Iltimos, dorini belgilangan vaqtda qabul qiling' 
                    : 'Jiddiy: Bir necha marta o\'tkazildi. Oilangizga xabar berildi.'}
                </p>
              </div>
            </div>
          )}

          {activeMedications.length > 0 && (
            <div className="space-y-4">
              {activeMedications.map((med) => (
                <MedicationSchedule
                  key={med.id}
                  medication={med}
                  logs={logs}
                  onConfirm={handleMedicationConfirm}
                />
              ))}
            </div>
          )}

          {activeMedications.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <svg className="w-16 h-16 text-success mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Davolanish Tugadi!</h3>
              <p className="text-gray-600">
                Barcha dorilarni belgilangan muddatda qabul qildingiz. Tabriklaymiz!
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">So'nggi Faoliyat</h3>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {logs.slice(-10).reverse().map(log => {
              const med = contract.medications.find(m => m.id === log.medicationId);
              return (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm text-gray-900 font-medium">
                      {med ? `${med.name} ${med.dosage}` : 'Dori'}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      {log.scheduledTime} - {new Date(log.timestamp).toLocaleString('uz-UZ')}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    log.verified ? 'bg-success bg-opacity-10 text-success' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {log.verified ? 'Tasdiqlangan' : 'Qabul qilindi'}
                  </span>
                </div>
              );
            })}
            {logs.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Hozircha faoliyat yo'q</p>
            )}
          </div>
        </div>
      </div>

      <AIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        missedCount={stats.missedCount}
        patientName={contract.patientName}
        patientData={{
          medications: contract.medications,
          logs: logs,
          adherenceRate: stats.adherenceRate,
          contract: contract
        }}
      />
    </div>
  );
}
