import { useState, useEffect, useRef } from 'react';
import { Medication, MedicationLog } from '@/types';

interface MedicationScheduleProps {
  medication: Medication;
  logs: MedicationLog[];
  onConfirm: (scheduledTime: string, withPhoto: boolean) => void;
}

export default function MedicationSchedule({ medication, logs, onConfirm }: MedicationScheduleProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [isAlarmStopped, setIsAlarmStopped] = useState(false); // Qo'lda to'xtatilganini belgilash
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [takenTimes, setTakenTimes] = useState<Set<string>>(new Set()); // Lokal qabul qilingan vaqtlar
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const today = new Date().toDateString();
  
  // Bugungi kungi loglarni olish
  const todayLogs = logs.filter(log => 
    log.medicationId === medication.id && 
    new Date(log.timestamp).toDateString() === today
  );

  // Tovush chiqarish funksiyasi
  const playAlarmSound = async () => {
    try {
      // 1-usul: Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Agar context suspended bo'lsa, resume qilamiz
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Alarm tovushi uchun yuqori chastota
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.type = 'square'; // Keskin tovush uchun
      
      // Tovush balandligini sozlaymiz
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // 2-usul: HTML5 Audio (backup)
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Agar audio ham ishlamasa, vibration ishlatamiz
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      });
      
    } catch (error) {
      console.log('Audio ishlamadi:', error);
      
      // 3-usul: Vibration (mobil qurilmalar uchun)
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
      
      // 4-usul: Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Dori qabul qilish vaqti!', {
          body: `${medication.name} qabul qilish vaqti keldi`,
          icon: '💊',
          tag: 'medication-reminder'
        });
      }
    }
  };

  // Tovushni to'xtatish
  const stopAlarm = () => {
    setIsAlarmPlaying(false);
    setIsAlarmStopped(true); // Qo'lda to'xtatilganini belgilaymiz
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Vaqtni tekshirish va tovush chiqarish
  useEffect(() => {
    // Notification ruxsatini so'raymiz
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkMedicationTime = () => {
      const currentTime = getCurrentTime();
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      let shouldPlayAlarm = false;
      
      // Har bir jadval vaqtini tekshiramiz
      medication.schedule.forEach(scheduledTime => {
        const isTaken = isTimeTaken(scheduledTime);
        
        // Vaqt farqini hisoblaymiz (kun ohiri logikasi bilan)
        const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
        
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;
        
        // Oddiy holat va kun ohiri holatlarini tekshirish
        const normalDiff = Math.abs(currentTotalMinutes - scheduledTotalMinutes);
        const crossMidnightDiff1 = Math.abs((currentTotalMinutes + 24 * 60) - scheduledTotalMinutes);
        const crossMidnightDiff2 = Math.abs(currentTotalMinutes - (scheduledTotalMinutes + 24 * 60));
        const timeDiff = Math.min(normalDiff, crossMidnightDiff1, crossMidnightDiff2);
        
        // 5 daqiqa oldin va 5 daqiqa keyin tovush chiqarish
        if (timeDiff <= 5 && !isTaken && !isAlarmStopped) {
          shouldPlayAlarm = true;
        }
      });
      
      // Agar tovush chiqarish kerak bo'lsa va hali chiqmayotgan bo'lsa
      if (shouldPlayAlarm && !isAlarmPlaying) {
        setIsAlarmPlaying(true);
        
        // Darhol birinchi tovushni chiqaramiz
        playAlarmSound();
        
        // Har 3 soniyada tovush chiqaramiz
        intervalRef.current = setInterval(() => {
          playAlarmSound();
        }, 3000);
      }
      
      // Agar tovush to'xtatish kerak bo'lsa (vaqt o'tgan yoki dori qabul qilingan)
      if (!shouldPlayAlarm && isAlarmPlaying) {
        setIsAlarmPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      
      // Agar vaqt oralig'idan chiqib ketgan bo'lsa, qo'lda to'xtatish holatini reset qilamiz
      const anyTimeInRange = medication.schedule.some(scheduledTime => {
        const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
        const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;
        
        // Kun ohiri logikasi bilan tekshirish
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const normalDiff = Math.abs(currentTotalMinutes - scheduledTotalMinutes);
        const crossMidnightDiff1 = Math.abs((currentTotalMinutes + 24 * 60) - scheduledTotalMinutes);
        const crossMidnightDiff2 = Math.abs(currentTotalMinutes - (scheduledTotalMinutes + 24 * 60));
        const timeDiff = Math.min(normalDiff, crossMidnightDiff1, crossMidnightDiff2);
        
        return timeDiff <= 5;
      });
      
      if (!anyTimeInRange) {
        setIsAlarmStopped(false); // Keyingi dori uchun reset qilamiz
      }
    };

    // Har 30 soniyada tekshiramiz (tez-tez tekshirish uchun)
    const timeCheckInterval = setInterval(checkMedicationTime, 30000);
    
    // Komponent yuklanganda ham tekshiramiz
    checkMedicationTime();

    return () => {
      clearInterval(timeCheckInterval);
    };
  }, [medication.schedule, logs, isAlarmPlaying, isAlarmStopped]);

  // Komponent o'chirilganda barcha intervallarni tozalaymiz
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const isTimeTaken = (scheduledTime: string) => {
    // Avval lokal state'dan tekshiramiz, keyin logs'dan
    if (takenTimes.has(scheduledTime)) {
      return true;
    }
    return todayLogs.some(log => log.scheduledTime === scheduledTime && !log.missed);
  };

  const handleConfirm = (scheduledTime: string, withPhoto: boolean) => {
    // Darhol lokal state'ni yangilaymiz
    setTakenTimes(prev => new Set([...prev, scheduledTime]));
    
    stopAlarm();
    setIsAlarmStopped(true); // Dori qabul qilinganda ham to'xtatilganini belgilaymiz
    onConfirm(scheduledTime, withPhoto);
    setShowCamera(false);
    // Rasm ma'lumotlarini tozalaymiz
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Rasm tanlash funksiyasi
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Rasm preview yaratish
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Rasm yuklash tugmasini bosish
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const isTimeClose = (scheduledTime: string) => {
    const currentTime = getCurrentTime();
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
    
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;
    
    // Oddiy holat: bir xil kun ichida
    const normalDiff = Math.abs(currentTotalMinutes - scheduledTotalMinutes);
    
    // Kun ohiri va kun boshidagi holatlar uchun
    // Masalan: 23:58 va 00:28 orasidagi farq
    const crossMidnightDiff1 = Math.abs((currentTotalMinutes + 24 * 60) - scheduledTotalMinutes);
    const crossMidnightDiff2 = Math.abs(currentTotalMinutes - (scheduledTotalMinutes + 24 * 60));
    
    // Eng kichik farqni tanlaymiz
    const minDiff = Math.min(normalDiff, crossMidnightDiff1, crossMidnightDiff2);
    
    // 30 daqiqa oldin yoki keyinroq qabul qilish mumkin
    return minDiff <= 30;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {isAlarmPlaying && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <div className="animate-pulse">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.343 4.343l1.414 1.414m0 0l7.071 7.071m0 0l7.071-7.071m0 0l1.414-1.414M4 12h.01M12 4v.01M20 12h.01M12 20v.01M8 12a4 4 0 108 0 4 4 0 00-8 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-red-800 font-medium">🔔 Dori qabul qilish vaqti!</p>
            <p className="text-red-600 text-sm">Dorini qabul qiling va tovushni to'xtating</p>
          </div>
          <button
            onClick={stopAlarm}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-smooth"
          >
            To'xtatish
          </button>
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {medication.name} {medication.dosage}
        </h3>
        <p className="text-sm text-gray-600">
          {medication.durationDays} kun davomida
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Bugungi Jadval:</h4>
        
        {medication.schedule.map((scheduledTime, index) => {
          const isTaken = isTimeTaken(scheduledTime);
          const canTake = isTimeClose(scheduledTime) && !isTaken;
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isTaken ? 'bg-success' : canTake ? 'bg-warning' : 'bg-gray-300'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{scheduledTime}</p>
                  <p className="text-xs text-gray-500">
                    {isTaken ? 'Qabul qilindi' : canTake ? 'Qabul qilish vaqti' : 'Kutish'}
                  </p>
                </div>
              </div>

              {!isTaken && canTake && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(scheduledTime, false)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-smooth"
                  >
                    Qabul Qildim
                  </button>
                  <button
                    onClick={() => {
                      setShowCamera(!showCamera);
                    }}
                    className="px-3 py-2 border-2 border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary hover:bg-opacity-5 transition-smooth"
                  >
                    📷
                  </button>
                </div>
              )}

              {isTaken && (
                <div className="flex items-center gap-2 text-success">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Bajarildi</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showCamera && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          {/* Yashirin file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {!imagePreview ? (
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-3">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-500 text-sm">Rasm tanlash uchun bosing</p>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Tanlangan rasm" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleImageUpload}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-smooth text-sm"
            >
              📷 Rasm Tanlash
            </button>
            
            {selectedImage && (
              <button
                onClick={() => {
                  const scheduledTime = medication.schedule.find(time => isTimeClose(time) && !isTimeTaken(time));
                  if (scheduledTime) handleConfirm(scheduledTime, true);
                }}
                className="flex-1 py-2 bg-success text-white rounded-lg font-medium hover:bg-green-600 transition-smooth text-sm"
              >
                ✅ Tasdiqlash
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <span className="font-medium">Eslatma:</span> Dori belgilangan vaqtdan 30 daqiqa oldin yoki keyin qabul qilish mumkin.
        </p>
      </div>
    </div>
  );
}