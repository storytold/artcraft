import React, { createContext, useContext, useState } from "react";
import { JobContextType } from "@storyteller/common";
const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [jobTokens, setJobTokens] = useState<string[]>([]);

  const addJobToken = (token: string) => {
    setJobTokens((prevTokens) => [...prevTokens, token]);
  };

  const removeJobToken = (token: string) => {
    setJobTokens((prevTokens) => prevTokens.filter((t) => t !== token));
  };

  const clearJobTokens = () => {
    setJobTokens([]);
  };

  return (
    <JobContext.Provider
      value={{ jobTokens, addJobToken, removeJobToken, clearJobTokens }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJobContext must be used within a JobProvider");
  }
  return context;
};
