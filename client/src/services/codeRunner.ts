export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number; // in milliseconds
  memory?: string;
  engine?: string;
}

const BACKEND_URL = 'http://localhost:4000';

/**
 * Executes code according to its language nature:
 * - JavaScript / TypeScript: Runs in sandboxed client environment with console interception
 * - Python, C++, Java, Rust, Go, SQL, etc.: Sent to Node.js backend execution service
 */
export async function runCode(code: string, language: string): Promise<ExecutionResult> {
  const normLang = language.toLowerCase().trim();

  // In-Browser Sandboxed Execution for JavaScript and TypeScript
  if (normLang === 'javascript' || normLang === 'typescript') {
    return runJavaScriptInBrowser(code, normLang);
  }

  // Backend Execution for Python, C++, Java, Rust, Go, etc.
  return runOnBackend(code, normLang);
}

function runJavaScriptInBrowser(code: string, language: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const logs: string[] = [];
    const errors: string[] = [];

    // Strip basic TypeScript type notations if running TS in browser
    let executableCode = code;
    if (language === 'typescript') {
      executableCode = code
        .replace(/:\s*(number|string|boolean|any|void|unknown|never|Record<[^>]+>|Array<[^>]+>|[A-Z][a-zA-Z0-9<>]*)/g, '')
        .replace(/\bas\s+[a-zA-Z0-9<>]+/g, '');
    }

    // Create a sandboxed iframe to capture output safely without polluting the main window
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.add('allow-same-origin', 'allow-scripts');
    document.body.appendChild(iframe);

    let isFinished = false;
    const cleanup = () => {
      if (!isFinished) {
        isFinished = true;
        try {
          document.body.removeChild(iframe);
        } catch {}
      }
    };

    // Timeout guard (3 seconds)
    const timer = setTimeout(() => {
      cleanup();
      resolve({
        stdout: logs.join('\n'),
        stderr: 'Execution timed out (infinite loop protection: >3000ms)',
        exitCode: 124,
        executionTime: Math.round(performance.now() - startTime),
        memory: 'V8 Sandbox',
        engine: 'browser-sandbox',
      });
    }, 3000);

    const iWindow = iframe.contentWindow;
    if (!iWindow) {
      cleanup();
      clearTimeout(timer);
      resolve(runOnBackend(code, language));
      return;
    }

    // Intercept console
    const formatArg = (arg: any): string => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    };

    (iWindow as any).console = {
      log: (...args: any[]) => logs.push(args.map(formatArg).join(' ')),
      info: (...args: any[]) => logs.push(args.map(formatArg).join(' ')),
      warn: (...args: any[]) => logs.push('[WARN] ' + args.map(formatArg).join(' ')),
      error: (...args: any[]) => errors.push(args.map(formatArg).join(' ')),
    };

    try {
      const result = (iWindow as any).eval(executableCode);
      clearTimeout(timer);
      cleanup();

      const executionTime = Math.round(performance.now() - startTime);
      let stdout = logs.join('\n');
      if (!stdout && result !== undefined) {
        stdout = formatArg(result);
      }

      resolve({
        stdout,
        stderr: errors.join('\n'),
        exitCode: errors.length > 0 ? 1 : 0,
        executionTime,
        memory: 'V8 Sandbox',
        engine: 'in-browser',
      });
    } catch (err: any) {
      clearTimeout(timer);
      cleanup();
      const executionTime = Math.round(performance.now() - startTime);

      resolve({
        stdout: logs.join('\n'),
        stderr: err.message || String(err),
        exitCode: 1,
        executionTime,
        memory: 'V8 Sandbox',
        engine: 'in-browser',
      });
    }
  });
}

async function runOnBackend(code: string, language: string): Promise<ExecutionResult> {
  const startTime = performance.now();
  try {
    const res = await fetch(`${BACKEND_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        stdout: '',
        stderr: errData.error || `HTTP ${res.status} Execution Error`,
        exitCode: 1,
        executionTime: Math.round(performance.now() - startTime),
        memory: 'N/A',
        engine: 'backend',
      };
    }

    const data: ExecutionResult = await res.json();
    return data;
  } catch (err: any) {
    return {
      stdout: '',
      stderr: `Network Error: Unable to connect to backend execution service (${err.message})`,
      exitCode: 1,
      executionTime: Math.round(performance.now() - startTime),
      memory: 'N/A',
      engine: 'backend',
    };
  }
}
