'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');
const reports = require('../lib/reports');

test('invoice GST breakdown and total match the billed order using the HSN slab', function () {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const order = { id: 1001, items: items, coupon: '', subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total };
  const printed = invoice.computeInvoiceFigures(order);

  assert.equal(billed.tax, 50);
  assert.equal(billed.total, 1050);
  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.total, billed.total);
});

test('invoice coupon discount and total match the billed capped discount', function () {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 2000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const order = { id: 1002, items: items, coupon: 'SAVE10', subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total };
  const printed = invoice.computeInvoiceFigures(order);

  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 92.5);
  assert.equal(billed.total, 1942.5);
  assert.equal(printed.discount, billed.discount);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.total, billed.total);
});

test('GST reconciliation matches an in-memory order billed with its HSN slab', function () {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const order = { id: 1003, date: '22/11/2026', customer: 'Test Customer', items: items, coupon: '', status: 'completed', subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total };

  const result = reports.getGstReconciliation({ orders: [order] });
  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.rows[0].ledgerTax, 50);
  assert.equal(result.rows[0].invoiceTax, 50);
  assert.equal(result.rows[0].delta, 0);
  assert.equal(result.rows[0].matched, true);
});
