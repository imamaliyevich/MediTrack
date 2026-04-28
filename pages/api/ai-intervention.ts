import type { NextApiRequest, NextApiResponse } from 'next';
import { getAIIntervention, getAIResponse } from '@/lib/deepseek';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, missedCount, patientContext, userMessage, conversationHistory, patientData } = req.body;

  try {
    let response: string;
    
    if (type === 'initial') {
      response = await getAIIntervention(missedCount, patientContext, patientData);
    } else {
      response = await getAIResponse(userMessage, conversationHistory || [], patientContext, patientData);
    }
    
    res.status(200).json({ message: response });
  } catch (error) {
    console.error('AI intervention error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
}
