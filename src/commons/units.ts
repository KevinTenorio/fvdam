// Unidades só de exibição. A FVDAM não tem unidade: basta que as entradas sejam
// consistentes (ex.: mm e MPa). O usuário escolhe como os rótulos aparecem;
// a escolha fica guardada no navegador e não vai para o .fvt nem para o .json.
export interface UnitSystem {
  id: string;
  label: string;
  length: string;
  stress: string;
}

export const UNIT_SYSTEMS: UnitSystem[] = [
  { id: 'mm-MPa', label: 'mm · MPa', length: 'mm', stress: 'MPa' },
  { id: 'm-GPa', label: 'm · GPa', length: 'm', stress: 'GPa' },
  { id: 'm-Pa', label: 'm · Pa', length: 'm', stress: 'Pa' },
  { id: 'in-psi', label: 'in · psi', length: 'in', stress: 'psi' },
  { id: 'none', label: 'No units', length: '', stress: '' }
];

const STORAGE_KEY = 'fvdam.units';

export function loadUnitSystem(): UnitSystem {
  try {
    const id = window.localStorage.getItem(STORAGE_KEY);
    return UNIT_SYSTEMS.find((system) => system.id === id) ?? UNIT_SYSTEMS[0];
  } catch {
    return UNIT_SYSTEMS[0];
  }
}

export function saveUnitSystem(system: UnitSystem) {
  try {
    window.localStorage.setItem(STORAGE_KEY, system.id);
  } catch {
    // sem localStorage (modo privado, iframe): a escolha vale só nesta sessão
  }
}

// "(mm)" ou "" quando o sistema não tem unidade
export function unitSuffix(unit: string) {
  return unit ? ` (${unit})` : '';
}
