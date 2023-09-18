export function findLcm(a: number, b: number) {
  return (a * b) / findGcd(a, b);
}

export function findGcd(a: number, b: number) {
  const decimals = Math.max(
    a.toString().split('.')[1]?.length ?? 0,
    b.toString().split('.')[1]?.length ?? 0
  );
  a = a * Math.pow(10, decimals);
  b = b * Math.pow(10, decimals);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a / Math.pow(10, decimals);
}
