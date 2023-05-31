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
    for (let j = 0; j < nodes.length; j++) {
      const nodeProps = lines[i + j + 2].replaceAll(' ', '').split('\t');
      nodes[j].id = Number(nodeProps[0]);
      nodes[j].x = Number(nodeProps[1]);
      nodes[j].y = Number(nodeProps[2]);
      if (!minX) {
        minX = nodes[j].x;
      } else if (nodes[j].x < minX) {
        minX = nodes[j].x;
      }
      if (!maxX) {
        maxX = nodes[j].x;
      } else if (nodes[j].x > maxX) {
        maxX = nodes[j].x;
      }
      if (!minY) {
        minY = nodes[j].y;
      } else if (nodes[j].y < minY) {
        minY = nodes[j].y;
      }
      if (!maxY) {
        maxY = nodes[j].y;
      } else if (nodes[j].y > maxY) {
        maxY = nodes[j].y;
      }
      if (maxX && minX && maxY && minY) {
        nodesInfo.minX = minX;
        nodesInfo.maxX = maxX;
        nodesInfo.minY = minY;
        nodesInfo.maxY = maxY;
        nodesInfo.nodesX = nodes.length / (maxX - minX);
        nodesInfo.nodesY = nodes.length / (maxY - minY);
      }
    }
  }
}

export default getNodes;
