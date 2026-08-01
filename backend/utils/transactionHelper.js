/**
 * Executes a database operation with automatic deadlock retry mechanism.
 * If MySQL encounters Error 1213 (ER_LOCK_DEADLOCK), it automatically retries up to maxRetries times.
 */
export const executeWithDeadlockRetry = async (operationFn, maxRetries = 3, delayMs = 50) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operationFn();
    } catch (err) {
      attempt++;
      const isDeadlock = err.code === 'ER_LOCK_DEADLOCK' || err.errno === 1213 || (err.message && err.message.includes('Deadlock'));
      
      if (isDeadlock && attempt < maxRetries) {
        console.warn(`[Deadlock Retry] Detected MySQL deadlock (Attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      } else {
        throw err;
      }
    }
  }
};
