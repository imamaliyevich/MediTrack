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
  if (req.method === 'GET') {
    try {
      const data = readContracts();
      res.status(200).json(data.contracts);
    } catch (error) {
      console.error('Error reading contracts:', error);
      res.status(500).json({ error: 'Server xatosi' });
    }
  } else if (req.method === 'POST') {
    try {
      const data = readContracts();
      const newContract = req.body;
      data.contracts.push(newContract);
      writeContracts(data);
      
      res.status(201).json(newContract);
    } catch (error) {
      console.error('Error creating contract:', error);
      res.status(500).json({ error: 'Server xatosi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
