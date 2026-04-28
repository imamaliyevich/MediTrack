import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize logs file if it doesn't exist
if (!fs.existsSync(LOGS_FILE)) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify({ logs: {} }));
}

function readLogs() {
  const data = fs.readFileSync(LOGS_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeLogs(data: any) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify(data, null, 2));
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { contractId } = req.query;

  if (req.method === 'GET') {
    try {
      const data = readLogs();
      const logs = data.logs[contractId as string] || [];
      res.status(200).json(logs);
    } catch (error) {
      console.error('Error reading logs:', error);
      res.status(500).json({ error: 'Server xatosi' });
    }
  } else if (req.method === 'POST') {
    try {
      const data = readLogs();
      if (!data.logs[contractId as string]) {
        data.logs[contractId as string] = [];
      }
      
      const newLog = req.body;
      data.logs[contractId as string].push(newLog);
      writeLogs(data);
      
      res.status(201).json(newLog);
    } catch (error) {
      console.error('Error creating log:', error);
      res.status(500).json({ error: 'Server xatosi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
