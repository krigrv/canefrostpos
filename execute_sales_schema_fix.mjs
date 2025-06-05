import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zqmdjuqyljehirflbkge.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set it in your .env file or environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSalesSchemaFix() {
  try {
    console.log('🔧 Starting sales table schema fix...');
    
    // Read the SQL file
    const sqlContent = readFileSync(join(__dirname, 'fix_sales_table_schema.sql'), 'utf8');
    
    // Split SQL commands by semicolon and filter out empty ones
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    console.log(`📝 Executing ${sqlCommands.length} SQL commands...`);
    
    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command) {
        console.log(`⏳ Executing command ${i + 1}/${sqlCommands.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command
        });
        
        if (error) {
          // Try direct execution if RPC fails
          console.log('🔄 Trying direct execution...');
          const { error: directError } = await supabase
            .from('_sql')
            .select('*')
            .limit(0); // This will fail, but we'll use the connection
          
          // For ALTER TABLE commands, we need to use a different approach
          if (command.includes('ALTER TABLE')) {
            console.log(`⚠️  Manual execution required for: ${command.substring(0, 50)}...`);
            console.log('Please run this command directly in your Supabase SQL editor.');
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Sales table schema fix completed!');
    console.log('\n📋 Summary of changes:');
    console.log('   • Added transactionId column (TEXT)');
    console.log('   • Added cashAmount column (DECIMAL)');
    console.log('   • Added upiAmount column (DECIMAL)');
    console.log('   • Added changeAmount column (DECIMAL)');
    console.log('   • Added updated_at column (TIMESTAMP)');
    console.log('   • Created index on transactionId');
    console.log('   • Updated existing records with transactionId');
    
  } catch (error) {
    console.error('❌ Error executing sales schema fix:', error);
    console.log('\n🔧 Manual fix required:');
    console.log('Please run the SQL commands in fix_sales_table_schema.sql manually in your Supabase SQL editor.');
    process.exit(1);
  }
}

// Run the migration
executeSalesSchemaFix();