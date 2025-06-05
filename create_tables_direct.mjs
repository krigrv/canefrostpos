import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Creating missing tables directly...');

try {
  // First, let's check if tables exist
  console.log('Checking existing tables...');
  
  const { data: userProfiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
    
  if (profileError && profileError.code === 'PGRST106') {
    console.log('user_profiles table does not exist - this is expected');
  } else if (profileError) {
    console.log('user_profiles table check error:', profileError);
  } else {
    console.log('user_profiles table exists');
  }
  
  const { data: userSettings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .limit(1);
    
  if (settingsError && settingsError.code === 'PGRST106') {
    console.log('user_settings table does not exist - this is expected');
  } else if (settingsError) {
    console.log('user_settings table check error:', settingsError);
  } else {
    console.log('user_settings table exists');
  }
  
  // Since we can't execute DDL through the client, let's try to insert default data
  // and see what happens
  console.log('\nAttempting to create default user profile...');
  
  const userId = '03a63ae6-c36d-4685-879a-55146aa5f11d'; // From the error logs
  
  const { data: insertProfile, error: insertProfileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      business_details: {
        business_name: 'Canefrost POS',
        address: '',
        phone: '',
        email: ''
      }
    })
    .select();
    
  if (insertProfileError) {
    console.log('Profile insert error:', insertProfileError);
  } else {
    console.log('✓ User profile created:', insertProfile);
  }
  
  console.log('\nAttempting to create default user settings...');
  
  const { data: insertSettings, error: insertSettingsError } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      settings: {
        theme: 'light',
        currency: 'USD',
        tax_rate: 0,
        receipt_footer: ''
      }
    })
    .select();
    
  if (insertSettingsError) {
    console.log('Settings insert error:', insertSettingsError);
  } else {
    console.log('✓ User settings created:', insertSettings);
  }
  
} catch (error) {
  console.error('Script error:', error);
}

console.log('\nScript completed.');