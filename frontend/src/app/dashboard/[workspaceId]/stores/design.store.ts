import { create } from 'zustand';
import {
  DesignVersion,
  Project,
  ProjectSummary,
  Requirements,
  SystemDesign,
} from '../types/design';

interface DesignState {
  projectId: string | null;
  project: Project | null;
  activeVersion: DesignVersion | null;

  // Flattened accessors for convenience
  requirements: Requirements | null;
  systemDesign: SystemDesign | null;

  // Global State
  projects: ProjectSummary[];
  whiteboardData: Record<string, any>;

  // Actions
  setProjects: (projects: ProjectSummary[]) => void;
  setProject: (project: Project) => void;
  setProjectId: (projectId: string) => void;
  setActiveVersion: (version: DesignVersion) => void;
  updateArtifact: (key: keyof DesignVersion, value: any) => void;
  setWhiteboardData: (projectId: string, type: string, data: any) => void;
  loadWhiteboards: (whiteboards: any[]) => void;
  reset: () => void;
}

export const useDesignStore = create<DesignState>((set) => ({
  projectId: null,
  project: null,
  activeVersion: null,
  requirements: null,
  systemDesign: null,
  projects: [],
  whiteboardData: {},

  setProjects: (projects) => set({ projects }),
  setProject: (project) => set({ project, projectId: project.id }),

  setProjectId: (projectId) => set({ projectId }),

  setActiveVersion: (activeVersion) =>
    set({
      activeVersion,
      requirements: activeVersion.requirements || null,
      systemDesign: activeVersion.systemDesign || null,
    }),

  updateArtifact: (key, value) =>
    set((state) => {
      if (!state.activeVersion) return state;

      // Update specfic artifact and the active version object
      const updatedVersion = { ...state.activeVersion, [key]: value };

      return {
        activeVersion: updatedVersion,
        // Update flattened state if applicable
        ...(key === 'requirements' ? { requirements: value } : {}),
        ...(key === 'systemDesign' ? { systemDesign: value } : {}),
      };
    }),

  setWhiteboardData: (projectId, type, data) =>
    set((state) => ({
      whiteboardData: {
        ...state.whiteboardData,
        [`${projectId}_${type}`]: data,
      },
    })),

  loadWhiteboards: (whiteboards) =>
    set((state) => {
      const newData = { ...state.whiteboardData };
      whiteboards.forEach((wb) => {
        newData[`${wb.projectId}_${wb.type}`] = wb.data;
      });
      return { whiteboardData: newData };
    }),

  reset: () =>
    set({
      projectId: null,
      project: null,
      activeVersion: null,
      requirements: null,
      systemDesign: null,
    }),
}));
