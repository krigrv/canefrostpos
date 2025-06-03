import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

console.log('Creating missing tables...');

// Read and execute the SQL script
const sql = readFileSync('./scripts/create_missing_tables.sql', 'utf8');

// Split SQL into individual statements and execute them
const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

for (const statement of statements) {
  const trimmedStatement = statement.trim();
  if (trimmedStatement && !trimmedStatement.startsWith('--')) {
    console.log('Executing:', trimmedStatement.substring(0, 50) + '...');
    
    try {
      const { data, error } = await supabase.rpc('exec', {
        sql: trimmedStatement
      });
      
      if (error) {
        console.error('Error executing statement:', error);
        console.error('Statement was:', trimmedStatement);
      } else {
        console.log('✓ Statement executed successfully');
      }
    } catch (err) {
      console.error('Exception:', err.message);
      console.error('Statement was:', trimmedStatement);
    }
  }
}

console.log('Script execution completed.');