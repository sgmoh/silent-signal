import { createContext, useState, useContext, ReactNode } from "react";
import { MessageStatusItem, BulkProgress } from "../types/discord";

interface StatusContextType {
  messageStatus: MessageStatusItem[];
  bulkProgress: BulkProgress;
  addMessageStatus: (status: MessageStatusItem) => void;
  clearMessageStatus: () => void;
  startBulkProgress: (total: number) => void;
  updateBulkProgress: (current: number) => void;
  endBulkProgress: () => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [messageStatus, setMessageStatus] = useState<MessageStatusItem[]>([]);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress>({
    current: 0,
    total: 0,
    inProgress: false,
  });

  const addMessageStatus = (status: MessageStatusItem) => {
    setMessageStatus((prev) => [status, ...prev]);
  };

  const clearMessageStatus = () => {
    setMessageStatus([]);
  };

  const startBulkProgress = (total: number) => {
    setBulkProgress({
      current: 0,
      total,
      inProgress: true,
    });
  };

  const updateBulkProgress = (current: number) => {
    setBulkProgress((prev) => ({
      ...prev,
      current,
    }));
  };

  const endBulkProgress = () => {
    setBulkProgress((prev) => ({
      ...prev,
      inProgress: false,
    }));
  };

  return (
    <StatusContext.Provider
      value={{
        messageStatus,
        bulkProgress,
        addMessageStatus,
        clearMessageStatus,
        startBulkProgress,
        updateBulkProgress,
        endBulkProgress,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error("useStatus must be used within a StatusProvider");
  }
  return context;
}
