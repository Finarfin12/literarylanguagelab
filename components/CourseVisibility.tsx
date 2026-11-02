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
