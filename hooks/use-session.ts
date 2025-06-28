import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

interface ParsedFileData {
  headers: string[];
  data: Record<string, any>[];
  fileName: string;
  fileType: string;
}

interface SessionData {
  [key: string]: ParsedFileData;
}

const STORAGE_KEYS = {
  SESSION_ID: "data-alchemist-session",
  SESSION_DATA: "data-alchemist-data",
  SESSION_VERSION: "data-alchemist-version",
};

export function useSession() {
  // ALWAYS declare these hooks in the same order
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState<any>(null);

  // Use refs to prevent race conditions and hook order issues
  const isUpdatingRef = useRef(false);
  const pendingUpdatesRef = useRef<Map<string, any>>(new Map());
  const isMountedRef = useRef(true);
  const lastBackupRef = useRef<number>(0);

  // Backup session data to localStorage
  const backupToLocalStorage = useCallback(
    (data: SessionData, version?: number) => {
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(data));
        localStorage.setItem(
          STORAGE_KEYS.SESSION_VERSION,
          String(version || Date.now())
        );
        lastBackupRef.current = Date.now();
        console.log(
          "Backed up session data to localStorage:",
          Object.keys(data)
        );
      } catch (error) {
        console.warn("Failed to backup to localStorage:", error);
      }
    },
    []
  );

  // Restore session data from localStorage
  const restoreFromLocalStorage = useCallback((): SessionData => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        console.log(
          "Restored session data from localStorage:",
          Object.keys(parsed)
        );
        return parsed;
      }
    } catch (error) {
      console.warn("Failed to restore from localStorage:", error);
    }
    return {};
  }, []);

  // Only run on mount
  useEffect(() => {
    isMountedRef.current = true;

    // Get or create session ID
    let id = "";
    try {
      id = localStorage.getItem(STORAGE_KEYS.SESSION_ID) || "";
      if (!id) {
        id = uuidv4();
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, id);
      }
      setSessionId(id);

      // Try to restore from localStorage first
      const localData = restoreFromLocalStorage();
      if (Object.keys(localData).length > 0) {
        setSessionData(localData);
      }

      // Load existing session data from backend
      loadSessionData(id);
    } catch (error) {
      console.error("Failed to initialize session:", error);
      // Fallback to new session
      id = uuidv4();
      setSessionId(id);
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, id);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

  const loadSessionData = useCallback(
    async (id: string) => {
      if (!isMountedRef.current) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/upload?sessionId=${id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (isMountedRef.current && result.sessionData) {
          console.log(
            "Loaded session data from backend:",
            Object.keys(result.sessionData)
          );
          setSessionData(result.sessionData);
          // Backup to localStorage
          backupToLocalStorage(result.sessionData);
        }
      } catch (error) {
        console.error("Failed to load session data from backend:", error);
        // Fallback to localStorage data
        const localData = restoreFromLocalStorage();
        if (Object.keys(localData).length > 0 && isMountedRef.current) {
          console.log("Using localStorage fallback data");
          setSessionData(localData);
        } else if (isMountedRef.current) {
          setSessionData({});
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [backupToLocalStorage, restoreFromLocalStorage]
  );

  const uploadFile = async (file: File, fileType: string) => {
    if (!sessionId) {
      throw new Error("Session not initialized");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);
    formData.append("sessionId", sessionId);

    try {
      setIsLoading(true);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        if (isMountedRef.current) {
          console.log(
            "Upload result - Files:",
            Object.keys(result.sessionData || {})
          );
          setSessionData(result.sessionData || {});
          setLastValidationResult(result.validation || null);
          // Backup to localStorage
          backupToLocalStorage(result.sessionData || {});
        }
        return result;
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const updateSessionData = async (
    fileType: string,
    newData: ParsedFileData
  ) => {
    if (!sessionId) {
      throw new Error("Session not initialized");
    }

    // Prevent concurrent updates
    if (isUpdatingRef.current) {
      console.warn("Update already in progress, queuing...");
      pendingUpdatesRef.current.set(fileType, newData);
      return Promise.resolve();
    }

    try {
      isUpdatingRef.current = true;
      setIsLoading(true);

      // Store original data for rollback INCLUDING localStorage data
      const originalData = { ...sessionData };
      const localBackupData = restoreFromLocalStorage();

      console.log(
        `Before update - Local state files:`,
        Object.keys(originalData)
      );
      console.log(
        `Before update - LocalStorage files:`,
        Object.keys(localBackupData)
      );

      // Create optimistic update that preserves ALL existing files
      const optimisticUpdate = {
        ...originalData, // Preserve all existing files
        ...localBackupData, // Include localStorage backup
        [fileType]: { ...newData }, // Update specific file
      };

      if (isMountedRef.current) {
        console.log(
          `Optimistic update - Files:`,
          Object.keys(optimisticUpdate)
        );
        setSessionData(optimisticUpdate);
        // Backup optimistic update
        backupToLocalStorage(optimisticUpdate);
      }

      // Send ALL session data to backend, not just the updated file
      const response = await fetch("/api/update-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          fileType,
          data: newData,
          allSessionData: optimisticUpdate, // Send all data as backup
        }),
      });

      if (!response.ok) {
        throw new Error(`Update failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Verify we didn't lose any files
        const resultFiles = Object.keys(result.sessionData || {});
        const expectedFiles = Object.keys(optimisticUpdate);
        const missingFiles = expectedFiles.filter(
          (file) => !resultFiles.includes(file)
        );

        if (missingFiles.length > 0) {
          console.error(
            `Backend lost files, restoring from optimistic update:`,
            missingFiles
          );
          // Restore missing files from optimistic update
          const restoredData = {
            ...result.sessionData,
            ...Object.fromEntries(
              missingFiles.map((file) => [file, optimisticUpdate[file]])
            ),
          };
          result.sessionData = restoredData;
        }

        if (isMountedRef.current) {
          console.log(
            `Backend response - Files:`,
            Object.keys(result.sessionData || {})
          );
          console.log(`Backend debug:`, result.debug);
          setSessionData(result.sessionData || {});

          // Set validation from response - no force validation needed
          if (result.validation) {
            console.log(
              "Setting validation from update result:",
              result.validation
            );
            setLastValidationResult(result.validation);
          }

          // Backup successful update
          backupToLocalStorage(result.sessionData || {});
        }
        return result;
      } else {
        // Revert optimistic update
        if (isMountedRef.current) {
          console.log("Reverting to original data:", Object.keys(originalData));
          setSessionData(originalData);
          backupToLocalStorage(originalData);
        }
        throw new Error(result.error || "Update failed");
      }
    } catch (error) {
      console.error("Update failed:", error);
      // Restore from localStorage if available
      const fallbackData = restoreFromLocalStorage();
      if (Object.keys(fallbackData).length > 0 && isMountedRef.current) {
        console.log("Restoring from localStorage fallback");
        setSessionData(fallbackData);
      } else if (sessionId && isMountedRef.current) {
        console.log("Reloading session data due to error");
        await loadSessionData(sessionId);
      }
      throw error;
    } finally {
      isUpdatingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }

      // Process any pending updates
      if (pendingUpdatesRef.current.size > 0) {
        const [nextFileType, nextData] = pendingUpdatesRef.current
          .entries()
          .next().value;
        pendingUpdatesRef.current.delete(nextFileType);

        // Add a small delay to prevent rapid-fire updates
        setTimeout(() => {
          if (isMountedRef.current) {
            updateSessionData(nextFileType, nextData);
          }
        }, 200);
      }
    }
  };

  // Simplified cell update method - no force validation
  const updateSessionCell = async (
    fileType: string,
    rowIndex: number,
    column: string,
    value: any
  ) => {
    const currentFileData = sessionData[fileType];
    if (!currentFileData) {
      throw new Error(`File type ${fileType} not found`);
    }

    console.log(
      `Updating cell in ${fileType} - Row: ${rowIndex}, Column: ${column}, Value: ${value}`
    );

    const updatedData = {
      ...currentFileData,
      data: currentFileData.data.map((row, index) =>
        index === rowIndex ? { ...row, [column]: value } : row
      ),
    };

    // Call updateSessionData which already handles validation
    const result = await updateSessionData(fileType, updatedData);
    return result;
  };

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
      localStorage.removeItem(STORAGE_KEYS.SESSION_VERSION);

      const newId = uuidv4();
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, newId);

      if (isMountedRef.current) {
        setSessionData({});
        setLastValidationResult(null);
        setSessionId(newId);
      }
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  }, []);

  return {
    sessionId,
    sessionData,
    isLoading,
    lastValidationResult,
    uploadFile,
    updateSessionData,
    updateSessionCell,
    clearSession,
    loadSessionData: () => sessionId && loadSessionData(sessionId),
    // Additional utility functions
    backupToLocalStorage: () => backupToLocalStorage(sessionData),
    restoreFromLocalStorage,
  };
}
