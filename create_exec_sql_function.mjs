import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zqmdjuqyljehirflbkge.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecSqlFunction() {
  console.log('Creating exec_sql function in Supabase...');
  
  try {
    // SQL to create the exec_sql function
    const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE sql;
      result := '{"success": true}'::JSONB;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
      );
      RETURN result;
    END;
    $$;
    
    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
    GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
    `;
    
    // Use direct REST API call to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: createFunctionSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create exec_sql function');
      console.error('Response:', errorText);
      
      // Try alternative approach
      console.log('Trying alternative approach...');
      
      // Create a temporary table to execute SQL
      const createTempTableSQL = `
      CREATE TABLE IF NOT EXISTS _sql_exec (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create a trigger function to execute SQL on insert
      CREATE OR REPLACE FUNCTION execute_sql_on_insert()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        EXECUTE NEW.query;
        RETURN NEW;
      END;
      $$;
      
      -- Create the trigger
      DROP TRIGGER IF EXISTS exec_sql_trigger ON _sql_exec;
      CREATE TRIGGER exec_sql_trigger
      BEFORE INSERT ON _sql_exec
      FOR EACH ROW
      EXECUTE FUNCTION execute_sql_on_insert();
      
      -- Grant permissions
      GRANT ALL ON TABLE _sql_exec TO authenticated;
      GRANT ALL ON TABLE _sql_exec TO service_role;
      GRANT USAGE ON SEQUENCE _sql_exec_id_seq TO authenticated;
      GRANT USAGE ON SEQUENCE _sql_exec_id_seq TO service_role;
      `;
      
      // Try to execute the alternative approach
      const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({
          query: createTempTableSQL
        })
      });
      
      if (!altResponse.ok) {
        const altErrorText = await altResponse.text();
        console.error('Failed to create alternative SQL execution mechanism');
        console.error('Response:', altErrorText);
        process.exit(1);
      }
      
      console.log('✓ Created alternative SQL execution mechanism via _sql_exec table');
      return;
    }
    
    console.log('✓ Successfully created exec_sql function');
    
    // Test the function
    console.log('Testing exec_sql function...');
    
    const testSQL = 'SELECT NOW() as current_time';
    const testResponse = await supabase.rpc('exec_sql', {
      sql: testSQL
    });
    
    if (testResponse.error) {
      console.error('Error testing exec_sql function:', testResponse.error);
    } else {
      console.log('✓ exec_sql function is working properly');
    }
    
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    process.exit(1);
  }
}

createExecSqlFunction();