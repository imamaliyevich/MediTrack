import { TreatmentContract } from '@/types';

interface ContractViewProps {
  contract: TreatmentContract;
  onSign: () => void;
}

export default function ContractView({ contract, onSign }: ContractViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Davolash Shartnomasi
        </h1>

        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bemor</p>
              <p className="font-semibold text-gray-900">{contract.patientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Shifokor</p>
              <p className="font-semibold text-gray-900">{contract.doctorName}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Dorilar</p>
            <div className="space-y-3">
              {contract.medications.map((med, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.dosage}</p>
                    </div>
                    <span className="px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-sm font-medium">
                      {med.durationDays} kun
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {med.schedule.map((time, timeIdx) => (
                      <span key={timeIdx} className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded text-sm">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Davolanish Muddati</p>
            <p className="text-sm text-gray-700">
              {new Date(contract.startDate).toLocaleDateString('uz-UZ')} - {new Date(contract.endDate).toLocaleDateString('uz-UZ')}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Maqsad Ko'rsatkich</p>
            <p className="text-2xl font-bold text-primary">{contract.adherenceTarget}%</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Bajarilmasa Oqibatlari</p>
            <p className="text-sm text-gray-700 leading-relaxed">{contract.consequences}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            Men, <span className="font-semibold">{contract.patientName}</span>, ushbu davolash rejasiga rioya qilishga roziman. 
            Sog'ligim doimiy rioya qilishga bog'liqligini tushunaman. Agar kelishilgan ko'rsatkichni saqlay olmasam, 
            oilam a'zolariga xabar berilishiga ruxsat beraman.
          </p>
        </div>

        {!contract.signed && (
          <button
            onClick={onSign}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-smooth shadow-md"
          >
            Shartnomaga Roziman
          </button>
        )}

        {contract.signed && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-success">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Shartnoma Imzolandi</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Imzolangan sana: {new Date(contract.startDate).toLocaleDateString('uz-UZ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
