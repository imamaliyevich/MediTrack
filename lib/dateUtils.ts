// Sana hisoblash uchun yordamchi funksiyalar

export function calculateDaysPassed(startDate: string): number {
  const today = new Date();
  const start = new Date(startDate);
  
  // Vaqt farqini hisoblaymiz (bugungi kun ham kiritiladi)
  const timeDiff = today.getTime() - start.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // Kamida 1 kun bo'lishi kerak (bugungi kun)
  return Math.max(1, daysDiff + 1);
}

export function calculateExpectedDoses(medications: any[], daysPassed: number): number {
  let totalExpected = 0;
  
  medications.forEach(med => {
    const medDaysPassed = Math.min(daysPassed, med.durationDays);
    totalExpected += medDaysPassed * med.schedule.length;
  });
  
  return totalExpected;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

export function getTodayScheduledDoses(medications: any[]): number {
  const today = new Date();
  let todayDoses = 0;
  
  medications.forEach(med => {
    const startDate = new Date(med.startDate);
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Agar bu dori bugun qabul qilinishi kerak bo'lsa
    if (daysPassed >= 0 && daysPassed < med.durationDays) {
      todayDoses += med.schedule.length;
    }
  });
  
  return todayDoses;
}