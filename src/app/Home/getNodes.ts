import { Node, NodesInfo } from './Home.model';

function getNodes(nodes: Node[], nodesInfo: NodesInfo, line: string, lines: string[], i: number) {
  const formattedLine = line.replaceAll('\r', '');
  if (formattedLine === '%NODE') {
    for (let j = 0; j < Number(lines[i + 1]); j++) {
      nodes.push({
        id: 0,
        x: 0,
        y: 0
      });
    }
  } else if (formattedLine === '%NODE.COORD') {
    let minX: number | undefined = undefined;
    let maxX: number | undefined = undefined;
    let minY: number | undefined = undefined;
    let maxY: number | undefined = undefined;
    let nodeProps = lines[i + 2].replaceAll(' ', '').split('\t');
    nodes[0].id = Number(nodeProps[0]);
    nodes[0].x = Number(nodeProps[1]);
    nodes[0].y = Number(nodeProps[2]);
    minX = nodes[0].x;
    maxX = nodes[0].x;
    minY = nodes[0].y;
    maxY = nodes[0].y;
    for (let j = 0; j < nodes.length; j++) {
      nodeProps = lines[i + j + 2].replaceAll(' ', '').split('\t');
      nodes[j].id = Number(nodeProps[0]);
      nodes[j].x = Number(nodeProps[1]);
      nodes[j].y = Number(nodeProps[2]);
      if (nodes[j].x < minX) {
        minX = nodes[j].x;
      }
      if (nodes[j].x > maxX) {
        maxX = nodes[j].x;
      }
      if (nodes[j].y < minY) {
        minY = nodes[j].y;
      }
      if (nodes[j].y > maxY) {
        maxY = nodes[j].y;
      }
      nodesInfo.minX = minX;
      nodesInfo.maxX = maxX;
      nodesInfo.minY = minY;
      nodesInfo.maxY = maxY;
      nodesInfo.nodesX = nodes.length / (maxX - minX);
      nodesInfo.nodesY = nodes.length / (maxY - minY);
    }
  }
}

export default getNodes;
