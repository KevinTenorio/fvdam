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
        id: undefined,
        nodes: undefined,
        // @ts-ignore
        material: undefined
      });
    }
  } else if (line === '%ELEMENT.C4') {
    for (let j = 0; j < elements.length; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      elements[j].id = Number(info[0]);
      elements[j].material = materials[Number(info[1]) - 1];
      elements[j].nodes = [
        nodes[Number(info[4]) - 1],
        nodes[Number(info[5]) - 1],
        nodes[Number(info[6]) - 1],
        nodes[Number(info[7]) - 1]
      ];
      elements[j].area =
        (Math.max(
          // @ts-ignore
          nodes[Number(info[4]) - 1].x,
          nodes[Number(info[5]) - 1].x,
          nodes[Number(info[6]) - 1].x,
          nodes[Number(info[7]) - 1].x
        ) -
          Math.min(
            // @ts-ignore
            nodes[Number(info[4]) - 1].x,
            nodes[Number(info[5]) - 1].x,
            nodes[Number(info[6]) - 1].x,
            nodes[Number(info[7]) - 1].x
          )) *
        (Math.max(
          // @ts-ignore
          nodes[Number(info[4]) - 1].y,
          nodes[Number(info[5]) - 1].y,
          nodes[Number(info[6]) - 1].y,
          nodes[Number(info[7]) - 1].y
        ) -
          Math.min(
            // @ts-ignore
            nodes[Number(info[4]) - 1].y,
            nodes[Number(info[5]) - 1].y,
            nodes[Number(info[6]) - 1].y,
            nodes[Number(info[7]) - 1].y
          ));
      materials[Number(info[1]) - 1].area += elements[j].area;
    }
  }
}

export default getElements;
