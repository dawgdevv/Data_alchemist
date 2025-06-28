"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Trash2, Download, Upload, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";

interface SessionInfo {
  sessionId: string;
  exists: boolean;
  lastAccessed?: string;
  fileCount?: number;
}

export default function SessionManager() {
  const {
    sessionId,
    checkSessionExists,
    deleteSessionFromServer,
    loadSessionData,
  } = useSession();
  const [sessionInput, setSessionInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const checkSession = async (id: string) => {
    if (!id.trim()) return;

    setIsLoading(true);
    try {
      const exists = await checkSessionExists(id);
      setSessionInfo({
        sessionId: id,
        exists,
      });
    } catch (error) {
      console.error("Failed to check session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreSession = async (id: string) => {
    setIsLoading(true);
    try {
      await loadSessionData();
      console.log("Session restored successfully");
    } catch (error) {
      console.error("Failed to restore session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-[#313244] border-[#45475a]">
      <CardHeader>
        <CardTitle className="text-[#cdd6f4] flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Session Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-[#6c7086] mb-2">Current Session ID:</p>
          <div className="flex items-center space-x-2">
            <code className="bg-[#45475a] px-2 py-1 rounded text-xs text-[#cdd6f4] flex-1 truncate">
              {sessionId}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(sessionId)}
              className="h-8 w-8 p-0"
            >
              📋
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm text-[#6c7086] mb-2">
            Restore Previous Session:
          </p>
          <div className="flex space-x-2">
            <Input
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="Enter session ID..."
              className="bg-[#45475a] border-[#585b70] text-[#cdd6f4]"
            />
            <Button
              onClick={() => checkSession(sessionInput)}
              disabled={isLoading || !sessionInput.trim()}
              variant="outline"
              className="bg-[#45475a] border-[#585b70] text-[#cdd6f4] hover:bg-[#585b70]"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                "Check"
              )}
            </Button>
          </div>
        </div>

        {sessionInfo && (
          <div className="p-3 bg-[#45475a] rounded border border-[#585b70]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#cdd6f4]">
                Session Status
              </span>
              <Badge
                variant={sessionInfo.exists ? "default" : "destructive"}
                className={
                  sessionInfo.exists
                    ? "bg-[#a6e3a1] text-[#1e1e2e]"
                    : "bg-[#f38ba8] text-[#1e1e2e]"
                }
              >
                {sessionInfo.exists ? "Found" : "Not Found"}
              </Badge>
            </div>

            {sessionInfo.exists && (
              <div className="flex space-x-2 mt-3">
                <Button
                  onClick={() => restoreSession(sessionInfo.sessionId)}
                  disabled={isLoading}
                  size="sm"
                  className="bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Restore
                </Button>
                <Button
                  onClick={() => deleteSessionFromServer(sessionInfo.sessionId)}
                  disabled={isLoading}
                  size="sm"
                  variant="destructive"
                  className="bg-[#f38ba8] text-[#1e1e2e] hover:bg-[#f38ba8]/90"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-[#6c7086] pt-2 border-t border-[#45475a]">
          💡 Sessions are automatically saved to Redis and persist for 24 hours.
          Share your session ID to collaborate with others.
        </div>
      </CardContent>
    </Card>
  );
}
