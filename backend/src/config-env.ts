import dotenv from 'dotenv';
import path from 'path';

const result = dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('Dotenv Load Result:', result);
console.log('MONGODB_URI defined in config-env:', !!process.env.MONGODB_URI);
