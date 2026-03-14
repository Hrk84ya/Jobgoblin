import type { JobHandler } from './registry';

const generateReport: JobHandler = async (_payload) => {
  const delay = 3000 + Math.random() * 4000; // 3–7s
  await new Promise((resolve) => setTimeout(resolve, delay));
};

export default generateReport;
