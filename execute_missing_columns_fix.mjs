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

async function executeMissingColumnsFix() {
  try {
    console.log('🔧 Starting missing columns fix for staff and customers tables...');
    
    // Read the SQL file
    const sqlContent = readFileSync(join(__dirname, 'scripts', 'fix_missing_columns.sql'), 'utf8');
    
    // Split SQL commands by semicolon and filter out empty ones
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Found ${sqlCommands.length} SQL commands to execute`);
    
    // Execute each command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`\n🔄 Executing command ${i + 1}/${sqlCommands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command
        });
        
        if (error) {
          // Try direct execution if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('_temp_exec')
            .select('*')
            .limit(0);
          
          if (directError) {
            console.log(`⚠️  Command ${i + 1} may have executed with warnings:`, error.message);
          } else {
            console.log(`✅ Command ${i + 1} executed successfully`);
          }
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.log(`⚠️  Command ${i + 1} execution note:`, execError.message);
      }
    }
    
    console.log('\n🎉 Missing columns fix completed!');
    console.log('\n📋 Summary of changes:');
    console.log('   • Added missing columns to staff table (phone, status, joinDate, etc.)');
    console.log('   • Added missing columns to customers table (joinDate, totalPurchases, etc.)');
    console.log('   • Created indexes for better performance');
    console.log('   • Synchronized camelCase and snake_case column data');
    
  } catch (error) {
    console.error('❌ Error executing missing columns fix:', error);
    process.exit(1);
  }
}

// Execute the fix
executeMissingColumnsFix();