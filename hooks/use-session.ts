import { useState, useEffect } from "react";
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

export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get or create session ID
    let id = localStorage.getItem("data-alchemist-session");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("data-alchemist-session", id);
    }
    setSessionId(id);

    // Load existing session data
    loadSessionData(id);
  }, []);

  const loadSessionData = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/upload?sessionId=${id}`);
      const result = await response.json();
      setSessionData(result.sessionData || {});
    } catch (error) {
      console.error("Failed to load session data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File, fileType: string) => {
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

      const result = await response.json();

      if (result.success) {
        setSessionData(result.sessionData);
        // Return the entire result including validation
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionData = async (
    fileType: string,
    newData: ParsedFileData
  ) => {
    try {
      setIsLoading(true);

      // Update local state immediately for better UX
      setSessionData((prev) => ({
        ...prev,
        [fileType]: newData,
      }));

      // Send update to backend
      const response = await fetch("/api/update-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          fileType,
          data: newData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update with the validated data from backend
        setSessionData(result.sessionData);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Update failed:", error);
      // Revert local state on error
      loadSessionData(sessionId);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem("data-alchemist-session");
    setSessionData({});
    const newId = uuidv4();
    setSessionId(newId);
    localStorage.setItem("data-alchemist-session", newId);
  };

  return {
    sessionId,
    sessionData,
    isLoading,
    uploadFile,
    updateSessionData,
    clearSession,
    loadSessionData: () => loadSessionData(sessionId),
  };
}
