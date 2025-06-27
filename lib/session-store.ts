interface ParsedFileData {
  headers: string[];
  data: Record<string, any>[];
  fileName: string;
  fileType: string;
}

interface SessionData {
  [key: string]: ParsedFileData;
}

// Global session storage - in production, use Redis or database
const sessions = new Map<string, SessionData>();

export function getSession(sessionId: string): SessionData {
  return sessions.get(sessionId) || {};
}

export function setSession(sessionId: string, data: SessionData): void {
  sessions.set(sessionId, data);
}

export function updateSessionFile(
  sessionId: string,
  fileType: string,
  fileData: ParsedFileData
): SessionData {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {});
  }

  const sessionData = sessions.get(sessionId)!;
  sessionData[fileType] = fileData;

  return sessionData;
}

export function hasSession(sessionId: string): boolean {
  return sessions.has(sessionId);
}
