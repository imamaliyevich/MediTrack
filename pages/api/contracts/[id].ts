import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONTRACTS_FILE = path.join(DATA_DIR, 'contracts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize contracts file if it doesn't exist
if (!fs.existsSync(CONTRACTS_FILE)) {
  fs.writeFileSync(CONTRACTS_FILE, JSON.stringify({ contracts: [] }));
}

function readContracts() {
  const data = fs.readFileSync(CONTRACTS_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeContracts(data: any) {
  fs.writeFileSync(CONTRACTS_FILE, JSON.stringify(data, null, 2));
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const data = readContracts();
      const contract = data.contracts.find((c: any) => c.id === id);
      
      if (!contract) {
        return res.status(404).json({ error: 'Shartnoma topilmadi' });
      }
      
      res.status(200).json(contract);
    } catch (error) {
      console.error('Error reading contract:', error);
      res.status(500).json({ error: 'Server xatosi' });
    }
  } else if (req.method === 'PUT') {
    try {
      const data = readContracts();
      const index = data.contracts.findIndex((c: any) => c.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Shartnoma topilmadi' });
      }
      
      data.contracts[index] = { ...data.contracts[index], ...req.body };
      writeContracts(data);
      
      res.status(200).json(data.contracts[index]);
    } catch (error) {
      console.error('Error updating contract:', error);
      res.status(500).json({ error: 'Server xatosi' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const data = readContracts();
      const index = data.contracts.findIndex((c: any) => c.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Shartnoma topilmadi' });
      }
      
      // Remove contract
      const deletedContract = data.contracts[index];
      data.contracts.splice(index, 1);
      writeContracts(data);
      
      // Also delete associated logs
      const LOGS_FILE = path.join(process.cwd(), 'data', 'logs.json');
      if (fs.existsSync(LOGS_FILE)) {
        const logsData = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
        delete logsData.logs[id as string];
        fs.writeFileSync(LOGS_FILE, JSON.stringify(logsData, null, 2));
      }
      
      res.status(200).json({ message: 'Shartnoma o\'chirildi', contract: deletedContract });
    } catch (error) {
      console.error('Error deleting contract:', error);
      res.status(500).json({ error: 'Server xatosi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
