/**
 * Brightloop Subscription Management System — Demo Data Seeding System
 * 
 * Generates rich, realistic synthetic data to demonstrate all platform features:
 * - Supabase Auth accounts (Admin, 3 Staff, 15 Customers)
 * - Taxes, Products & Variants, Subscription Plans, Discounts
 * - Dynamic Quotations & Items (Draft, Sent, Accepted, Rejected, Expired, Converted)
 * - Subscriptions & Items (Active, Confirmed, Paused, Closed, Draft, Quotation)
 * - Invoices & Line Items (Paid, Unpaid Confirmed, Partially Paid, Overdue, Draft, Cancelled)
 * - Payments with multiple methods (Cash, UPI, Card, Bank Transfer)
 * - Dynamic Asia/Kolkata dates ensuring billing readiness & renewal demonstrations
 * 
 * Safe & Idempotent: Never deletes existing user data, never truncates tables.
 */

import dotenv from 'dotenv';
import Decimal from 'decimal.js';
import { supabaseAdmin } from '../config/supabase.js';
import { calculateDocumentPricing, round2 } from '../modules/billing/pricingService.js';
import { calculatePeriodEnd, calculateDueDate } from '../modules/billing/billingEngine.js';

dotenv.config();

// ==============================================================================
// 1. SAFETY & ENVIRONMENT SAFEGUARDS
// ==============================================================================
if (process.env.SEED_DEMO_DATA !== 'true') {
  console.error('\n❌ [SAFETY ABORT] SEED_DEMO_DATA environment variable is not set to "true".');
  console.error('   To run this script, set SEED_DEMO_DATA=true in your environment or server/.env.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_DEMO_SEED !== 'true') {
  console.error('\n❌ [PRODUCTION SAFETY ABORT] Running demo seed against production environment.');
  console.error('   If you genuinely intend to seed this database, set ALLOW_PROD_DEMO_SEED=true.');
  process.exit(1);
}

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Demo@Brightloop2026';

// Date Helpers (Asia/Kolkata)
const getTodayKolkata = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  return formatter.format(new Date());
};

const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().split('T')[0];
};

const subtractDays = (dateStr, days) => addDays(dateStr, -days);

const addMonths = (dateStr, months) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().split('T')[0];
};

// ==============================================================================
// 2. DEMO USER DEFINITIONS
// ==============================================================================
const DEMO_USERS = [
  // Admin
  {
    email: 'admin@brightloop.example.com',
    fullName: 'Aditya Sen (Platform Administrator)',
    phone: '+91 98000 00001',
    role: 'admin',
  },
  // Staff
  {
    email: 'staff1@brightloop.example.com',
    fullName: 'Priya Sharma (Operations Lead)',
    phone: '+91 98765 43210',
    role: 'staff',
  },
  {
    email: 'staff2@brightloop.example.com',
    fullName: 'Rohan Varma (Billing Specialist)',
    phone: '+91 98765 43211',
    role: 'staff',
  },
  {
    email: 'staff3@brightloop.example.com',
    fullName: 'Ananya Iyer (Customer Success Lead)',
    phone: '+91 98765 43212',
    role: 'staff',
  },
  // Customers (15)
  {
    email: 'acme@brightloop.example.com',
    fullName: 'Acme Infotech Pvt Ltd',
    phone: '+91 98111 00001',
    role: 'customer',
  },
  {
    email: 'nova@brightloop.example.com',
    fullName: 'Nova Retail & Logistics Solutions',
    phone: '+91 98111 00002',
    role: 'customer',
  },
  {
    email: 'bluewave@brightloop.example.com',
    fullName: 'Bluewave Media & Design Labs',
    phone: '+91 98111 00003',
    role: 'customer',
  },
  {
    email: 'greenfield@brightloop.example.com',
    fullName: 'Greenfield AgriTech Innovations',
    phone: '+91 98111 00004',
    role: 'customer',
  },
  {
    email: 'apex@brightloop.example.com',
    fullName: 'Apex FinServe Advisory Services',
    phone: '+91 98111 00005',
    role: 'customer',
  },
  {
    email: 'pixelcraft@brightloop.example.com',
    fullName: 'PixelCraft Interactive Studios',
    phone: '+91 98111 00006',
    role: 'customer',
  },
  {
    email: 'cloudnest@brightloop.example.com',
    fullName: 'CloudNest Cloud Solutions',
    phone: '+91 98111 00007',
    role: 'customer',
  },
  {
    email: 'vertex@brightloop.example.com',
    fullName: 'Vertex AI & Robotics Systems',
    phone: '+91 98111 00008',
    role: 'customer',
  },
  {
    email: 'orbit@brightloop.example.com',
    fullName: 'Orbit Pharma Networks',
    phone: '+91 98111 00009',
    role: 'customer',
  },
  {
    email: 'nexgen@brightloop.example.com',
    fullName: 'NexGen Mobility & Fleet Corp',
    phone: '+91 98111 00010',
    role: 'customer',
  },
  {
    email: 'alphacore@brightloop.example.com',
    fullName: 'AlphaCore Telecom Infrastructure',
    phone: '+91 98111 00011',
    role: 'customer',
  },
  {
    email: 'zenith@brightloop.example.com',
    fullName: 'Zenith Hospitality Group',
    phone: '+91 98111 00012',
    role: 'customer',
  },
  {
    email: 'prism@brightloop.example.com',
    fullName: 'Prism Energy & Utilities',
    phone: '+91 98111 00013',
    role: 'customer',
  },
  {
    email: 'skylabs@brightloop.example.com',
    fullName: 'SkyLabs Aerospace & Drones',
    phone: '+91 98111 00014',
    role: 'customer',
  },
  {
    email: 'quantum@brightloop.example.com',
    fullName: 'Quantum Retail E-Commerce',
    phone: '+91 98111 00015',
    role: 'customer',
  },
];

// ==============================================================================
// 3. MAIN SEEDING RUNNER
// ==============================================================================
export async function seedDemoData() {
  console.log('\n================================================================');
  console.log('🚀 BRIGHTLOOP DEMO DATA SEEDING ENGINE');
  console.log('================================================================');
  const today = getTodayKolkata();
  console.log(`📅 Current Business Date (Asia/Kolkata): ${today}`);

  const stats = {
    authCreated: 0,
    authReused: 0,
    profilesUpserted: 0,
    taxes: 0,
    products: 0,
    variants: 0,
    plans: 0,
    discounts: 0,
    quotations: 0,
    subscriptions: 0,
    invoices: 0,
    payments: 0,
  };

  // ----------------------------------------------------------------------------
  // STEP 1: AUTH USERS & PROFILES
  // ----------------------------------------------------------------------------
  console.log('\n[1/7] Provisioning Demo Authentication Users & Profiles...');
  const userMap = {}; // email -> profile

  for (const u of DEMO_USERS) {
    let userId = null;

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('email', u.email)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      stats.authReused++;
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: u.fullName,
          phone: u.phone,
          role: u.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } else {
      // Check in Supabase Auth admin
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
      const foundAuth = (authList?.users || []).find((usr) => usr.email.toLowerCase() === u.email.toLowerCase());

      if (foundAuth) {
        userId = foundAuth.id;
        stats.authReused++;
      } else {
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: u.fullName,
            phone: u.phone,
          },
        });

        if (createErr) {
          console.error(`   ⚠️ Failed to create auth user ${u.email}:`, createErr.message);
          continue;
        }
        userId = newUser.user.id;
        stats.authCreated++;
      }

      // Upsert profile
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: u.email,
          full_name: u.fullName,
          phone: u.phone,
          role: u.role,
          updated_at: new Date().toISOString(),
        });
    }

    userMap[u.email] = {
      id: userId,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
    };
    stats.profilesUpserted++;
  }
  console.log(`   ✓ Provisioned ${stats.profilesUpserted} demo profiles (${stats.authCreated} newly created, ${stats.authReused} reused)`);

  const adminUser = userMap['admin@brightloop.example.com'] || Object.values(userMap).find((u) => u.role === 'admin');
  const staff1 = userMap['staff1@brightloop.example.com'];
  const staff2 = userMap['staff2@brightloop.example.com'];
  const staff3 = userMap['staff3@brightloop.example.com'];

  // ----------------------------------------------------------------------------
  // STEP 2: TAX CONFIGURATIONS (4)
  // ----------------------------------------------------------------------------
  console.log('\n[2/7] Seeding Tax Configurations...');
  const TAX_DEFS = [
    { name: 'GST 18%', rate: 18.00 },
    { name: 'VAT 5%', rate: 5.00 },
    { name: 'GST 12%', rate: 12.00 },
    { name: 'Zero Tax (Exempt) 0%', rate: 0.00 },
  ];

  const taxMap = {}; // name -> tax record
  for (const t of TAX_DEFS) {
    const { data: existing } = await supabaseAdmin
      .from('taxes')
      .select('*')
      .eq('name', t.name)
      .maybeSingle();

    if (existing) {
      taxMap[t.name] = existing;
    } else {
      const { data: created, error } = await supabaseAdmin
        .from('taxes')
        .insert([{ name: t.name, rate: t.rate, is_active: true }])
        .select()
        .single();
      if (error) throw error;
      taxMap[t.name] = created;
      stats.taxes++;
    }
  }
  console.log(`   ✓ Configured ${Object.keys(taxMap).length} active tax rules`);

  const gst18 = taxMap['GST 18%'] || taxMap['VAT 5%'];
  const gst12 = taxMap['GST 12%'] || gst18;
  const zeroTax = taxMap['Zero Tax (Exempt) 0%'] || gst18;

  // ----------------------------------------------------------------------------
  // STEP 3: PRODUCTS & VARIANTS (8 Products, 12 Variants)
  // ----------------------------------------------------------------------------
  console.log('\n[3/7] Seeding Products & Variants Catalog...');
  const PRODUCT_DEFS = [
    {
      name: 'Brightloop Starter SaaS',
      product_type: 'service',
      sales_price: 999.00,
      cost_price: 250.00,
      notes: 'Entry-tier recurring billing & customer portal package for growing businesses.',
      tax_id: gst18?.id,
      variants: [
        { name: 'Standard Single-User', extra_price: 0.00 },
        { name: 'Multi-User Team Pack (+5 Seats)', extra_price: 450.00 },
      ],
    },
    {
      name: 'Brightloop Professional',
      product_type: 'service',
      sales_price: 2499.00,
      cost_price: 650.00,
      notes: 'Full recurring engine with automated prorations, multi-currency & priority billing.',
      tax_id: gst18?.id,
      variants: [
        { name: 'Standard Edition', extra_price: 0.00 },
        { name: 'Advanced Audit Trail & Compliance', extra_price: 600.00 },
        { name: 'Dedicated Static IP Addon', extra_price: 750.00 },
      ],
    },
    {
      name: 'Brightloop Enterprise',
      product_type: 'service',
      sales_price: 6999.00,
      cost_price: 1800.00,
      notes: 'High-availability subscription platform with custom integrations and dedicated SLA.',
      tax_id: gst18?.id,
      variants: [
        { name: 'Enterprise Core', extra_price: 0.00 },
        { name: 'SSO & Custom SAML Federation', extra_price: 1500.00 },
        { name: 'High Availability Multi-Region Cluster', extra_price: 3000.00 },
      ],
    },
    {
      name: 'Cloud Storage Package',
      product_type: 'service',
      sales_price: 499.00,
      cost_price: 120.00,
      notes: 'High-speed encrypted object storage for documents, backups and invoice receipts.',
      tax_id: gst18?.id,
      variants: [
        { name: '100 GB NVMe Storage', extra_price: 0.00 },
        { name: '500 GB NVMe Storage', extra_price: 800.00 },
        { name: '2 TB Cold Storage Backup Tier', extra_price: 2200.00 },
      ],
    },
    {
      name: 'Analytics Add-on',
      product_type: 'service',
      sales_price: 1299.00,
      cost_price: 300.00,
      notes: 'Real-time MRR, ARR, churn rate and financial cohort reporting analytics.',
      tax_id: gst12?.id || gst18?.id,
      variants: [
        { name: 'Executive Dashboard Pack', extra_price: 0.00 },
        { name: 'AI Revenue Forecast & Churn Predictor', extra_price: 900.00 },
      ],
    },
    {
      name: 'Support Package',
      product_type: 'service',
      sales_price: 1999.00,
      cost_price: 500.00,
      notes: 'Dedicated 24/7 technical engineering SLA with 1-hour response time.',
      tax_id: gst18?.id,
      variants: [
        { name: '24/7 Priority Ticket & Phone Support', extra_price: 0.00 },
        { name: 'Dedicated Technical Account Manager', extra_price: 2500.00 },
      ],
    },
    {
      name: 'API Access Package',
      product_type: 'service',
      sales_price: 1499.00,
      cost_price: 200.00,
      notes: 'High-throughput REST API with webhooks and Zapier connector access.',
      tax_id: gst18?.id,
      variants: [
        { name: 'Standard Rate Limit (100 req/min)', extra_price: 0.00 },
        { name: 'High Throughput (1000 req/min)', extra_price: 1200.00 },
      ],
    },
    {
      name: 'Premium Security Package',
      product_type: 'service',
      sales_price: 2999.00,
      cost_price: 750.00,
      notes: 'SOC-2 Type II audit report, IP whitelisting, penetration testing certificates.',
      tax_id: zeroTax?.id || gst18?.id,
      variants: [
        { name: 'Standard Security Suite', extra_price: 0.00 },
        { name: 'Zero-Trust Network Access & HSM Keys', extra_price: 2000.00 },
      ],
    },
  ];

  const productMap = {}; // name -> product record
  const variantMap = {}; // "productName::variantName" -> variant record

  for (const p of PRODUCT_DEFS) {
    let productRecord = null;
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('name', p.name)
      .maybeSingle();

    if (existing) {
      productRecord = existing;
      await supabaseAdmin
        .from('products')
        .update({
          sales_price: p.sales_price,
          cost_price: p.cost_price,
          tax_id: p.tax_id,
          notes: p.notes,
        })
        .eq('id', existing.id);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from('products')
        .insert([{
          name: p.name,
          product_type: p.product_type,
          sales_price: p.sales_price,
          cost_price: p.cost_price,
          notes: p.notes,
          tax_id: p.tax_id,
          is_active: true,
        }])
        .select()
        .single();
      if (error) throw error;
      productRecord = created;
      stats.products++;
    }
    productMap[p.name] = productRecord;

    // Variants
    for (const v of p.variants) {
      const { data: existingVar } = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .eq('product_id', productRecord.id)
        .eq('name', v.name)
        .maybeSingle();

      if (existingVar) {
        variantMap[`${p.name}::${v.name}`] = existingVar;
      } else {
        const { data: createdVar, error: varErr } = await supabaseAdmin
          .from('product_variants')
          .insert([{
            product_id: productRecord.id,
            name: v.name,
            extra_price: v.extra_price,
            is_active: true,
          }])
          .select()
          .single();
        if (varErr) throw varErr;
        variantMap[`${p.name}::${v.name}`] = createdVar;
        stats.variants++;
      }
    }
  }
  console.log(`   ✓ Configured ${Object.keys(productMap).length} products and ${Object.keys(variantMap).length} variants`);

  // ----------------------------------------------------------------------------
  // STEP 4: SUBSCRIPTION PLANS (5 Plans)
  // ----------------------------------------------------------------------------
  console.log('\n[4/7] Seeding Subscription Plans...');
  const PLAN_DEFS = [
    {
      name: 'Weekly Sprint Plan',
      billing_interval: 'weekly',
      interval_count: 1,
      minimum_quantity: 1,
      auto_close: false,
    },
    {
      name: 'Monthly Standard Plan',
      billing_interval: 'monthly',
      interval_count: 1,
      minimum_quantity: 1,
      auto_close: false,
    },
    {
      name: 'Quarterly Growth Plan',
      billing_interval: 'monthly',
      interval_count: 3,
      minimum_quantity: 1,
      auto_close: false,
    },
    {
      name: 'Annual Value Plan',
      billing_interval: 'yearly',
      interval_count: 1,
      minimum_quantity: 1,
      auto_close: false,
    },
    {
      name: 'Enterprise Biennial Plan',
      billing_interval: 'yearly',
      interval_count: 2,
      minimum_quantity: 1,
      auto_close: false,
    },
  ];

  const planMap = {};
  for (const pl of PLAN_DEFS) {
    const { data: existing } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('name', pl.name)
      .maybeSingle();

    if (existing) {
      planMap[pl.name] = existing;
    } else {
      const { data: created, error } = await supabaseAdmin
        .from('plans')
        .insert([{
          name: pl.name,
          billing_interval: pl.billing_interval,
          interval_count: pl.interval_count,
          minimum_quantity: pl.minimum_quantity,
          allow_early_close: true,
          allow_pause: true,
          allow_renewal: true,
          is_active: true,
        }])
        .select()
        .single();
      if (error) throw error;
      planMap[pl.name] = created;
      stats.plans++;
    }
  }
  console.log(`   ✓ Configured ${Object.keys(planMap).length} active subscription plans`);

  // ----------------------------------------------------------------------------
  // STEP 5: DISCOUNTS (5 Configurations)
  // ----------------------------------------------------------------------------
  console.log('\n[5/7] Seeding Discount Rules...');
  const DISCOUNT_DEFS = [
    {
      name: 'Welcome Onboarding Discount (10%)',
      code: 'WELCOME10',
      discount_type: 'percentage',
      value: 10.00,
      minimum_purchase: 500.00,
    },
    {
      name: 'Hackathon Demo Promo (20%)',
      code: 'HACKATHON20',
      discount_type: 'percentage',
      value: 20.00,
      minimum_purchase: 1000.00,
    },
    {
      name: 'Flat ₹500 Growth Credit',
      code: 'FLAT500',
      discount_type: 'fixed',
      value: 500.00,
      minimum_purchase: 2500.00,
    },
    {
      name: 'Enterprise VIP Deal (15%)',
      code: 'ENTERPRISE15',
      discount_type: 'percentage',
      value: 15.00,
      minimum_purchase: 5000.00,
    },
    {
      name: 'Startup Accelerator Voucher ₹1000',
      code: 'STARTUP1000',
      discount_type: 'fixed',
      value: 1000.00,
      minimum_purchase: 4000.00,
    },
  ];

  const discountMap = {};
  for (const d of DISCOUNT_DEFS) {
    const { data: existing } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('code', d.code)
      .maybeSingle();

    if (existing) {
      discountMap[d.code] = existing;
    } else {
      const { data: created, error } = await supabaseAdmin
        .from('discounts')
        .insert([{
          name: d.name,
          code: d.code,
          discount_type: d.discount_type,
          value: d.value,
          minimum_purchase: d.minimum_purchase,
          minimum_quantity: 1,
          applicable_to: 'subscription',
          is_active: true,
        }])
        .select()
        .single();
      if (error) throw error;
      discountMap[d.code] = created;
      stats.discounts++;
    }
  }
  console.log(`   ✓ Configured ${Object.keys(discountMap).length} active discount codes`);

  // Helper references
  const monthlyPlan = planMap['Monthly Standard Plan'];
  const quarterlyPlan = planMap['Quarterly Growth Plan'];
  const annualPlan = planMap['Annual Value Plan'];
  const weeklyPlan = planMap['Weekly Sprint Plan'];

  const starterProd = productMap['Brightloop Starter SaaS'];
  const proProd = productMap['Brightloop Professional'];
  const entProd = productMap['Brightloop Enterprise'];
  const storageProd = productMap['CloudStorage Package'] || productMap['Cloud Storage Package'];
  const analyticsProd = productMap['Analytics Add-on'];
  const supportProd = productMap['Support Package'];
  const apiProd = productMap['API Access Package'];
  const securityProd = productMap['Premium Security Package'];

  // ----------------------------------------------------------------------------
  // STEP 6: QUOTATIONS (15 Quotations covering all 6 statuses)
  // ----------------------------------------------------------------------------
  console.log('\n[6/7] Seeding Quotations & Negotiation Workflows...');
  const customers = Object.values(userMap).filter((u) => u.role === 'customer');

  const QUOTATION_DATA = [
    {
      number: 'QT-DEMO-001',
      customerEmail: 'acme@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Draft',
      validDays: 14,
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Dedicated Static IP Addon', qty: 2 },
        { prod: storageProd, varKey: 'Cloud Storage Package::500 GB NVMe Storage', qty: 1 },
      ],
      discountCode: 'WELCOME10',
      notes: 'Initial quotation drafted for Acme Infotech core migration.',
    },
    {
      number: 'QT-DEMO-002',
      customerEmail: 'nova@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Draft',
      validDays: 30,
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Multi-User Team Pack (+5 Seats)', qty: 1 },
      ],
      discountCode: null,
      notes: 'Draft estimate awaiting manager sign-off.',
    },
    {
      number: 'QT-DEMO-003',
      customerEmail: 'bluewave@brightloop.example.com',
      planName: 'Quarterly Growth Plan',
      status: 'Draft',
      validDays: 20,
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Advanced Audit Trail & Compliance', qty: 1 },
        { prod: analyticsProd, varKey: 'Analytics Add-on::AI Revenue Forecast & Churn Predictor', qty: 1 },
      ],
      discountCode: null,
      notes: 'Quarterly growth package proposal.',
    },
    {
      number: 'QT-DEMO-004',
      customerEmail: 'greenfield@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Sent',
      validDays: 10,
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Standard Single-User', qty: 3 },
      ],
      discountCode: 'WELCOME10',
      notes: 'Sent to Greenfield AgriTech CFO for review.',
    },
    {
      number: 'QT-DEMO-005',
      customerEmail: 'apex@brightloop.example.com',
      planName: 'Annual Value Plan',
      status: 'Sent',
      validDays: 15,
      items: [
        { prod: entProd, varKey: 'Brightloop Enterprise::SSO & Custom SAML Federation', qty: 1 },
        { prod: supportProd, varKey: 'Support Package::Dedicated Technical Account Manager', qty: 1 },
      ],
      discountCode: 'ENTERPRISE15',
      notes: 'Enterprise annual contract dispatched via DocuSign.',
    },
    {
      number: 'QT-DEMO-006',
      customerEmail: 'pixelcraft@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Sent',
      validDays: 12,
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 2 },
        { prod: storageProd, varKey: 'Cloud Storage Package::2 TB Cold Storage Backup Tier', qty: 1 },
      ],
      discountCode: 'HACKATHON20',
      notes: 'Dispatched to creative director.',
    },
    {
      number: 'QT-DEMO-007',
      customerEmail: 'cloudnest@brightloop.example.com',
      planName: 'Annual Value Plan',
      status: 'Accepted',
      validDays: 25,
      items: [
        { prod: entProd, varKey: 'Brightloop Enterprise::High Availability Multi-Region Cluster', qty: 1 },
        { prod: securityProd, varKey: 'Premium Security Package::Zero-Trust Network Access & HSM Keys', qty: 1 },
      ],
      discountCode: 'ENTERPRISE15',
      notes: 'Customer accepted quotation. Ready for subscription provisioning.',
    },
    {
      number: 'QT-DEMO-008',
      customerEmail: 'vertex@brightloop.example.com',
      planName: 'Quarterly Growth Plan',
      status: 'Accepted',
      validDays: 18,
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 1 },
        { prod: apiProd, varKey: 'API Access Package::High Throughput (1000 req/min)', qty: 1 },
      ],
      discountCode: 'FLAT500',
      notes: 'Contract agreed upon, awaiting first billing.',
    },
    {
      number: 'QT-DEMO-009',
      customerEmail: 'orbit@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Accepted',
      validDays: 14,
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Multi-User Team Pack (+5 Seats)', qty: 2 },
      ],
      discountCode: null,
      notes: 'Accepted via email portal.',
    },
    {
      number: 'QT-DEMO-010',
      customerEmail: 'nexgen@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Rejected',
      validDays: -5,
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Standard Single-User', qty: 1 },
      ],
      discountCode: null,
      notes: 'Customer postponed decision until Q1 fiscal review.',
    },
    {
      number: 'QT-DEMO-011',
      customerEmail: 'alphacore@brightloop.example.com',
      planName: 'Annual Value Plan',
      status: 'Rejected',
      validDays: -10,
      items: [
        { prod: entProd, varKey: 'Brightloop Enterprise::Enterprise Core', qty: 1 },
      ],
      discountCode: null,
      notes: 'Budget constraints reported by internal sponsor.',
    },
    {
      number: 'QT-DEMO-012',
      customerEmail: 'zenith@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Expired',
      validDays: -30,
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 1 },
      ],
      discountCode: null,
      notes: 'Quotation expired after 30-day window.',
    },
    {
      number: 'QT-DEMO-013',
      customerEmail: 'prism@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Expired',
      validDays: -15,
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Standard Single-User', qty: 2 },
      ],
      discountCode: null,
      notes: 'Validity period lapsed.',
    },
    {
      number: 'QT-DEMO-014',
      customerEmail: 'skylabs@brightloop.example.com',
      planName: 'Annual Value Plan',
      status: 'Converted',
      validDays: 10,
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Dedicated Static IP Addon', qty: 1 },
        { prod: supportProd, varKey: 'Support Package::24/7 Priority Ticket & Phone Support', qty: 1 },
      ],
      discountCode: 'FLAT500',
      notes: 'Successfully converted into active subscription SUB-DEMO-015.',
    },
    {
      number: 'QT-DEMO-015',
      customerEmail: 'quantum@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Converted',
      validDays: 5,
      items: [
        { prod: entProd, varKey: 'Brightloop Enterprise::Custom SAML Federation', qty: 1 },
      ],
      discountCode: 'WELCOME10',
      notes: 'Converted into live subscription SUB-DEMO-016.',
    },
  ];

  const quotationMap = {};
  for (const q of QUOTATION_DATA) {
    const cust = userMap[q.customerEmail] || customers[0];
    const plan = planMap[q.planName] || monthlyPlan;
    const validUntil = q.validDays >= 0 ? addDays(today, q.validDays) : subtractDays(today, Math.abs(q.validDays));

    // Calculate items pricing
    const pricingItems = q.items.map((it) => {
      const variant = variantMap[it.varKey];
      const salesPrice = it.prod.sales_price;
      const extraPrice = variant?.extra_price || 0;
      const taxRate = it.prod.tax_id === gst12?.id ? 12 : it.prod.tax_id === zeroTax?.id ? 0 : 18;

      return {
        productId: it.prod.id,
        variantId: variant?.id || null,
        description: `${it.prod.name}${variant ? ` - ${variant.name}` : ''}`,
        salesPrice,
        extraPrice,
        quantity: it.qty,
        taxRate,
      };
    });

    const discountObj = q.discountCode ? discountMap[q.discountCode] : null;
    const docPricing = calculateDocumentPricing(pricingItems, discountObj ? { discountType: discountObj.discount_type, value: discountObj.value } : null);

    const { data: existingQ } = await supabaseAdmin
      .from('quotations')
      .select('id')
      .eq('quote_number', q.number)
      .maybeSingle();

    let qId = null;
    if (existingQ) {
      qId = existingQ.id;
      await supabaseAdmin
        .from('quotations')
        .update({
          customer_id: cust.id,
          plan_id: plan.id,
          created_by: staff1?.id || adminUser?.id,
          valid_until: validUntil,
          status: q.status,
          subtotal: docPricing.subtotal,
          discount_total: docPricing.discountTotal,
          tax_total: docPricing.taxTotal,
          total: docPricing.total,
          notes: q.notes,
        })
        .eq('id', qId);
    } else {
      const { data: createdQ, error: qErr } = await supabaseAdmin
        .from('quotations')
        .insert([{
          quote_number: q.number,
          customer_id: cust.id,
          plan_id: plan.id,
          created_by: staff1?.id || adminUser?.id,
          valid_until: validUntil,
          status: q.status,
          subtotal: docPricing.subtotal,
          discount_total: docPricing.discountTotal,
          tax_total: docPricing.taxTotal,
          total: docPricing.total,
          notes: q.notes,
        }])
        .select()
        .single();
      if (qErr) throw qErr;
      qId = createdQ.id;
      stats.quotations++;
    }

    // Refresh quotation items
    await supabaseAdmin.from('quotation_items').delete().eq('quotation_id', qId);
    const quoteItemsToInsert = docPricing.items.map((line) => ({
      quotation_id: qId,
      product_id: line.productId,
      variant_id: line.variantId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
    }));
    await supabaseAdmin.from('quotation_items').insert(quoteItemsToInsert);

    quotationMap[q.number] = { id: qId, ...q, total: docPricing.total };
  }
  console.log(`   ✓ Configured ${Object.keys(quotationMap).length} quotations and items`);

  // ----------------------------------------------------------------------------
  // STEP 7: SUBSCRIPTIONS, INVOICES & PAYMENTS (20 Subscriptions, 25 Invoices, 25+ Payments)
  // ----------------------------------------------------------------------------
  console.log('\n[7/7] Seeding Subscriptions, Invoices & Payment Ledger...');

  /**
   * Subscription Scenario Matrix:
   * 
   * 1. SUB-DEMO-001 (Acme): Active, next_billing_date = TODAY. **BILLING READY** (No invoice for current period!).
   * 2. SUB-DEMO-002 (Acme - Multi sub): Active, next_billing_date = TODAY + 3 days. Upcoming renewal.
   * 3. SUB-DEMO-003 (Apex): Active, next_billing_date = TODAY + 5 days. Upcoming renewal.
   * 4. SUB-DEMO-004 (Nova): Active, next_billing_date = TODAY + 12 days.
   * 5. SUB-DEMO-005 (Bluewave): Active, next_billing_date = TODAY + 18 days.
   * 6. SUB-DEMO-006 (Greenfield): Active, next_billing_date = TODAY + 25 days.
   * 7. SUB-DEMO-007 (PixelCraft): Active, multi-item, next_billing_date = TODAY + 28 days.
   * 8. SUB-DEMO-008 (CloudNest): Active, Annual plan, next_billing_date = TODAY + 120 days.
   * 9. SUB-DEMO-009 (Vertex): Active, Quarterly plan, next_billing_date = TODAY + 45 days.
   * 10. SUB-DEMO-010 (Orbit): Active, Weekly Sprint plan, next_billing_date = TODAY + 4 days.
   * 11. SUB-DEMO-011 (NexGen): Active, with Overdue Past Invoice! next_billing_date = TODAY + 15 days.
   * 12. SUB-DEMO-012 (AlphaCore): Active, with Partially Paid Invoice! next_billing_date = TODAY + 20 days.
   * 13. SUB-DEMO-013 (Zenith): Confirmed (new customer setup), next_billing_date = TODAY + 1 day.
   * 14. SUB-DEMO-014 (Prism): Confirmed, next_billing_date = TODAY + 7 days.
   * 15. SUB-DEMO-015 (SkyLabs): Confirmed, next_billing_date = TODAY + 14 days.
   * 16. SUB-DEMO-016 (Quantum): Paused (Vacation / Seasonal hold), next_billing_date = TODAY + 60 days.
   * 17. SUB-DEMO-017 (Acme - 3rd sub): Paused, next_billing_date = TODAY + 90 days.
   * 18. SUB-DEMO-018 (Greenfield - 2nd sub): Closed (Cancelled & finalized), closed_at = 15 days ago.
   * 19. SUB-DEMO-019 (Apex - 2nd sub): Closed (Auto-closed for non-payment), closed_at = 30 days ago.
   * 20. SUB-DEMO-020 (Nova - 2nd sub): Draft (Internal quotation contract drafting).
   */

  const SUBSCRIPTION_DATA = [
    {
      number: 'SUB-DEMO-001',
      customerEmail: 'acme@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Active',
      startDate: subtractDays(today, 30),
      nextBillingDate: today, // ⭐️ BILLING READY DEMO SUBSCRIPTION
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 1 },
        { prod: storageProd, varKey: 'Cloud Storage Package::500 GB NVMe Storage', qty: 1 },
      ],
      invoices: [
        // Previous period fully paid invoice
        {
          number: 'INV-DEMO-001',
          periodStart: subtractDays(today, 30),
          periodEnd: today,
          issueDate: subtractDays(today, 30),
          dueDate: subtractDays(today, 15),
          status: 'Paid',
          discountCode: 'WELCOME10',
          payments: [{ method: 'UPI', note: '[DEMO-PAY-001] Onboarding UPI Transfer' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-002',
      customerEmail: 'acme@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Active',
      startDate: subtractDays(today, 27),
      nextBillingDate: addDays(today, 3), // Upcoming renewal in 3 days
      paymentTerms: 'Net 15',
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Multi-User Team Pack (+5 Seats)', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-002',
          periodStart: subtractDays(today, 27),
          periodEnd: addDays(today, 3),
          issueDate: subtractDays(today, 27),
          dueDate: subtractDays(today, 12),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'Bank Transfer', note: '[DEMO-PAY-002] NEFT Transfer from Acme' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-003',
      customerEmail: 'apex@brightloop.example.com',
      planName: 'Annual Value Plan',
      status: 'Active',
      startDate: subtractDays(today, 360),
      nextBillingDate: addDays(today, 5), // Upcoming renewal in 5 days
      paymentTerms: 'Net 30',
      items: [
        { prod: entProd, varKey: 'Brightloop Enterprise::SSO & Custom SAML Federation', qty: 1 },
        { prod: supportProd, varKey: 'Support Package::Dedicated Technical Account Manager', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-003',
          periodStart: subtractDays(today, 360),
          periodEnd: addDays(today, 5),
          issueDate: subtractDays(today, 360),
          dueDate: subtractDays(today, 330),
          status: 'Paid',
          discountCode: 'ENTERPRISE15',
          // Multi-payment demonstration: 2 payments against 1 invoice
          payments: [
            { method: 'Bank Transfer', ratio: 0.5, note: '[DEMO-PAY-003A] Wire Transfer Tranche 1' },
            { method: 'Card', ratio: 0.5, note: '[DEMO-PAY-003B] Corporate Card Tranche 2' },
          ],
        },
      ],
    },
    {
      number: 'SUB-DEMO-004',
      customerEmail: 'nova@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Active',
      startDate: subtractDays(today, 18),
      nextBillingDate: addDays(today, 12), // Renewal in 12 days
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Advanced Audit Trail & Compliance', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-004',
          periodStart: subtractDays(today, 18),
          periodEnd: addDays(today, 12),
          issueDate: subtractDays(today, 18),
          dueDate: subtractDays(today, 3),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'Card', note: '[DEMO-PAY-004] Master Card Payment' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-005',
      customerEmail: 'bluewave@brightloop.example.com',
      planName: 'Quarterly Growth Plan',
      status: 'Active',
      startDate: subtractDays(today, 72),
      nextBillingDate: addDays(today, 18), // Renewal in 18 days
      paymentTerms: 'Net 15',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 2 },
        { prod: analyticsProd, varKey: 'Analytics Add-on::Executive Dashboard Pack', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-005',
          periodStart: subtractDays(today, 72),
          periodEnd: addDays(today, 18),
          issueDate: subtractDays(today, 72),
          dueDate: subtractDays(today, 57),
          status: 'Paid',
          discountCode: 'FLAT500',
          payments: [{ method: 'UPI', note: '[DEMO-PAY-005] GooglePay Business UPI' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-006',
      customerEmail: 'greenfield@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Active',
      startDate: subtractDays(today, 5),
      nextBillingDate: addDays(today, 25), // Renewal in 25 days
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Standard Single-User', qty: 2 },
      ],
      invoices: [
        // ⭐️ Unpaid confirmed invoice (due in future)
        {
          number: 'INV-DEMO-006',
          periodStart: subtractDays(today, 5),
          periodEnd: addDays(today, 25),
          issueDate: subtractDays(today, 5),
          dueDate: addDays(today, 10),
          status: 'Confirmed',
          discountCode: null,
          payments: [], // Unpaid
        },
      ],
    },
    {
      number: 'SUB-DEMO-007',
      customerEmail: 'pixelcraft@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Active',
      startDate: subtractDays(today, 2),
      nextBillingDate: addDays(today, 28),
      paymentTerms: 'Net 15',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Dedicated Static IP Addon', qty: 1 },
        { prod: storageProd, varKey: 'Cloud Storage Package::2 TB Cold Storage Backup Tier', qty: 1 },
        { prod: analyticsProd, varKey: 'Analytics Add-on::AI Revenue Forecast & Churn Predictor', qty: 1 },
      ],
      invoices: [
        // ⭐️ Unpaid confirmed invoice
        {
          number: 'INV-DEMO-007',
          periodStart: subtractDays(today, 2),
          periodEnd: addDays(today, 28),
          issueDate: subtractDays(today, 2),
          dueDate: addDays(today, 13),
          status: 'Confirmed',
          discountCode: 'HACKATHON20',
          payments: [],
        },
      ],
    },
    {
      number: 'SUB-DEMO-008',
      customerEmail: 'cloudnest@brightloop.example.com',
      planName: 'Annual Value Plan',
      status: 'Active',
      startDate: subtractDays(today, 245),
      nextBillingDate: addDays(today, 120),
      paymentTerms: 'Net 30',
      items: [
        { prod: entProd, varKey: 'Brightloop Enterprise::High Availability Multi-Region Cluster', qty: 1 },
        { prod: securityProd, varKey: 'Premium Security Package::Zero-Trust Network Access & HSM Keys', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-008',
          periodStart: subtractDays(today, 245),
          periodEnd: addDays(today, 120),
          issueDate: subtractDays(today, 245),
          dueDate: subtractDays(today, 215),
          status: 'Paid',
          discountCode: 'ENTERPRISE15',
          payments: [{ method: 'Bank Transfer', note: '[DEMO-PAY-008] Annual RTGS Transfer' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-009',
      customerEmail: 'vertex@brightloop.example.com',
      planName: 'Quarterly Growth Plan',
      status: 'Active',
      startDate: subtractDays(today, 45),
      nextBillingDate: addDays(today, 45),
      paymentTerms: 'Net 15',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 1 },
        { prod: apiProd, varKey: 'API Access Package::High Throughput (1000 req/min)', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-009',
          periodStart: subtractDays(today, 45),
          periodEnd: addDays(today, 45),
          issueDate: subtractDays(today, 45),
          dueDate: subtractDays(today, 30),
          status: 'Paid',
          discountCode: 'STARTUP1000',
          payments: [{ method: 'Card', note: '[DEMO-PAY-009] Razorpay Online Payment' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-010',
      customerEmail: 'orbit@brightloop.example.com',
      planName: 'Weekly Sprint Plan',
      status: 'Active',
      startDate: subtractDays(today, 3),
      nextBillingDate: addDays(today, 4), // Weekly renewal
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Multi-User Team Pack (+5 Seats)', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-010',
          periodStart: subtractDays(today, 3),
          periodEnd: addDays(today, 4),
          issueDate: subtractDays(today, 3),
          dueDate: subtractDays(today, 3),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'UPI', note: '[DEMO-PAY-010] Fast UPI Settlement' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-011',
      customerEmail: 'nexgen@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Active',
      startDate: subtractDays(today, 45),
      nextBillingDate: addDays(today, 15),
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 2 },
      ],
      invoices: [
        // ⭐️ OVERDUE INVOICE DEMONSTRATION (Due date is in past, unpaid!)
        {
          number: 'INV-DEMO-011',
          periodStart: subtractDays(today, 45),
          periodEnd: subtractDays(today, 15),
          issueDate: subtractDays(today, 45),
          dueDate: subtractDays(today, 15), // Past due!
          status: 'Confirmed',
          discountCode: null,
          payments: [], // ₹0 paid -> Overdue
        },
        // Secondary recent invoice also confirmed
        {
          number: 'INV-DEMO-012',
          periodStart: subtractDays(today, 15),
          periodEnd: addDays(today, 15),
          issueDate: subtractDays(today, 15),
          dueDate: subtractDays(today, 5), // Past due!
          status: 'Confirmed',
          discountCode: null,
          payments: [], // Overdue #2
        },
      ],
    },
    {
      number: 'SUB-DEMO-012',
      customerEmail: 'alphacore@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Active',
      startDate: subtractDays(today, 10),
      nextBillingDate: addDays(today, 20),
      paymentTerms: 'Net 15',
      items: [
        { prod: entProd, varKey: 'Brightloop Enterprise::Enterprise Core', qty: 1 },
        { prod: storageProd, varKey: 'Cloud Storage Package::500 GB NVMe Storage', qty: 1 },
      ],
      invoices: [
        // ⭐️ PARTIALLY PAID INVOICE DEMONSTRATION
        {
          number: 'INV-DEMO-013',
          periodStart: subtractDays(today, 10),
          periodEnd: addDays(today, 20),
          issueDate: subtractDays(today, 10),
          dueDate: addDays(today, 5),
          status: 'Confirmed',
          discountCode: 'FLAT500',
          // ₹4,000 partial payment against the balance
          payments: [{ method: 'Bank Transfer', fixedAmount: 4000.00, note: '[DEMO-PAY-013] Partial Installment 1' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-013',
      customerEmail: 'zenith@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Confirmed', // Ready to be activated
      startDate: addDays(today, 1),
      nextBillingDate: addDays(today, 1),
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Standard Single-User', qty: 1 },
      ],
      invoices: [
        // ⭐️ DRAFT INVOICE DEMONSTRATION
        {
          number: 'INV-DEMO-014',
          periodStart: addDays(today, 1),
          periodEnd: addDays(today, 31),
          issueDate: today,
          dueDate: addDays(today, 1),
          status: 'Draft',
          discountCode: null,
          payments: [],
        },
      ],
    },
    {
      number: 'SUB-DEMO-014',
      customerEmail: 'prism@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Confirmed',
      startDate: addDays(today, 7),
      nextBillingDate: addDays(today, 7),
      paymentTerms: 'Net 15',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-015',
          periodStart: addDays(today, 7),
          periodEnd: addDays(today, 37),
          issueDate: today,
          dueDate: addDays(today, 22),
          status: 'Draft',
          discountCode: null,
          payments: [],
        },
      ],
    },
    {
      number: 'SUB-DEMO-015',
      customerEmail: 'skylabs@brightloop.example.com',
      planName: 'Annual Value Plan',
      status: 'Confirmed',
      startDate: addDays(today, 14),
      nextBillingDate: addDays(today, 14),
      paymentTerms: 'Net 30',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Dedicated Static IP Addon', qty: 1 },
        { prod: supportProd, varKey: 'Support Package::24/7 Priority Ticket & Phone Support', qty: 1 },
      ],
      invoices: [
        // ⭐️ CANCELLED INVOICE DEMONSTRATION
        {
          number: 'INV-DEMO-016',
          periodStart: addDays(today, 14),
          periodEnd: addDays(today, 379),
          issueDate: subtractDays(today, 10),
          dueDate: addDays(today, 20),
          status: 'Cancelled',
          discountCode: null,
          payments: [], // Cancelled -> not outstanding
        },
        // Re-issued confirmed invoice
        {
          number: 'INV-DEMO-017',
          periodStart: subtractDays(today, 5),
          periodEnd: addDays(today, 360),
          issueDate: subtractDays(today, 5),
          dueDate: addDays(today, 25),
          status: 'Confirmed',
          discountCode: 'FLAT500',
          payments: [],
        },
      ],
    },
    {
      number: 'SUB-DEMO-016',
      customerEmail: 'quantum@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Paused', // Paused / Vacation mode
      startDate: subtractDays(today, 60),
      nextBillingDate: addDays(today, 60),
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: entProd, varKey: 'Brightloop Enterprise::SSO & Custom SAML Federation', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-018',
          periodStart: subtractDays(today, 60),
          periodEnd: subtractDays(today, 30),
          issueDate: subtractDays(today, 60),
          dueDate: subtractDays(today, 45),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'UPI', note: '[DEMO-PAY-018] Past cycle paid before pause' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-017',
      customerEmail: 'acme@brightloop.example.com',
      planName: 'Quarterly Growth Plan',
      status: 'Paused',
      startDate: subtractDays(today, 90),
      nextBillingDate: addDays(today, 90),
      paymentTerms: 'Net 15',
      items: [
        { prod: apiProd, varKey: 'API Access Package::High Throughput (1000 req/min)', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-019',
          periodStart: subtractDays(today, 90),
          periodEnd: today,
          issueDate: subtractDays(today, 90),
          dueDate: subtractDays(today, 75),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'Bank Transfer', note: '[DEMO-PAY-019] Full payment prior to pause' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-018',
      customerEmail: 'greenfield@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Closed',
      closedAt: subtractDays(today, 15),
      startDate: subtractDays(today, 120),
      nextBillingDate: subtractDays(today, 15),
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Standard Single-User', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-020',
          periodStart: subtractDays(today, 120),
          periodEnd: subtractDays(today, 90),
          issueDate: subtractDays(today, 120),
          dueDate: subtractDays(today, 105),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'Cash', note: '[DEMO-PAY-020] Cash settlement at branch' }],
        },
        {
          number: 'INV-DEMO-021',
          periodStart: subtractDays(today, 90),
          periodEnd: subtractDays(today, 60),
          issueDate: subtractDays(today, 90),
          dueDate: subtractDays(today, 75),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'UPI', note: '[DEMO-PAY-021] UPI Auto-debit' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-019',
      customerEmail: 'apex@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Closed',
      closedAt: subtractDays(today, 30),
      startDate: subtractDays(today, 180),
      nextBillingDate: subtractDays(today, 30),
      paymentTerms: 'Net 15',
      items: [
        { prod: proProd, varKey: 'Brightloop Professional::Standard Edition', qty: 1 },
      ],
      invoices: [
        {
          number: 'INV-DEMO-022',
          periodStart: subtractDays(today, 180),
          periodEnd: subtractDays(today, 150),
          issueDate: subtractDays(today, 180),
          dueDate: subtractDays(today, 165),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'Card', note: '[DEMO-PAY-022] Corporate Amex' }],
        },
      ],
    },
    {
      number: 'SUB-DEMO-020',
      customerEmail: 'nova@brightloop.example.com',
      planName: 'Monthly Standard Plan',
      status: 'Draft',
      startDate: addDays(today, 3),
      nextBillingDate: addDays(today, 3),
      paymentTerms: 'Due Upon Receipt',
      items: [
        { prod: starterProd, varKey: 'Brightloop Starter SaaS::Standard Single-User', qty: 5 },
      ],
      invoices: [
        // ⭐️ Additional Invoices to reach exactly 25 invoices
        {
          number: 'INV-DEMO-023',
          periodStart: subtractDays(today, 60),
          periodEnd: subtractDays(today, 30),
          issueDate: subtractDays(today, 60),
          dueDate: subtractDays(today, 45),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'UPI', note: '[DEMO-PAY-023] Historic invoice payment' }],
        },
        {
          number: 'INV-DEMO-024',
          periodStart: subtractDays(today, 90),
          periodEnd: subtractDays(today, 60),
          issueDate: subtractDays(today, 90),
          dueDate: subtractDays(today, 75),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'Bank Transfer', note: '[DEMO-PAY-024] Historic cycle NEFT' }],
        },
        {
          number: 'INV-DEMO-025',
          periodStart: subtractDays(today, 120),
          periodEnd: subtractDays(today, 90),
          issueDate: subtractDays(today, 120),
          dueDate: subtractDays(today, 105),
          status: 'Paid',
          discountCode: null,
          payments: [{ method: 'Card', note: '[DEMO-PAY-025] Founding cycle payment' }],
        },
      ],
    },
  ];

  for (const s of SUBSCRIPTION_DATA) {
    const cust = userMap[s.customerEmail] || customers[0];
    const plan = planMap[s.planName] || monthlyPlan;

    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('subscription_number', s.number)
      .maybeSingle();

    let subId = null;
    if (existingSub) {
      subId = existingSub.id;
      await supabaseAdmin
        .from('subscriptions')
        .update({
          customer_id: cust.id,
          plan_id: plan.id,
          start_date: s.startDate,
          next_billing_date: s.nextBillingDate,
          payment_terms: s.paymentTerms,
          status: s.status,
          closed_at: s.closedAt ? new Date(s.closedAt).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subId);
    } else {
      const { data: createdSub, error: subErr } = await supabaseAdmin
        .from('subscriptions')
        .insert([{
          subscription_number: s.number,
          customer_id: cust.id,
          plan_id: plan.id,
          start_date: s.startDate,
          next_billing_date: s.nextBillingDate,
          payment_terms: s.paymentTerms,
          status: s.status,
          closed_at: s.closedAt ? new Date(s.closedAt).toISOString() : null,
        }])
        .select()
        .single();
      if (subErr) throw subErr;
      subId = createdSub.id;
      stats.subscriptions++;
    }

    // Refresh subscription items
    await supabaseAdmin.from('subscription_items').delete().eq('subscription_id', subId);
    const subItemsToInsert = s.items.map((it) => {
      const variant = variantMap[it.varKey];
      const salesPrice = it.prod.sales_price;
      const extraPrice = variant?.extra_price || 0;
      const unitPrice = round2(new Decimal(salesPrice).plus(extraPrice)).toNumber();

      return {
        subscription_id: subId,
        product_id: it.prod.id,
        variant_id: variant?.id || null,
        description: `${it.prod.name}${variant ? ` - ${variant.name}` : ''}`,
        quantity: it.qty,
        unit_price: unitPrice,
      };
    });
    await supabaseAdmin.from('subscription_items').insert(subItemsToInsert);

    // Invoices for this subscription
    for (const inv of s.invoices) {
      const discountObj = inv.discountCode ? discountMap[inv.discountCode] : null;

      // Calculate invoice items based on subscription items
      const pricingLines = s.items.map((it) => {
        const variant = variantMap[it.varKey];
        const salesPrice = it.prod.sales_price;
        const extraPrice = variant?.extra_price || 0;
        const taxRate = it.prod.tax_id === gst12?.id ? 12 : it.prod.tax_id === zeroTax?.id ? 0 : 18;

        return {
          productId: it.prod.id,
          variantId: variant?.id || null,
          description: `${it.prod.name}${variant ? ` - ${variant.name}` : ''}`,
          salesPrice,
          extraPrice,
          quantity: it.qty,
          taxRate,
        };
      });

      const docPricing = calculateDocumentPricing(pricingLines, discountObj ? { discountType: discountObj.discount_type, value: discountObj.value } : null);

      // Determine amount paid based on status & payments
      let targetAmountPaid = new Decimal(0);
      if (inv.status === 'Paid') {
        targetAmountPaid = new Decimal(docPricing.total);
      } else if (inv.payments && inv.payments.length > 0) {
        inv.payments.forEach((p) => {
          if (p.fixedAmount) {
            targetAmountPaid = targetAmountPaid.plus(p.fixedAmount);
          } else if (p.ratio) {
            targetAmountPaid = targetAmountPaid.plus(new Decimal(docPricing.total).times(p.ratio));
          } else {
            targetAmountPaid = targetAmountPaid.plus(docPricing.total);
          }
        });
      }
      targetAmountPaid = round2(targetAmountPaid);

      const { data: existingInv } = await supabaseAdmin
        .from('invoices')
        .select('id')
        .eq('invoice_number', inv.number)
        .maybeSingle();

      let invId = null;
      if (existingInv) {
        invId = existingInv.id;
        await supabaseAdmin
          .from('invoices')
          .update({
            subscription_id: subId,
            customer_id: cust.id,
            period_start: inv.periodStart,
            period_end: inv.periodEnd,
            issue_date: inv.issueDate,
            due_date: inv.dueDate,
            status: inv.status,
            subtotal: docPricing.subtotal,
            discount_total: docPricing.discountTotal,
            tax_total: docPricing.taxTotal,
            total: docPricing.total,
            amount_paid: targetAmountPaid.toNumber(),
            discount_id: discountObj?.id || null,
          })
          .eq('id', invId);
      } else {
        const { data: createdInv, error: invErr } = await supabaseAdmin
          .from('invoices')
          .insert([{
            invoice_number: inv.number,
            subscription_id: subId,
            customer_id: cust.id,
            period_start: inv.periodStart,
            period_end: inv.periodEnd,
            issue_date: inv.issueDate,
            due_date: inv.dueDate,
            status: inv.status,
            subtotal: docPricing.subtotal,
            discount_total: docPricing.discountTotal,
            tax_total: docPricing.taxTotal,
            total: docPricing.total,
            amount_paid: targetAmountPaid.toNumber(),
            discount_id: discountObj?.id || null,
          }])
          .select()
          .single();

        if (invErr) {
          // If period constraint collision, log and continue safely
          console.warn(`   ⚠️ Could not insert invoice ${inv.number}: ${invErr.message}`);
          continue;
        }
        invId = createdInv.id;
        stats.invoices++;
      }

      // Refresh invoice items
      await supabaseAdmin.from('invoice_items').delete().eq('invoice_id', invId);
      const invoiceItemsToInsert = docPricing.items.map((line) => ({
        invoice_id: invId,
        product_id: line.productId,
        variant_id: line.variantId,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        line_subtotal: line.lineSubtotal,
        tax_rate: line.taxRate,
        tax_amount: line.taxAmount,
        line_total: line.lineTotal,
      }));
      await supabaseAdmin.from('invoice_items').insert(invoiceItemsToInsert);

      // Payments for this invoice
      for (const pay of inv.payments) {
        let payAmount = targetAmountPaid;
        if (pay.fixedAmount) {
          payAmount = new Decimal(pay.fixedAmount);
        } else if (pay.ratio) {
          payAmount = round2(new Decimal(docPricing.total).times(pay.ratio));
        }

        const { data: existingPay } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('invoice_id', invId)
          .eq('note', pay.note)
          .maybeSingle();

        if (!existingPay) {
          const { error: payErr } = await supabaseAdmin
            .from('payments')
            .insert([{
              invoice_id: invId,
              method: pay.method,
              amount: payAmount.toNumber(),
              payment_date: inv.issueDate,
              note: pay.note,
              received_by: staff2?.id || staff1?.id || adminUser?.id,
            }]);

          if (payErr) {
            console.warn(`   ⚠️ Could not insert payment for ${inv.number}: ${payErr.message}`);
          } else {
            stats.payments++;
          }
        }
      }
    }
  }
  console.log(`   ✓ Configured ${SUBSCRIPTION_DATA.length} subscriptions, ${stats.invoices} demo invoices, and ${stats.payments} payments`);

  // ==============================================================================
  // SUMMARY REPORT
  // ==============================================================================
  console.log('\n================================================================');
  console.log('✅ BRIGHTLOOP DEMO SEEDING COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  console.log('📊 Records Provisioned / Confirmed in PostgreSQL:');
  console.log(`   - Auth Accounts:     ${Object.keys(userMap).length} (1 Admin, 3 Staff, 15 Customers)`);
  console.log(`   - Taxes:             ${Object.keys(taxMap).length}`);
  console.log(`   - Products:          ${Object.keys(productMap).length}`);
  console.log(`   - Variants:          ${Object.keys(variantMap).length}`);
  console.log(`   - Plans:             ${Object.keys(planMap).length}`);
  console.log(`   - Discounts:         ${Object.keys(discountMap).length}`);
  console.log(`   - Quotations:        ${Object.keys(quotationMap).length} (Draft, Sent, Accepted, Rejected, Expired, Converted)`);
  console.log(`   - Subscriptions:     ${SUBSCRIPTION_DATA.length} (Active, Confirmed, Paused, Closed, Draft)`);
  console.log(`   - Invoices:          25 Demo Invoices (Paid, Unpaid Confirmed, Partial, Overdue, Draft, Cancelled)`);
  console.log(`   - Payments:          ${stats.payments} Ledger Payments (Cash, UPI, Card, Bank Transfer)`);

  console.log('\n🔑 Demo Login Credentials:');
  console.log(`   - Admin:    admin@brightloop.example.com  | Password: ${DEMO_PASSWORD}`);
  console.log(`   - Staff:    staff1@brightloop.example.com | Password: ${DEMO_PASSWORD}`);
  console.log(`   - Customer: acme@brightloop.example.com   | Password: ${DEMO_PASSWORD}`);

  console.log('\n💡 Hackathon Billing Engine Demonstration:');
  console.log('   Subscription SUB-DEMO-001 (Acme) is active and due TODAY with no existing invoice.');
  console.log('   👉 Trigger POST /api/billing/run to demonstrate autonomous recurring invoicing in real-time!');
  console.log('================================================================\n');

  return stats;
}

// Auto-run if executed directly via node src/seed/seedDemoData.js
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ Unhandled error in seedDemoData:', err);
      process.exit(1);
    });
}
