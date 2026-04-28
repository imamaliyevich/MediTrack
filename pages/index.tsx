import { useState, useEffect } from 'react';
import { TreatmentContract, MedicationLog } from '@/types';
import { calculateDaysPassed, calculateExpectedDoses } from '@/lib/dateUtils';
import DoctorDashboard from '@/components/DoctorDashboard';
import axios from 'axios';

interface Patient {
  id: string;
  name: string;
  contract?: TreatmentContract;
  adherenceRate: number;
  riskLevel: 'green' | 'yellow' | 'red';
  logs: MedicationLog[];
}

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    fullName: '', 
    username: '', 
    password: '', 
    confirmPassword: '',
    specialization: '',
    licenseNumber: ''
  });

  useEffect(() => {
    // Shifokor login holatini tekshirish
    const doctorToken = localStorage.getItem('doctorToken');
    if (doctorToken) {
      setIsLoggedIn(true);
      loadPatients();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Bu yerda haqiqiy API chaqiruvi bo'lishi kerak
      // Hozircha demo uchun
      if (loginData.username && loginData.password) {
        localStorage.setItem('doctorToken', 'demo-token');
        localStorage.setItem('doctorName', loginData.username);
        setIsLoggedIn(true);
        loadPatients();
      } else {
        alert('Iltimos, barcha maydonlarni to\'ldiring');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Kirish jarayonida xatolik yuz berdi');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert('Parollar mos kelmaydi');
      return;
    }
    try {
      // Bu yerda haqiqiy API chaqiruvi bo'lishi kerak
      // Hozircha demo uchun
      if (registerData.fullName && registerData.username && registerData.password) {
        localStorage.setItem('doctorToken', 'demo-token');
        localStorage.setItem('doctorName', registerData.fullName);
        setIsLoggedIn(true);
        loadPatients();
      } else {
        alert('Iltimos, barcha maydonlarni to\'ldiring');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('Ro\'yxatdan o\'tish jarayonida xatolik yuz berdi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorName');
    setIsLoggedIn(false);
    setPatients([]);
  };

  const loadPatients = async () => {
    try {
      const response = await axios.get('/api/contracts');
      const contracts = response.data;
      
      const patientsData = await Promise.all(
        contracts.map(async (contract: TreatmentContract) => {
          try {
            const logsResponse = await axios.get(`/api/logs/${contract.id}`);
            const logs = logsResponse.data;
            
            // Calculate adherence - yangi usul
            const daysPassed = calculateDaysPassed(contract.startDate);
            const totalExpectedDoses = calculateExpectedDoses(contract.medications, daysPassed);
            const takenDoses = logs.filter((l: MedicationLog) => !l.missed).length;
            const adherenceRate = totalExpectedDoses > 0 ? (takenDoses / totalExpectedDoses) * 100 : 100;
            
            let riskLevel: 'green' | 'yellow' | 'red' = 'green';
            if (adherenceRate < 50) riskLevel = 'red';
            else if (adherenceRate < 80) riskLevel = 'yellow';
            
            return {
              id: contract.id,
              name: contract.patientName,
              contract,
              adherenceRate,
              riskLevel,
              logs
            };
          } catch (error) {
            return {
              id: contract.id,
              name: contract.patientName,
              contract,
              adherenceRate: 100,
              riskLevel: 'green' as const,
              logs: []
            };
          }
        })
      );
      
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (newContract: TreatmentContract) => {
    try {
      await axios.post('/api/contracts', newContract);
      await loadPatients();
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Shartnoma yaratishda xatolik yuz berdi');
    }
  };

  const handleUpdateContract = async (updatedContract: TreatmentContract) => {
    try {
      await axios.put(`/api/contracts/${updatedContract.id}`, updatedContract);
      await loadPatients();
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Shartnomani yangilashda xatolik yuz berdi');
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      await axios.delete(`/api/contracts/${contractId}`);
      await loadPatients();
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Shartnomani o\'chirishda xatolik yuz berdi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {showRegister ? 'Ro\'yxatdan o\'tish' : 'Shifokor paneli'}
            </h2>
            <p className="text-gray-600">
              {showRegister ? 'Yangi shifokor hisobi yarating' : 'Hisobingizga kiring'}
            </p>
          </div>

          {!showRegister ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foydalanuvchi nomi
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parol
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-600 transition-smooth font-medium"
              >
                Kirish
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="text-primary hover:text-blue-600 text-sm"
                >
                  Hisobingiz yo'qmi? Ro'yxatdan o'ting
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To'liq ism
                </label>
                <input
                  type="text"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mutaxassislik
                </label>
                <input
                  type="text"
                  value={registerData.specialization}
                  onChange={(e) => setRegisterData({...registerData, specialization: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Masalan: Kardiolog, Terapevt"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Litsenziya raqami
                </label>
                <input
                  type="text"
                  value={registerData.licenseNumber}
                  onChange={(e) => setRegisterData({...registerData, licenseNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foydalanuvchi nomi
                </label>
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parol
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parolni tasdiqlang
                </label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-600 transition-smooth font-medium"
              >
                Ro'yxatdan o'tish
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="text-primary hover:text-blue-600 text-sm"
                >
                  Hisobingiz bormi? Kirish
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <DoctorDashboard 
      onCreateContract={handleCreateContract}
      onUpdateContract={handleUpdateContract}
      onDeleteContract={handleDeleteContract}
      onBackToPatient={() => {}}
      onLogout={handleLogout}
      patients={patients}
      onRefresh={loadPatients}
    />
  );
}
