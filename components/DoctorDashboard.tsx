import { useState, useEffect } from 'react';
import { TreatmentContract } from '@/types';
import { generatePatientLink, copyToClipboard, generateUniquePatientId } from '@/lib/linkGenerator';

interface Patient {
  id: string;
  name: string;
  contract?: TreatmentContract;
  adherenceRate: number;
  riskLevel: 'green' | 'yellow' | 'red';
  patientLink?: string;
}

interface DoctorDashboardProps {
  onCreateContract: (contract: TreatmentContract) => Promise<void>;
  onUpdateContract: (contract: TreatmentContract) => Promise<void>;
  onDeleteContract: (contractId: string) => Promise<void>;
  onBackToPatient: () => void;
  onLogout?: () => void;
  patients: Patient[];
  onRefresh: () => void;
}

export default function DoctorDashboard({ onCreateContract, onUpdateContract, onDeleteContract, onBackToPatient, onLogout, patients, onRefresh }: DoctorDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContract, setEditingContract] = useState<TreatmentContract | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [medications, setMedications] = useState<Array<{
    name: string;
    dosage: string;
    schedule: string[];
    durationDays: number;
  }>>([{
    name: '',
    dosage: '',
    schedule: ['08:00'],
    durationDays: 30
  }]);
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: localStorage.getItem('doctorName') || 'Dr. Shifokor',
    adherenceTarget: 85,
    consequences: 'Davolash samaradorligi pasayishi, simptomlarning qaytishi va oila a\'zolariga xabar berilishi.'
  });

  // Shifokor ismi o'zgarganda formData ni yangilash
  useEffect(() => {
    const doctorName = localStorage.getItem('doctorName');
    if (doctorName) {
      setFormData(prev => ({
        ...prev,
        doctorName: doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`
      }));
    }
  }, []);

  const handleNewContract = () => {
    // Formani reset qilish
    const doctorName = localStorage.getItem('doctorName');
    setFormData({
      patientName: '',
      doctorName: doctorName ? (doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`) : 'Dr. Shifokor',
      adherenceTarget: 85,
      consequences: 'Davolash samaradorligi pasayishi, simptomlarning qaytishi va oila a\'zolariga xabar berilishi.'
    });
    setMedications([{
      name: '',
      dosage: '',
      schedule: ['08:00'],
      durationDays: 30
    }]);
    setEditingContract(null);
    setShowCreateForm(!showCreateForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingContract) {
      // Update existing contract
      const updatedContract: TreatmentContract = {
        ...editingContract,
        patientName: formData.patientName,
        doctorName: formData.doctorName,
        medications: medications.map((med, idx) => ({
          id: editingContract.medications[idx]?.id || `${editingContract.id}-med-${idx}`,
          name: med.name,
          dosage: med.dosage,
          schedule: med.schedule,
          durationDays: med.durationDays,
          startDate: editingContract.medications[idx]?.startDate || new Date().toISOString()
        })),
        adherenceTarget: formData.adherenceTarget,
        consequences: formData.consequences,
        endDate: calculateEndDate(medications)
      };
      
      await onUpdateContract(updatedContract);
      setEditingContract(null);
    } else {
      // Create new contract
      const patientId = Date.now().toString();
      const startDate = new Date();
      const endDate = calculateEndDate(medications);
      
      const contract: TreatmentContract = {
        id: patientId,
        patientName: formData.patientName,
        doctorName: formData.doctorName,
        medications: medications.map((med, idx) => ({
          id: `${patientId}-med-${idx}`,
          name: med.name,
          dosage: med.dosage,
          schedule: med.schedule,
          durationDays: med.durationDays,
          startDate: startDate.toISOString().split('T')[0]
        })),
        adherenceTarget: formData.adherenceTarget,
        consequences: formData.consequences,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate,
        signed: false,
        linkAccessCount: 0,
        linkAccessLimit: 0, // 0 = cheksiz
        linkCreatedAt: new Date().toISOString(),
        linkLastAccessedAt: undefined
      };
      
      const patientLink = generatePatientLink(patientId);
      await onCreateContract(contract);
      
      // Show link modal for new contracts only
      setGeneratedLink(patientLink);
      setShowLinkModal(true);
    }
    
    setShowCreateForm(false);
    resetForm();
  };

  const calculateEndDate = (meds: typeof medications) => {
    const maxDuration = Math.max(...meds.map(m => m.durationDays));
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + maxDuration);
    return endDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      doctorName: 'Dr. Aziz Karimov',
      adherenceTarget: 85,
      consequences: 'Davolash samaradorligi pasayishi, simptomlarning qaytishi va oila a\'zolariga xabar berilishi.'
    });
    setMedications([{
      name: '',
      dosage: '',
      schedule: ['08:00'],
      durationDays: 30
    }]);
  };

  const handleEdit = (patient: Patient) => {
    if (!patient.contract) return;
    
    setEditingContract(patient.contract);
    setFormData({
      patientName: patient.contract.patientName,
      doctorName: patient.contract.doctorName,
      adherenceTarget: patient.contract.adherenceTarget,
      consequences: patient.contract.consequences
    });
    setMedications(patient.contract.medications.map(med => ({
      name: med.name,
      dosage: med.dosage,
      schedule: med.schedule,
      durationDays: med.durationDays
    })));
    setShowCreateForm(true);
  };

  const handleDelete = (patient: Patient) => {
    setDeletingPatient(patient);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deletingPatient) {
      await onDeleteContract(deletingPatient.id);
      setShowDeleteModal(false);
      setDeletingPatient(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(generatedLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTelegram = () => {
    const message = encodeURIComponent(`Salom! Shifokoringiz sizga davolash linkini yubordi: ${generatedLink}`);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${message}`;
    window.open(telegramUrl, '_blank');
  };

  const handleShareSMS = () => {
    const message = encodeURIComponent(`Salom! Shifokoringiz sizga davolash linkini yubordi: ${generatedLink}`);
    const smsUrl = `sms:?body=${message}`;
    window.location.href = smsUrl;
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Salom! Shifokoringiz sizga davolash linkini yubordi: ${generatedLink}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Davolash linki');
    const body = encodeURIComponent(`Salom!\n\nShifokoringiz sizga davolash linkini yubordi:\n${generatedLink}\n\nShu link orqali dori qabul qilish jadvalingizni kuzatishingiz mumkin.`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
  };

  const handleRefreshLink = async (patient: Patient) => {
    if (!patient.contract) return;
    
    // Yangi unique ID yaratish
    const newPatientId = generateUniquePatientId(patient.contract.patientName);
    
    // Shartnomani yangi ID bilan yangilash
    const updatedContract: TreatmentContract = {
      ...patient.contract,
      id: newPatientId,
      linkAccessCount: 0, // Reset qilish
      linkCreatedAt: new Date().toISOString(),
      linkLastAccessedAt: undefined
    };
    
    try {
      // Eski shartnomani o'chirish
      await onDeleteContract(patient.id);
      
      // Yangi ID bilan shartnomani yaratish
      await onCreateContract(updatedContract);
      
      // Yangi link yaratish
      const newLink = generatePatientLink(newPatientId);
      
      // Yangi linkni ko'rsatish
      setGeneratedLink(newLink);
      
      // Agar modal ochiq bo'lmasa, ochish
      if (!showLinkModal) {
        setShowLinkModal(true);
      }
      
      // Copy holatini reset qilish
      setCopiedLink(false);
      
      // Ma'lumotlarni yangilash
      onRefresh();
      
      console.log(`Yangi link yaratildi: ${patient.contract.patientName} uchun`);
    } catch (error) {
      console.error('Link yangilashda xatolik:', error);
      alert('Link yangilashda xatolik yuz berdi');
    }
  };

  const addScheduleTime = (medIndex: number) => {
    const newMedications = [...medications];
    newMedications[medIndex].schedule.push('12:00');
    setMedications(newMedications);
  };

  const removeScheduleTime = (medIndex: number, timeIndex: number) => {
    const newMedications = [...medications];
    newMedications[medIndex].schedule = newMedications[medIndex].schedule.filter((_, i) => i !== timeIndex);
    setMedications(newMedications);
  };

  const updateScheduleTime = (medIndex: number, timeIndex: number, value: string) => {
    const newMedications = [...medications];
    newMedications[medIndex].schedule[timeIndex] = value;
    setMedications(newMedications);
  };

  const addMedication = () => {
    setMedications([...medications, {
      name: '',
      dosage: '',
      schedule: ['08:00'],
      durationDays: 30
    }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: string, value: any) => {
    const newMedications = [...medications];
    (newMedications[index] as any)[field] = value;
    setMedications(newMedications);
  };

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shifokor Paneli</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <span className="text-sm text-gray-600 text-center sm:text-left">
              Dr. {localStorage.getItem('doctorName') || 'Shifokor'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onRefresh}
                className="flex-1 sm:flex-none px-3 py-2 text-sm text-primary hover:underline flex items-center justify-center gap-2 border border-primary rounded-lg sm:border-none sm:rounded-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="sm:inline">Yangilash</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex-1 sm:flex-none btn-mobile-sm bg-red-500 text-white hover:bg-red-600"
                >
                  Chiqish
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="card-mobile sm:bg-white sm:rounded-lg sm:shadow-md sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Bemorlar Ro'yxati</h2>
              <button
                onClick={handleNewContract}
                className="btn-mobile bg-primary text-white hover:bg-blue-600 w-full sm:w-auto"
              >
                {showCreateForm ? 'Yopish' : '+ Yangi Shartnoma'}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleSubmit} className="mb-6 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                  <h3 className="font-semibold text-gray-900 text-center sm:text-left">
                    {editingContract ? 'Shartnomani Tahrirlash' : 'Yangi Davolash Shartnomasi'}
                  </h3>
                  {editingContract && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingContract(null);
                        setShowCreateForm(false);
                        resetForm();
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 self-center sm:self-auto"
                    >
                      Bekor qilish
                    </button>
                  )}
                </div>
                
                <div className="space-y-4 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bemor Ismi
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        className="input-mobile"
                        placeholder="Masalan: Sardor Aliyev"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shifokor Ismi
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.doctorName}
                        onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                        className="input-mobile"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Dorilar
                      </label>
                      <button
                        type="button"
                        onClick={addMedication}
                        className="btn-mobile-sm text-primary border border-primary hover:bg-primary hover:text-white w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Dori Qo'shish
                      </button>
                    </div>

                    {medications.map((med, medIndex) => (
                      <div key={medIndex} className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium text-gray-900">Dori #{medIndex + 1}</h4>
                          {medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedication(medIndex)}
                              className="text-sm text-danger hover:underline"
                            >
                              O'chirish
                            </button>
                          )}
                        </div>

                        <div className="grid gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Dori Nomi</label>
                              <input
                                type="text"
                                required
                                value={med.name}
                                onChange={(e) => updateMedication(medIndex, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                placeholder="Masalan: Sertralin"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Dozasi</label>
                              <input
                                type="text"
                                required
                                value={med.dosage}
                                onChange={(e) => updateMedication(medIndex, 'dosage', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                placeholder="Masalan: 50mg"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Necha Kun Ichishi Kerak</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={med.durationDays}
                              onChange={(e) => updateMedication(medIndex, 'durationDays', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Masalan: 30"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Qabul Jadvali</label>
                            <div className="space-y-2">
                              {med.schedule.map((time, timeIndex) => (
                                <div key={timeIndex} className="flex gap-2">
                                  <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => updateScheduleTime(medIndex, timeIndex, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                  {med.schedule.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeScheduleTime(medIndex, timeIndex)}
                                      className="px-3 py-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded-lg transition-smooth text-sm"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addScheduleTime(medIndex)}
                                className="text-xs text-primary hover:underline"
                              >
                                + Vaqt Qo'shish
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maqsad Ko'rsatkich (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formData.adherenceTarget}
                        onChange={(e) => setFormData({ ...formData, adherenceTarget: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bajarilmasa Oqibatlari
                    </label>
                    <textarea
                      required
                      value={formData.consequences}
                      onChange={(e) => setFormData({ ...formData, consequences: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-smooth"
                  >
                    {editingContract ? 'Saqlash' : 'Shartnoma Yaratish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-smooth"
                  >
                    Bekor Qilish
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {patients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Hozircha bemorlar yo'q</p>
              ) : (
                patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="card-mobile hover:border-primary transition-smooth"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedPatient(selectedPatient?.id === patient.id ? null : patient)}
                      >
                        <h3 className="font-semibold text-gray-900 text-lg">{patient.name}</h3>
                        {patient.contract && patient.contract.medications && (
                          <p className="text-sm text-gray-600 mt-1">
                            {patient.contract.medications.length} ta dori
                          </p>
                        )}
                      </div>
                      
                      {/* Mobile: Stats and Actions in separate rows */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        {/* Stats */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-center sm:text-right">
                            <p className="text-2xl font-bold text-gray-900">{patient.adherenceRate.toFixed(0)}%</p>
                            <p className={`text-xs font-medium ${
                              patient.riskLevel === 'green' ? 'text-success' :
                              patient.riskLevel === 'yellow' ? 'text-warning' : 'text-danger'
                            }`}>
                              {patient.riskLevel === 'green' ? 'Yaxshi' :
                               patient.riskLevel === 'yellow' ? 'Xavf Ostida' : 'Jiddiy'}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full ${
                            patient.riskLevel === 'green' ? 'bg-success' :
                            patient.riskLevel === 'yellow' ? 'bg-warning' : 'bg-danger'
                          }`} />
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = generatePatientLink(patient.id);
                              setGeneratedLink(link);
                              setShowLinkModal(true);
                            }}
                            className="p-3 text-primary hover:bg-primary hover:bg-opacity-10 rounded-lg transition-smooth"
                            title="Link Ko'rish"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefreshLink(patient);
                            }}
                            className="p-3 text-green-600 hover:bg-green-50 rounded-lg transition-smooth"
                            title="Linkni Yangilash"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(patient);
                          }}
                          className="p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded-lg transition-smooth"
                          title="Tahrirlash"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(patient);
                          }}
                          className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded-lg transition-smooth"
                          title="O'chirish"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{patient.adherenceRate.toFixed(0)}%</p>
                          <p className={`text-xs font-medium ${
                            patient.riskLevel === 'green' ? 'text-success' :
                            patient.riskLevel === 'yellow' ? 'text-warning' : 'text-danger'
                          }`}>
                            {patient.riskLevel === 'green' ? 'Yaxshi' :
                             patient.riskLevel === 'yellow' ? 'Xavf Ostida' : 'Jiddiy'}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          patient.riskLevel === 'green' ? 'bg-success' :
                          patient.riskLevel === 'yellow' ? 'bg-warning' : 'bg-danger'
                        }`} />
                      </div>
                    </div>

                    {selectedPatient?.id === patient.id && patient.contract && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        {patient.contract.medications && patient.contract.medications.map((med, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900">{med.name} {med.dosage}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {med.durationDays} kun, {med.schedule.join(', ')}
                            </p>
                          </div>
                        ))}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Davolanish Muddati:</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(patient.contract.startDate).toLocaleDateString('uz-UZ')} - {new Date(patient.contract.endDate).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Holat:</p>
                          <p className="text-sm text-gray-700">
                            {patient.contract.signed ? '✓ Imzolangan' : '⏳ Imzo kutilmoqda'}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">Link Statistikasi:</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">
                              📊 Foydalanish: <span className="font-semibold">{patient.contract.linkAccessCount || 0}</span> marta
                              {patient.contract.linkAccessLimit && patient.contract.linkAccessLimit > 0 && (
                                <span className="text-gray-500"> / {patient.contract.linkAccessLimit} ta</span>
                              )}
                            </p>
                            {patient.contract.linkCreatedAt && (
                              <p className="text-xs text-gray-600">
                                🕐 Yaratilgan: {new Date(patient.contract.linkCreatedAt).toLocaleString('uz-UZ')}
                              </p>
                            )}
                            {patient.contract.linkLastAccessedAt && (
                              <p className="text-xs text-gray-600">
                                🔗 Oxirgi kirish: {new Date(patient.contract.linkLastAccessedAt).toLocaleString('uz-UZ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Link Modal - Mobile Responsive */}
      {showLinkModal && (
        <div className="modal-mobile">
          <div className="modal-content-mobile p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bemor Uchun Link</h3>
              <button 
                onClick={() => {
                  setShowLinkModal(false);
                  setCopiedLink(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">
                    Ushbu linkni bemorga yuboring:
                  </p>
                  <button
                    onClick={() => {
                      const currentPatient = patients.find(p => generatePatientLink(p.id) === generatedLink);
                      if (currentPatient) {
                        handleRefreshLink(currentPatient);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-smooth"
                    title="Yangi Link Yaratish"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Yangi Link
                  </button>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 break-all text-sm text-gray-900 font-mono mb-3">
                {generatedLink}
              </div>
              
              {/* Link statistikasi */}
              {(() => {
                const currentPatient = patients.find(p => generatePatientLink(p.id) === generatedLink);
                if (currentPatient?.contract) {
                  return (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">📊 Link Statistikasi:</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>
                          Foydalanish: <span className="font-semibold text-gray-900">{currentPatient.contract.linkAccessCount || 0}</span> marta
                          {currentPatient.contract.linkAccessLimit && currentPatient.contract.linkAccessLimit > 0 && (
                            <span> / {currentPatient.contract.linkAccessLimit} ta</span>
                          )}
                        </p>
                        {currentPatient.contract.linkCreatedAt && (
                          <p>Yaratilgan: {new Date(currentPatient.contract.linkCreatedAt).toLocaleString('uz-UZ', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        )}
                        {currentPatient.contract.linkLastAccessedAt && (
                          <p>Oxirgi kirish: {new Date(currentPatient.contract.linkLastAccessedAt).toLocaleString('uz-UZ', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex flex-col gap-3">
              {/* Copy button */}
              <button
                onClick={handleCopyLink}
                className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-smooth flex items-center justify-center gap-2"
              >
                {copiedLink ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Nusxalandi!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Linkni Nusxalash
                  </>
                )}
              </button>

              {/* Share buttons grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShareTelegram}
                  className="py-2 px-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-smooth flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 6.728-.896 6.728-.302 1.507-1.114 1.757-1.114 1.757s-.896.302-1.757-.896l-2.411-2.411-1.205 1.205c-.302.302-.604.302-.906 0l.302-2.713 5.418-5.418c.302-.302 0-.604-.604-.302l-6.728 4.214-2.411-.896s-.604-.302-.604-.906c0-.604.604-.906.604-.906l9.742-3.618s.906-.302.906.604z"/>
                  </svg>
                  Telegram
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="py-2 px-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-smooth flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp
                </button>

                <button
                  onClick={handleShareSMS}
                  className="py-2 px-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-smooth flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  SMS
                </button>

                <button
                  onClick={handleShareEmail}
                  className="py-2 px-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-smooth flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setCopiedLink(false);
                }}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-smooth"
              >
                Yopish
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 <span className="font-medium">Maslahat:</span> Yuqoridagi tugmalar orqali linkni to'g'ridan-to'g'ri bemorga yuboring.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-danger bg-opacity-10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Shartnomani O'chirish</h3>
                <p className="text-sm text-gray-600">Bu amalni bekor qilib bo'lmaydi</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                <span className="font-semibold">{deletingPatient.name}</span> ning shartnomasi va barcha ma'lumotlari o'chiriladi. 
                Davom etishni xohlaysizmi?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingPatient(null);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-smooth"
              >
                Bekor Qilish
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-smooth"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
