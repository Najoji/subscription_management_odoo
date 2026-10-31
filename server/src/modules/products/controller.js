import * as productService from './service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const getProducts = async (req, res) => {
  try {
    const { search, isActive, page, limit } = req.query;
    const result = await productService.listProducts({ search, isActive, page, limit });
    return sendSuccess(res, 'Products retrieved successfully', result.products, 200, result.pagination);
  } catch (err) {
    console.error('Error fetching products:', err);
    return sendError(res, err.message || 'Failed to fetch products', 500);
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    return sendSuccess(res, 'Product retrieved successfully', product);
  } catch (err) {
    console.error('Error fetching product details:', err);
    return sendError(res, err.message || 'Failed to fetch product details', 404);
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, productType, salesPrice, costPrice, notes, taxId, variants } = req.body;
    const product = await productService.createProduct({
      name,
      productType,
      salesPrice,
      costPrice,
      notes,
      taxId,
      variants,
    });
    return sendSuccess(res, 'Product created successfully', product, 201);
  } catch (err) {
    console.error('Error creating product:', err);
    return sendError(res, err.message || 'Failed to create product', 400);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    return sendSuccess(res, 'Product updated successfully', product);
  } catch (err) {
    console.error('Error updating product:', err);
    return sendError(res, err.message || 'Failed to update product', 400);
  }
};

export const addVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, extraPrice, isActive } = req.body;
    const variant = await productService.addProductVariant(id, { name, extraPrice, isActive });
    return sendSuccess(res, 'Variant added successfully', variant, 201);
  } catch (err) {
    console.error('Error adding variant:', err);
    return sendError(res, err.message || 'Failed to add variant', 400);
  }
};

export const calculatePrice = async (req, res) => {
  try {
    const { productId, variantId } = req.query;
    if (!productId) return sendError(res, 'productId is required', 400);

    const priceInfo = await productService.calculateProductPrice(productId, variantId);
    return sendSuccess(res, 'Calculated price retrieved', priceInfo);
  } catch (err) {
    return sendError(res, err.message || 'Price calculation failed', 400);
  }
};
