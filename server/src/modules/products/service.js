import { supabaseAdmin } from '../../config/supabase.js';
import Decimal from 'decimal.js';

export const listProducts = async ({ search, isActive, page = 1, limit = 10 }) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('products')
    .select(`
      *,
      taxes:tax_id (id, name, rate),
      product_variants (*)
    `, { count: 'exact' });

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive === 'true' || isActive === true);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    products: data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};

export const getProductById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      taxes:tax_id (id, name, rate),
      product_variants (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createProduct = async ({
  name,
  productType = 'service',
  salesPrice,
  costPrice = 0,
  notes,
  taxId,
  variants = [],
}) => {
  if (!name || salesPrice === undefined) {
    throw new Error('Product name and sales price are required.');
  }

  const cleanSalesPrice = new Decimal(salesPrice).toFixed(2);
  const cleanCostPrice = new Decimal(costPrice || 0).toFixed(2);

  // 1. Insert product
  const { data: product, error: prodError } = await supabaseAdmin
    .from('products')
    .insert([
      {
        name,
        product_type: productType,
        sales_price: cleanSalesPrice,
        cost_price: cleanCostPrice,
        notes,
        tax_id: taxId || null,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (prodError) throw prodError;

  // 2. Insert variants if provided
  let createdVariants = [];
  if (Array.isArray(variants) && variants.length > 0) {
    const variantPayloads = variants.map((v) => ({
      product_id: product.id,
      name: v.name,
      extra_price: new Decimal(v.extraPrice || 0).toFixed(2),
      is_active: v.isActive !== false,
    }));

    const { data: vData, error: vError } = await supabaseAdmin
      .from('product_variants')
      .insert(variantPayloads)
      .select();

    if (vError) throw vError;
    createdVariants = vData;
  }

  return {
    ...product,
    product_variants: createdVariants,
  };
};

export const updateProduct = async (id, updateFields) => {
  const allowed = ['name', 'product_type', 'sales_price', 'cost_price', 'notes', 'tax_id', 'is_active'];
  const updateData = {};

  for (const key of allowed) {
    if (updateFields[key] !== undefined) {
      if (key === 'sales_price' || key === 'cost_price') {
        updateData[key] = new Decimal(updateFields[key]).toFixed(2);
      } else {
        updateData[key] = updateFields[key];
      }
    }
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      taxes:tax_id (id, name, rate),
      product_variants (*)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const addProductVariant = async (productId, { name, extraPrice = 0, isActive = true }) => {
  if (!name) throw new Error('Variant name is required.');

  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .insert([
      {
        product_id: productId,
        name,
        extra_price: new Decimal(extraPrice).toFixed(2),
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Helper to compute calculated final unit price for a product + variant selection
 */
export const calculateProductPrice = async (productId, variantId = null) => {
  const { data: product, error: prodError } = await supabaseAdmin
    .from('products')
    .select('id, name, sales_price, tax_id, taxes:tax_id(rate)')
    .eq('id', productId)
    .single();

  if (prodError || !product) {
    throw new Error(`Product not found with id ${productId}`);
  }

  let unitPrice = new Decimal(product.sales_price);

  if (variantId) {
    const { data: variant, error: varError } = await supabaseAdmin
      .from('product_variants')
      .select('id, name, extra_price')
      .eq('id', variantId)
      .eq('product_id', productId)
      .single();

    if (varError || !variant) {
      throw new Error(`Variant not found or does not belong to product`);
    }

    unitPrice = unitPrice.plus(new Decimal(variant.extra_price));
  }

  return {
    productId: product.id,
    productName: product.name,
    unitPrice: unitPrice.toFixed(2),
    taxRate: product.taxes?.rate ? new Decimal(product.taxes.rate).toFixed(2) : '0.00',
  };
};
