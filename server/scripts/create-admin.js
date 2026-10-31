import { supabaseAdmin } from '../src/config/supabase.js';
import { validatePasswordStrength } from '../src/modules/users/service.js';

const email = process.argv[2] || 'admin@brightloop.com';
const password = process.argv[3] || 'Brightloop@2026';
const fullName = process.argv[4] || 'System Administrator';

async function createAdmin() {
  console.log(`[Admin Setup] Creating initial admin: ${email}`);

  if (!validatePasswordStrength(password)) {
    console.error('[Error] Password does not meet security requirements (min 9 chars, uppercase, lowercase, special character).');
    process.exit(1);
  }

  // 1. Check if user already exists
  const { data: existingProfiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', email);

  if (existingProfiles && existingProfiles.length > 0) {
    console.log(`[Notice] User ${email} already exists. Promoting role to 'admin'...`);
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', email);
    console.log(`[Success] User ${email} is now an admin!`);
    return;
  }

  // 2. Create in Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (authError) {
    console.error('[Auth Error]', authError.message);
    process.exit(1);
  }

  const userId = authUser.user.id;

  // 3. Upsert profile with admin role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      role: 'admin',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError) {
    console.error('[Profile Error]', profileError.message);
    process.exit(1);
  }

  console.log('====================================================');
  console.log('✅ Initial Administrator Created Successfully!');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${profile.role}`);
  console.log('====================================================');
}

createAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
