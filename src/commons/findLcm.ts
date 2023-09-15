export function findLcm(a: number, b: number) {
  return (a * b) / findGcd(a, b);
}

export function findGcd(a: number, b: number) {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}
