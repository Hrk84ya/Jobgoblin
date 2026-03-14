import type { JobHandler } from './registry';

const resizeImage: JobHandler = async (_payload) => {
  const delay = 2000 + Math.random() * 3000; // 2–5s
  await new Promise((resolve) => setTimeout(resolve, delay));
};

export default resizeImage;
