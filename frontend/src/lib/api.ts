const API_BASE = 'http://localhost:5000/api';

export async function fetchFiles(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/files`);
  const data = await res.json();
  return data.files;
}

export async function sendAgentMessage(
  message: string,
  currentCode: Record<string, string>
): Promise<string> {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, current_code: currentCode }),
  });
  const data = await res.json();
  return data.message;
}

export async function logEvent(type: string, data: any = {}) {
  await fetch(`${API_BASE}/events/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  });
}

export async function getEvaluation(finalCode: Record<string, string>) {
  const res = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ final_code: finalCode }),
  });
  return await res.json();
}

export async function getAllEvents() {
  const res = await fetch(`${API_BASE}/events/all`);
  return await res.json();
}

export async function runTests(currentCode: Record<string, string>) {
  const res = await fetch(`${API_BASE}/run-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_code: currentCode }),
  });
  return await res.json();
}

export async function startSession() {
  await fetch(`${API_BASE}/session/start`, { method: 'POST' });
}