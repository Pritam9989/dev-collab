import { Request, Response } from 'express';
import { executeCode } from '../services/executionService.js';

export async function executeHandler(req: Request, res: Response) {
  try {
    const { code, language, stdin } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code string is required' });
    }

    if (!language || typeof language !== 'string') {
      return res.status(400).json({ error: 'Language string is required' });
    }

    const result = await executeCode(code, language, stdin);
    return res.json(result);
  } catch (err: any) {
    console.error('[Execution Service Error]:', err);
    return res.status(500).json({
      stdout: '',
      stderr: err.message || 'Internal Execution Error',
      exitCode: 1,
      executionTime: 0,
      memory: '0 MB',
      engine: 'mock',
    });
  }
}
