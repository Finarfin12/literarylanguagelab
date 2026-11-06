"use client";

import { createContext, useContext } from "react";

const CourseVisibilityContext = createContext(false);

/** Memberi tahu komponen klien (Sidebar, Menu HP) apakah Kursus Dasar boleh tampil (Fase 16, flag `kursus_dasar`). */
export function CourseVisibilityProvider({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return <CourseVisibilityContext.Provider value={visible}>{children}</CourseVisibilityContext.Provider>;
}

export function useCourseVisible(): boolean {
  return useContext(CourseVisibilityContext);
}

const StudyVisibilityContext = createContext(false);

/** Memberi tahu komponen klien apakah Modul Belajar boleh tampil (Fase 24, flag `modul_belajar`). */
export function StudyVisibilityProvider({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return <StudyVisibilityContext.Provider value={visible}>{children}</StudyVisibilityContext.Provider>;
}

export function useStudyVisible(): boolean {
  return useContext(StudyVisibilityContext);
}
