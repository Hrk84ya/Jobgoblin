import { registerHandler } from './registry';
import sendEmail from './sendEmail';
import resizeImage from './resizeImage';
import generateReport from './generateReport';

export function registerAllHandlers(): void {
  registerHandler('send-email', sendEmail);
  registerHandler('resize-image', resizeImage);
  registerHandler('generate-report', generateReport);
}

export { registerHandler, getHandler } from './registry';
export type { JobHandler } from './registry';
