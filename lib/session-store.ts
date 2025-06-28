interface ParsedFileData {
  headers: string[];
  data: Record<string, any>[];
  fileName: string;
  fileType: string;
}

interface SessionData {
  [key: string]: ParsedFileData;
}

interface SessionMetadata {
  lastAccessed: number;
  lastModified: number;
  version: number;
}

// Enhanced session storage with version control and better persistence
const sessions = new Map<string, SessionData>();
const sessionMetadata = new Map<string, SessionMetadata>();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const MAX_SESSIONS = 100; // Prevent memory overflow

// Create a deep clone function to prevent mutation
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function getSession(sessionId: string): SessionData {
  if (!sessionId) {
    console.warn("getSession called with empty sessionId");
    return {};
  }

  try {
    // Update last accessed time
    const metadata = sessionMetadata.get(sessionId) || {
      lastAccessed: Date.now(),
      lastModified: Date.now(),
      version: 1,
    };
    metadata.lastAccessed = Date.now();
    sessionMetadata.set(sessionId, metadata);

    const sessionData = sessions.get(sessionId) || {};
    console.log(`getSession(${sessionId}):`, {
      files: Object.keys(sessionData),
      totalFiles: Object.keys(sessionData).length,
    });

    return deepClone(sessionData);
  } catch (error) {
    console.error("Error getting session:", error);
    return {};
  }
}

export function setSession(sessionId: string, data: SessionData): void {
  if (!sessionId) {
    console.warn("setSession called with empty sessionId");
    return;
  }

  try {
    // Cleanup old sessions if we have too many
    if (sessions.size >= MAX_SESSIONS) {
      cleanupOldSessions();
    }

    const clonedData = deepClone(data);
    sessions.set(sessionId, clonedData);

    const metadata: SessionMetadata = {
      lastAccessed: Date.now(),
      lastModified: Date.now(),
      version: (sessionMetadata.get(sessionId)?.version || 0) + 1,
    };
    sessionMetadata.set(sessionId, metadata);

    console.log(`setSession(${sessionId}):`, {
      files: Object.keys(clonedData),
      totalFiles: Object.keys(clonedData).length,
      version: metadata.version,
    });
  } catch (error) {
    console.error("Error setting session:", error);
  }
}

export function updateSessionFile(
  sessionId: string,
  fileType: string,
  fileData: ParsedFileData
): SessionData {
  if (!sessionId || !fileType || !fileData) {
    throw new Error("Invalid parameters for session update");
  }

  try {
    // CRITICAL: Get existing session data first and preserve all files
    const existingSessionData = getSession(sessionId);
    console.log(`updateSessionFile - Before update:`, {
      sessionId,
      fileType,
      existingFiles: Object.keys(existingSessionData),
      existingCount: Object.keys(existingSessionData).length,
    });

    // Create new session data preserving ALL existing files
    const updatedSessionData: SessionData = {
      ...existingSessionData, // This preserves all existing files
      [fileType]: {
        headers: [...fileData.headers],
        data: fileData.data.map((row) => ({ ...row })),
        fileName:
          fileData.fileName ||
          existingSessionData[fileType]?.fileName ||
          `${fileType}.csv`,
        fileType:
          fileData.fileType ||
          existingSessionData[fileType]?.fileType ||
          fileType,
      },
    };

    console.log(`updateSessionFile - After merge:`, {
      sessionId,
      updatedFile: fileType,
      allFiles: Object.keys(updatedSessionData),
      totalCount: Object.keys(updatedSessionData).length,
    });

    // Verify we haven't lost any files
    const existingFiles = Object.keys(existingSessionData);
    const newFiles = Object.keys(updatedSessionData);
    const lostFiles = existingFiles.filter((file) => !newFiles.includes(file));

    if (lostFiles.length > 0) {
      console.error(`CRITICAL: Lost files during update:`, lostFiles);
      // Try to recover by merging again
      lostFiles.forEach((lostFile) => {
        if (existingSessionData[lostFile]) {
          updatedSessionData[lostFile] = existingSessionData[lostFile];
        }
      });
    }

    // Save the updated session
    setSession(sessionId, updatedSessionData);

    // Final verification
    const finalSessionData = getSession(sessionId);
    console.log(`updateSessionFile - Final verification:`, {
      sessionId,
      finalFiles: Object.keys(finalSessionData),
      finalCount: Object.keys(finalSessionData).length,
    });

    return finalSessionData;
  } catch (error) {
    console.error("Error updating session file:", error);
    throw error;
  }
}

export function hasSession(sessionId: string): boolean {
  return sessionId ? sessions.has(sessionId) : false;
}

export function updateSessionCell(
  sessionId: string,
  fileType: string,
  rowIndex: number,
  column: string,
  value: any
): SessionData {
  const sessionData = getSession(sessionId);

  if (!sessionData[fileType]) {
    throw new Error(`File type ${fileType} not found in session`);
  }

  try {
    // Create updated file data
    const updatedFileData = {
      ...sessionData[fileType],
      headers: [...sessionData[fileType].headers],
      data: sessionData[fileType].data.map((row, index) =>
        index === rowIndex ? { ...row, [column]: value } : { ...row }
      ),
    };

    return updateSessionFile(sessionId, fileType, updatedFileData);
  } catch (error) {
    console.error("Error updating session cell:", error);
    throw error;
  }
}

// Debug function to check session state
export function debugSession(sessionId: string): void {
  const sessionData = getSession(sessionId);
  const metadata = sessionMetadata.get(sessionId);

  console.log(`=== Session Debug: ${sessionId} ===`);
  console.log(`Files:`, Object.keys(sessionData));
  console.log(`Total Files:`, Object.keys(sessionData).length);
  console.log(`Metadata:`, metadata);
  console.log(
    `Details:`,
    Object.entries(sessionData).map(([key, data]) => ({
      file: key,
      rows: data.data.length,
      headers: data.headers.length,
      fileName: data.fileName,
    }))
  );
  console.log(`=== End Debug ===`);
}

// Enhanced cleanup function
export function cleanupOldSessions(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, metadata] of sessionMetadata.entries()) {
    if (now - metadata.lastAccessed > SESSION_TIMEOUT) {
      sessions.delete(sessionId);
      sessionMetadata.delete(sessionId);
      cleanedCount++;
    }
  }

  console.log(`Cleaned up ${cleanedCount} old sessions`);
}

// Export session data for debugging and backup
export function getSessionStats(): {
  sessionCount: number;
  totalSize: number;
  sessions: Array<{ id: string; files: string[]; lastAccessed: Date }>;
} {
  let totalSize = 0;
  const sessionList: Array<{
    id: string;
    files: string[];
    lastAccessed: Date;
  }> = [];

  for (const [sessionId, data] of sessions.entries()) {
    try {
      totalSize += JSON.stringify(data).length;
      const metadata = sessionMetadata.get(sessionId);
      sessionList.push({
        id: sessionId,
        files: Object.keys(data),
        lastAccessed: new Date(metadata?.lastAccessed || 0),
      });
    } catch (error) {
      console.warn("Error calculating session size:", error);
    }
  }

  return {
    sessionCount: sessions.size,
    totalSize,
    sessions: sessionList,
  };
}
