// index.ts
import { runner } from '@agentuity/sdk';

// If your toolchain supports import.meta.dirname, this is fine:
runner(true, import.meta.dirname).catch((err) => {
  console.error(err);
  process.exit(1);
});