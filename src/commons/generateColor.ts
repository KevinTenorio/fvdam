function generateColor() {
  let color = '';
  while (color.length < 6) {
    color = `${Math.floor(Math.random() * 16777215).toString(16)}`;
  }
  return `#${color}`;
}

export default generateColor;
