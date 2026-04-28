import { useState } from 'react';

interface MedicationProofProps {
  onConfirm: (withPhoto: boolean) => void;
  medicationName: string;
}

export default function MedicationProof({ onConfirm, medicationName }: MedicationProofProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async (withPhoto: boolean) => {
    setConfirming(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onConfirm(withPhoto);
    setConfirming(false);
    setShowCamera(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Dori Qabul Qilishni Tasdiqlash
      </h3>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Dori:</p>
        <p className="text-xl font-semibold text-gray-900">{medicationName}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleConfirm(false)}
          disabled={confirming}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-smooth disabled:opacity-50"
        >
          {confirming ? 'Tasdiqlanmoqda...' : 'Dorini Qabul Qildim'}
        </button>

        <button
          onClick={() => setShowCamera(!showCamera)}
          className="w-full py-3 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:bg-opacity-5 transition-smooth"
        >
          {showCamera ? 'Bekor Qilish' : 'Rasm Qo\'shish'}
        </button>
      </div>

      {showCamera && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <button
            onClick={() => handleConfirm(true)}
            disabled={confirming}
            className="w-full py-2 bg-success text-white rounded-lg font-medium hover:bg-green-600 transition-smooth disabled:opacity-50 text-sm"
          >
            {confirming ? 'Tasdiqlanmoqda...' : 'Rasm Bilan Tasdiqlash'}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center">
        Yolg'on tasdiqlash ogohlantirish tizimini ishga tushirishi mumkin
      </p>
    </div>
  );
}
