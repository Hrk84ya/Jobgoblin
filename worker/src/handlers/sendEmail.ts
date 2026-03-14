import type { JobHandler } from './registry';

const sendEmail: JobHandler = async (_payload) => {
  const delay = 1000 + Math.random() * 2000; // 1–3s
  await new Promise((resolve) => setTimeout(resolve, delay));
};

export default sendEmail;
