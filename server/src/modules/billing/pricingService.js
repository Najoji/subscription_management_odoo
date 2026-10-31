import Decimal from 'decimal.js';

// Configure Decimal precision for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Round a Decimal or number to 2 decimal places (paise precision)
 * @param {Decimal|number|string} val
 * @returns {Decimal}
 */
export const round2 = (val) => {
  return new Decimal(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
};

/**
 * Format Decimal to string with 2 decimal places
 * @param {Decimal|number|string} val
 * @returns {string}
 */
export const toCurrency = (val) => {
  return round2(val).toFixed(2);
};

/**
 * Central Pricing Calculation Function
 * 
 * Calculates exact line item and total financial amounts following Brightloop Business Rules:
 * 1. Unit Price = Product Sales Price + Variant Extra Price
 * 2. Line Subtotal = Unit Price * Quantity
 * 3. Discount Amount = Fixed or Percentage applied to eligible base
 * 4. Taxable Base = Line Subtotal - Discount
 * 5. Tax Amount = Taxable Base * (Tax Rate / 100)
 * 6. Line Total = Taxable Base + Tax Amount
 * 
 * Example:
 * Product Price = 1000
 * Variant Extra = 560
 * Quantity = 2
 * Unit Price = 1560
 * Subtotal = 3120
 * Discount (10%) = 312
 * Taxable Base = 2808
 * Tax (18%) = 505.44
 * Line Total = 3313.44
 * 
 * @param {Object} params
 * @param {number|string} params.salesPrice - Base product sales price
 * @param {number|string} [params.extraPrice=0] - Extra price for selected variant
 * @param {number} [params.quantity=1] - Quantity of items
 * @param {number|string} [params.taxRate=0] - Applicable tax percentage (e.g. 18.00)
 * @param {Object} [params.discount] - Optional discount object { discountType: 'fixed'|'percentage', value: number }
 * @returns {Object} Calculated line item details
 */
export const calculateLineItemPricing = ({
  salesPrice,
  extraPrice = 0,
  quantity = 1,
  taxRate = 0,
  discount = null,
}) => {
  const dSalesPrice = round2(salesPrice || 0);
  const dExtraPrice = round2(extraPrice || 0);
  const dQty = new Decimal(quantity || 1);

  // 1. Unit price
  const unitPrice = round2(dSalesPrice.plus(dExtraPrice));

  // 2. Line subtotal
  const lineSubtotal = round2(unitPrice.times(dQty));

  // 3. Discount calculation
  let discountAmount = new Decimal(0);
  if (discount && discount.value > 0) {
    if (discount.discountType === 'percentage') {
      const rate = new Decimal(discount.value).dividedBy(100);
      discountAmount = round2(lineSubtotal.times(rate));
    } else if (discount.discountType === 'fixed') {
      discountAmount = round2(discount.value);
    }
    // Cap discount at line subtotal
    if (discountAmount.greaterThan(lineSubtotal)) {
      discountAmount = lineSubtotal;
    }
  }

  // 4. Taxable amount
  const taxableBase = round2(Decimal.max(0, lineSubtotal.minus(discountAmount)));

  // 5. Tax calculation
  const dTaxRate = new Decimal(taxRate || 0);
  const taxAmount = round2(taxableBase.times(dTaxRate.dividedBy(100)));

  // 6. Line total
  const lineTotal = round2(taxableBase.plus(taxAmount));

  return {
    salesPrice: dSalesPrice.toFixed(2),
    extraPrice: dExtraPrice.toFixed(2),
    unitPrice: unitPrice.toFixed(2),
    quantity: dQty.toNumber(),
    lineSubtotal: lineSubtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxRate: dTaxRate.toFixed(2),
    taxableBase: taxableBase.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    lineTotal: lineTotal.toFixed(2),
  };
};

/**
 * Calculate totals for a multi-line invoice or quotation.
 * If a global discount is passed, it is applied proportionally or directly across eligible lines.
 * 
 * @param {Array<Object>} items - Array of line calculation parameters
 * @param {Object} [globalDiscount] - Optional discount applied at document level
 * @returns {Object} Aggregated document pricing totals
 */
export const calculateDocumentPricing = (items = [], globalDiscount = null) => {
  let subtotal = new Decimal(0);
  let discountTotal = new Decimal(0);
  let taxTotal = new Decimal(0);
  let total = new Decimal(0);

  const calculatedLines = [];

  // Step 1: Calculate raw line subtotals
  const rawLines = items.map((item) => {
    const dSales = round2(item.salesPrice || 0);
    const dExtra = round2(item.extraPrice || 0);
    const dQty = new Decimal(item.quantity || 1);
    const unitPrice = round2(dSales.plus(dExtra));
    const lineSubtotal = round2(unitPrice.times(dQty));
    return {
      ...item,
      unitPrice,
      lineSubtotal,
      dQty,
      taxRate: new Decimal(item.taxRate || 0),
    };
  });

  const aggregateSubtotal = rawLines.reduce(
    (acc, line) => acc.plus(line.lineSubtotal),
    new Decimal(0)
  );

  // Step 2: Determine global discount distribution if present
  let totalDocDiscount = new Decimal(0);
  if (globalDiscount && globalDiscount.value > 0) {
    if (globalDiscount.discountType === 'percentage') {
      const rate = new Decimal(globalDiscount.value).dividedBy(100);
      totalDocDiscount = round2(aggregateSubtotal.times(rate));
    } else if (globalDiscount.discountType === 'fixed') {
      totalDocDiscount = round2(globalDiscount.value);
    }
    if (totalDocDiscount.greaterThan(aggregateSubtotal)) {
      totalDocDiscount = aggregateSubtotal;
    }
  }

  // Step 3: Compute each line with its share of discount and tax
  let allocatedDiscount = new Decimal(0);

  rawLines.forEach((line, index) => {
    let lineDiscount = new Decimal(0);

    // If item has its own specific discount
    if (line.discount && line.discount.value > 0) {
      if (line.discount.discountType === 'percentage') {
        const rate = new Decimal(line.discount.value).dividedBy(100);
        lineDiscount = round2(line.lineSubtotal.times(rate));
      } else {
        lineDiscount = round2(line.discount.value);
      }
      if (lineDiscount.greaterThan(line.lineSubtotal)) {
        lineDiscount = line.lineSubtotal;
      }
    } else if (totalDocDiscount.greaterThan(0) && aggregateSubtotal.greaterThan(0)) {
      // Pro-rate global discount across lines
      if (index === rawLines.length - 1) {
        // Last line absorbs any remainder to avoid 1-paise rounding discrepancy
        lineDiscount = round2(totalDocDiscount.minus(allocatedDiscount));
      } else {
        const ratio = line.lineSubtotal.dividedBy(aggregateSubtotal);
        lineDiscount = round2(totalDocDiscount.times(ratio));
        allocatedDiscount = allocatedDiscount.plus(lineDiscount);
      }
    }

    if (lineDiscount.greaterThan(line.lineSubtotal)) {
      lineDiscount = line.lineSubtotal;
    }

    const taxableBase = round2(Decimal.max(0, line.lineSubtotal.minus(lineDiscount)));
    const taxAmount = round2(taxableBase.times(line.taxRate.dividedBy(100)));
    const lineTotal = round2(taxableBase.plus(taxAmount));

    subtotal = subtotal.plus(line.lineSubtotal);
    discountTotal = discountTotal.plus(lineDiscount);
    taxTotal = taxTotal.plus(taxAmount);
    total = total.plus(lineTotal);

    calculatedLines.push({
      ...line,
      salesPrice: round2(line.salesPrice || 0).toFixed(2),
      extraPrice: round2(line.extraPrice || 0).toFixed(2),
      unitPrice: line.unitPrice.toFixed(2),
      quantity: line.dQty.toNumber(),
      lineSubtotal: line.lineSubtotal.toFixed(2),
      discountAmount: lineDiscount.toFixed(2),
      taxRate: line.taxRate.toFixed(2),
      taxableBase: taxableBase.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
    });
  });

  return {
    items: calculatedLines,
    subtotal: subtotal.toFixed(2),
    discountTotal: discountTotal.toFixed(2),
    taxTotal: taxTotal.toFixed(2),
    total: total.toFixed(2),
  };
};
