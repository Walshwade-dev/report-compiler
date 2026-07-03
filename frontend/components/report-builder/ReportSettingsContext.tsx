"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type ReportSettingsContextValue = {
  people: string[];
  addPerson: (name: string) => void;
};

const ReportSettingsContext =
  createContext<ReportSettingsContextValue | null>(null);

const DEFAULT_PEOPLE = [
  "Fredrick Kariuki",
  "Faith Njani",
  "Grace Njoroge",
  "Anastasha Kenda",
];

const OFFICER_STORAGE_KEY = "report-officer-list";

function loadStoredPeople() {
  if (typeof window === "undefined") {
    return DEFAULT_PEOPLE;
  }

  try {
    const storedPeople = localStorage.getItem(OFFICER_STORAGE_KEY);

    if (!storedPeople) {
      return DEFAULT_PEOPLE;
    }

    const parsedPeople = JSON.parse(storedPeople);

    if (
      Array.isArray(parsedPeople) &&
      parsedPeople.every((person) => typeof person === "string")
    ) {
      return [...parsedPeople, ...DEFAULT_PEOPLE.filter((person) => !parsedPeople.includes(person))];
    }
  } catch (error) {
    console.error("Failed to load report officer list:", error);
  }

  return DEFAULT_PEOPLE;
}

export function ReportSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [people, setPeople] = useState(loadStoredPeople);

  useEffect(() => {
    localStorage.setItem(OFFICER_STORAGE_KEY, JSON.stringify(people));
  }, [people]);

  function addPerson(name: string) {
    const trimmed = name.trim();

    if (!trimmed) return;

    setPeople((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
  }

  return (
    <ReportSettingsContext.Provider value={{ people, addPerson }}>
      {children}
    </ReportSettingsContext.Provider>
  );
}

export function useReportSettings() {
  const context = useContext(ReportSettingsContext);

  if (!context) {
    throw new Error("useReportSettings must be used inside ReportSettingsProvider");
  }

  return context;
}
