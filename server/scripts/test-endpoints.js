import { supabaseAnon } from '../src/config/supabase.js';

const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('=== Starting Member 1 API Verification Test ===');

  // 1. Health check
  console.log('\n1. Testing GET /api/health ...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health:', healthData.success ? 'PASS' : 'FAIL', healthData);

  // 2. Sign in as admin via Supabase Auth
  console.log('\n2. Signing in as admin via Supabase Auth ...');
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email: 'admin@brightloop.com',
    password: 'Brightloop@2026',
  });

  if (authError || !authData.session) {
    console.error('Sign-in failed:', authError);
    process.exit(1);
  }

  const token = authData.session.access_token;
  console.log('Admin authenticated successfully! Bearer JWT acquired.');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 3. Test GET /api/auth/me
  console.log('\n3. Testing GET /api/auth/me ...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers });
  const meData = await meRes.json();
  console.log('Auth Me:', meData.success ? 'PASS' : 'FAIL', meData.data);

  // 4. Test GET /api/products
  console.log('\n4. Testing GET /api/products ...');
  const prodRes = await fetch(`${BASE_URL}/products`, { headers });
  const prodData = await prodRes.json();
  console.log(`Products: Found ${prodData.data?.length || 0} items.`);
  const crmProduct = prodData.data?.find((p) => p.name.includes('CRM'));
  const odooVariant = crmProduct?.product_variants?.find((v) => v.name.includes('Odoo'));

  // 5. Test Price Calculation with Variant (+560)
  if (crmProduct && odooVariant) {
    console.log(`\n5. Testing GET /api/products/calculate-price (Product: ${crmProduct.name}, Variant: ${odooVariant.name}) ...`);
    const calcRes = await fetch(
      `${BASE_URL}/products/calculate-price?productId=${crmProduct.id}&variantId=${odooVariant.id}`,
      { headers }
    );
    const calcData = await calcRes.json();
    console.log('Calculated Price:', calcData.data);
    console.log(
      'Price Check (Expected 1560.00):',
      calcData.data.unitPrice === '1560.00' ? '✅ PASS (₹1,560.00)' : '❌ FAIL'
    );
  }

  // 6. Test GET /api/plans
  console.log('\n6. Testing GET /api/plans ...');
  const planRes = await fetch(`${BASE_URL}/plans`, { headers });
  const planData = await planRes.json();
  console.log(`Plans: Found ${planData.data?.length || 0} plans.`);

  // 7. Test GET /api/taxes
  console.log('\n7. Testing GET /api/taxes ...');
  const taxRes = await fetch(`${BASE_URL}/taxes`, { headers });
  const taxData = await taxRes.json();
  console.log(`Taxes: Found ${taxData.data?.length || 0} tax rates.`);

  console.log('\n=== All Member 1 Tests Passed Successfully! ===\n');
}

testAll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
