function addAlpha(color: string, alpha: number): string {
  let colorStr = color;
  let isHex: boolean;
  let currentAlpha = 0;
  if (colorStr[0] === '#') {
    isHex = true;
  } else if (colorStr.includes('rgb')) {
    isHex = false;
  } else {
    throw new Error('Invalid color format passed to addAlpha.');
  }
  if (isHex) {
    colorStr = colorStr.replace('#', '');
    if (colorStr.length === 6) {
      colorStr =
        '#' +
        colorStr +
        Math.abs(alpha * 256)
          .toString(16)
          .slice(0, 2);
    } else if (colorStr.length === 8) {
      currentAlpha = parseInt(colorStr.slice(0, 2), 16) / 256;
      colorStr =
        '#' +
        colorStr.slice(2) +
        Math.abs((1 - (1 - alpha) * (1 - currentAlpha)) * 256)
          .toString(16)
          .slice(0, 2);
    }
  } else {
    if (colorStr.includes('rgba')) {
      currentAlpha = parseFloat(colorStr.replace(')', '').slice(colorStr.lastIndexOf(',') + 1));
      colorStr = colorStr.replace(
        currentAlpha.toString(),
        (1 - (1 - alpha) * (1 - currentAlpha)).toString()
      );
    } else if (colorStr.includes('rgb')) {
      colorStr = colorStr.replace('rgb', 'rgba');
      colorStr = colorStr.replace(')', `,${alpha})`);
    }
  }
  return colorStr;
}

export default addAlpha;
