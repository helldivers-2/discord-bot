import {createCanvas, registerFont} from 'canvas';

registerFont('./fonts/Monda-Regular.ttf', {
  family: 'Monda',
});

export const create2kCanvas = () => {
  const canvas = createCanvas(2000, 2000);
  const context = canvas.getContext('2d');
  context.font = '20px Monda';
  return canvas;
};

export const FONT = 'Monda';
