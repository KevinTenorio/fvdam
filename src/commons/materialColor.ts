// Cor do material i. Usa a cor do modelo (.json) quando existe; ao abrir só um .fvt
// (que não guarda cores) cai numa paleta fixa, para a pizza e as legendas não ficarem vazias.
const PALETTE = [
  '#0072b2',
  '#e69f00',
  '#009e73',
  '#cc79a7',
  '#56b4e9',
  '#d55e00',
  '#f0e442',
  '#999999'
];

function materialColor(meshData: any, index: number) {
  return meshData?.materials?.[index]?.color ?? PALETTE[index % PALETTE.length];
}

export default materialColor;
