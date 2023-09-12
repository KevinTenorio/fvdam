import * as math from 'mathjs';
import { IElement, Material } from './Home.model';
function homogenize(elements: IElement[], materials: Material[]) {
  let Ch = math.zeros(6, 6, 'sparse');
  let totalArea = 0;
  for (let i = 0; i < materials.length; i++) {
    totalArea += materials[i].area;
  }
  for (let i = 0; i < elements.length; i++) {
    Ch = math.add(
      Ch,
      // @ts-ignore
      math.multiply(elements[i].area / totalArea, elements[i].material.C, elements[i].Conc)
    );
  }
  return Ch;
}

export default homogenize;
