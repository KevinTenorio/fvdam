import { createContext, useContext, useState, useMemo } from 'react';
import { IMeshMaterial, IMeshRegion, IStuffToShow } from './Home/MeshGenerator/MeshGenerator.model';

const AppContext = createContext<any>(null);

// Updates the typescript Array type to include the toSpliced method.
declare global {
  interface Array<T> {
    toSpliced(index: number, deleteCount?: number): T[];
  }
}

// Provider component that must be used as parent for the App component.
export function AppProvider({ children }: any) {
  // Global application variables
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState<any[]>([]);
  const [fvdamFile, setFvdamFile] = useState<any>();
  const [unitCellWidth, setUnitCellWidth] = useState<number | null>(null);
  const [unitCellHeight, setUnitCellHeight] = useState<number | null>(null);
  const [materials, setMaterials] = useState<IMeshMaterial[]>([]);
  const [regions, setRegions] = useState<IMeshRegion[]>([]);
  const [nodes, setNodes] = useState<number[][]>([]);
  const [elements, setElements] = useState<number[][]>([]);
  const [faces, setFaces] = useState<number[][]>([]);
  const [stuffToShow, setStuffToShow] = useState<IStuffToShow>({
    elements: false,
    elementsIds: false,
    regionsLabels: false,
    nodesIds: false,
    facesIds: false,
    regionsMaterials: true,
    supports: false
  });
  const [divisionsByRegion, setDivisionsByRegion] = useState<number>(2);
  const [supportType, setSupportType] = useState<string>('none');
  const [elementsFaces, setElementsFaces] = useState<number[][]>([]);
  const [supportedFaces, setSupportedFaces] = useState<number[]>([]);
  const [periodicity, setPeriodicity] = useState<{ horizontal: boolean; vertical: boolean }>({
    horizontal: true,
    vertical: true
  });
  const [correctedFacesIds, setCorrectedFacesIds] = useState<number[]>([]);

  // Function to manage the global loading state. To start loading pass the message you want to display. To finish loading pass the same message and the false status.
  const setLoading = (message: string, status = true) => {
    if (status) {
      setLoadingMessages((prev: string[]) => [...prev, message]);
    } else {
      setLoadingMessages((prev: string[]) =>
        prev
          .slice(
            0,
            prev.findIndex((item) => item === message)
          )
          .concat(prev.slice(prev.findIndex((item) => item === message) + 1, prev.length))
      );
    }
  };

  // Function to control the global error state. To start the error pass the message you want to display. To finish the error pass the same message and the false status.
  const setError = (message: any, status = true) => {
    if (status) {
      setErrorMessages((prev: any[]) => [...prev, message]);
    } else {
      setErrorMessages((prev: any[]) =>
        prev
          .slice(
            0,
            prev.findIndex((item) => item === message)
          )
          .concat(prev.slice(prev.findIndex((item) => item === message) + 1, prev.length))
      );
    }
  };

  function readJsonFile(file: any) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      const data = JSON.parse(text as string);
      setNodes(data.nodes);
      setFaces(data.faces);
      setElements(data.elements);
      setSupportedFaces(data.supportedFaces);
      setElementsFaces(data.elementsFaces);
      setCorrectedFacesIds(data.correctedFacesIds);
      setRegions(data.regions);
      setMaterials(data.materials);
      setUnitCellWidth(data.unitCellWidth);
      setUnitCellHeight(data.unitCellHeight);
      setDivisionsByRegion(data.divisionsByRegion);
      setSupportType(data.supportType);
      setPeriodicity(data.periodicity);
    };
    reader.readAsText(file);
  }

  // Memoification of the global variables. Important to avoid unnecessary re-renders. Should be used in every context component.
  const value = useMemo(
    () => ({
      setError,
      errorMessages,
      loadingMessages,
      setLoading,
      fvdamFile,
      setFvdamFile,
      unitCellWidth,
      setUnitCellWidth,
      unitCellHeight,
      setUnitCellHeight,
      materials,
      setMaterials,
      regions,
      setRegions,
      nodes,
      setNodes,
      elements,
      setElements,
      faces,
      setFaces,
      stuffToShow,
      setStuffToShow,
      divisionsByRegion,
      setDivisionsByRegion,
      supportType,
      setSupportType,
      elementsFaces,
      setElementsFaces,
      supportedFaces,
      setSupportedFaces,
      periodicity,
      setPeriodicity,
      correctedFacesIds,
      setCorrectedFacesIds,
      readJsonFile
    }),
    [
      loadingMessages,
      errorMessages,
      fvdamFile,
      unitCellWidth,
      unitCellHeight,
      materials,
      regions,
      nodes,
      elements,
      faces,
      stuffToShow,
      divisionsByRegion,
      supportType,
      elementsFaces,
      supportedFaces,
      periodicity,
      correctedFacesIds
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the global variables. Should be used in every component that needs to access the global variables.
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
}
