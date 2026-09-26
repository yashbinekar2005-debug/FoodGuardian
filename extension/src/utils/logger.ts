export const logger = {
  info: (msg: string, ...args: any[]) => {
    console.log(`%c[FoodGuardian]%c ${msg}`, 'color: #16a34a; font-weight: bold;', 'color: inherit;', ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(`%c[FoodGuardian]%c ${msg}`, 'color: #ea580c; font-weight: bold;', 'color: inherit;', ...args);
  },
  error: (msg: string, ...args: any[]) => {
    console.error(`%c[FoodGuardian]%c ${msg}`, 'color: #dc2626; font-weight: bold;', 'color: inherit;', ...args);
  }
};
