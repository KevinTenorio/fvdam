import { Node, Material, IElement } from './Home.model';

function getElements(
  elements: IElement[],
  nodes: Node[],
  materials: Material[],
  line: string,
  lines: string[],
  i: number
) {
  if (line === '%ELEMENT') {
    for (let j = 0; j < Number(lines[i + 1]); j++) {
      elements.push({
        id: 0,
        nodes: [],
        material: materials[0],
        area: 0,
        maxX: 0,
        minX: 0,
        maxY: 0,
        minY: 0,
        width: 0,
        height: 0
      });
    }
  } else if (line === '%ELEMENT.C4') {
    for (let j = 0; j < elements.length; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      elements[j].id = Number(info[0]);
      elements[j].material =
        materials.find((material) => material.id === Number(info[1])) ?? materials[0];
      elements[j].nodes = [
        nodes.find((node) => node.id === Number(info[4])) ?? nodes[0],
        nodes.find((node) => node.id === Number(info[5])) ?? nodes[0],
        nodes.find((node) => node.id === Number(info[6])) ?? nodes[0],
        nodes.find((node) => node.id === Number(info[7])) ?? nodes[0]
      ];
      elements[j].maxX = Math.max(
        elements[j].nodes[0].x,
        elements[j].nodes[1].x,
        elements[j].nodes[2].x,
        elements[j].nodes[3].x
      );
      elements[j].minX = Math.min(
        elements[j].nodes[0].x,
        elements[j].nodes[1].x,
        elements[j].nodes[2].x,
        elements[j].nodes[3].x
      );
      elements[j].maxY = Math.max(
        elements[j].nodes[0].y,
        elements[j].nodes[1].y,
        elements[j].nodes[2].y,
        elements[j].nodes[3].y
      );
      elements[j].minY = Math.min(
        elements[j].nodes[0].y,
        elements[j].nodes[1].y,
        elements[j].nodes[2].y,
        elements[j].nodes[3].y
      );
      elements[j].width = elements[j].maxX - elements[j].minX;
      elements[j].height = elements[j].maxY - elements[j].minY;
      elements[j].area = elements[j].width * elements[j].height;

      materials[Number(info[1]) - 1].area += elements[j].area;
    }
  }
}

export default getElements;
