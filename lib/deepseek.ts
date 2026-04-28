import axios from 'axios';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

function formatPatientData(patientData: any): string {
  if (!patientData) return '';
  
  let info = '\n\nBEMOR MA\'LUMOTLARI:\n';
  
  // Faqat muhim ma'lumotlar
  if (patientData.adherenceRate !== undefined) {
    info += `Rioya ko'rsatkichi: ${patientData.adherenceRate.toFixed(0)}%\n`;
  }
  
  // O'tkazilgan dozalar
  if (patientData.missedCount > 0) {
    info += `O'tkazilgan dozalar: ${patientData.missedCount} marta\n`;
  }
  
  // Faol dorilar va qolgan kunlar
  if (patientData.medications && patientData.medications.length > 0) {
    info += '\nFaol dorilar:\n';
    patientData.medications.forEach((med: any, idx: number) => {
      const daysPassed = Math.floor((Date.now() - new Date(med.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, med.durationDays - daysPassed);
      if (daysLeft > 0) {
        info += `${idx + 1}. ${med.name} ${med.dosage} - ${daysLeft} kun qoldi\n`;
      }
    });
  }
  
  return info;
}

export async function getAIIntervention(
  missedCount: number,
  patientContext: string,
  patientData?: any
): Promise<string> {
  const dataInfo = formatPatientData(patientData);
  
  const systemPrompt = `Siz bemorning shaxsiy sog'liq yordamchisisiz. Ibn Sino AI jamosi tomonidan yaratilgansiz.

MUHIM QOIDALAR:
- Faqat o'tkazilgan dorilar haqida gaplashing
- Oxirgi qabul vaqtini AYTMANG
- Faqat oqibatlar va ogohlantirishlar bering
- 40-60 so'zda qisqa javob
- To'liq fikr yakunlang
- Samimiy va aniq bo'ling
- O'zbekcha yozing

FORMAT:
1. O'tkazilgan dozalar soni
2. Bu qanday oqibatlarga olib kelishi
3. Hozir nima qilish kerak`;
  
  const userPrompt = `Bemor ${missedCount} marta dorini o'tkazdi. ${patientContext}${dataInfo}

Faqat o'tkazilgan dorilar va oqibatlari haqida qisqa javob bering. Oxirgi qabul vaqtini aytmang!`;

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 120
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    return `Salom! ${missedCount} marta dorini o'tkazdingiz. Bu davolanish samaradorligini pasaytiradi.

Iltimos, hoziroq qabul qiling va kelajakda muntazam iching. Sog'ligingiz uchun juda muhim!`;
  }
}

export async function getAIResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  patientContext?: string,
  patientData?: any
): Promise<string> {
  const dataInfo = formatPatientData(patientData);
  
  const systemPrompt = `Siz bemorning shaxsiy sog'liq yordamchisisiz. Ibn Sino AI jamosi tomonidan yaratilgansiz.

MUHIM QOIDALAR:
- Qisqa va aniq javob bering (40-60 so'z)
- To'liq fikr yakunlang
- Agar "qanchalik ichdim" desa, faqat rioya foizini ayting
- Agar "necha kun qoldi" desa, qisqacha ayting
- Oxirgi qabul vaqtlarini AYTMANG
- Samimiy va foydali bo'ling
- O'zbekcha yozing

MUHIM: Agar bemor belgilarini aytsa, umumiy maslahat bering va shifokorga yo'naltiring.`;

  const fullContext = `${patientContext}${dataInfo}\n\nBemor: ${userMessage}`;

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: fullContext }
        ],
        temperature: 0.8,
        max_tokens: 120
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    return `Tushundim. Sizga yordam beraman.

Iltimos, batafsil aytib bering, shunda yaxshiroq maslahat bera olaman.`;
  }
}
