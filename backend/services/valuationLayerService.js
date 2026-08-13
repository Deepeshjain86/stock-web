/**
 * Odoo 19 Inventory Valuation Layer Service
 * Enterprise valuation trail tracker for Kirana ERP
 */

export const recordValuationLayer = async (db, {
  productId,
  warehouseId = 1,
  batchId = null,
  transactionType,
  referenceNo,
  quantityDelta,
  unitCost,
  valueDelta,
  previousQuantity = 0,
  newQuantity = 0,
  previousInventoryValue = 0,
  newInventoryValue = 0,
  accountingTreatment = 'Inventory Variation',
  createdBy = null
}) => {
  try {
    const query = `
      INSERT INTO inventory_valuation_layers (
        product_id, warehouse_id, batch_id, transaction_type, reference_no,
        quantity_delta, unit_cost, value_delta, previous_inventory_value,
        new_inventory_value, previous_quantity, new_quantity, accounting_treatment, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      productId, warehouseId, batchId, transactionType, referenceNo,
      quantityDelta, unitCost, valueDelta, previousInventoryValue,
      newInventoryValue, previousQuantity, newQuantity, accountingTreatment, createdBy
    ];
    await db.query(query, params);
  } catch (err) {
    console.error(`[ValuationLayer] Failed to insert valuation layer for ref ${referenceNo}:`, err.message);
  }
};
