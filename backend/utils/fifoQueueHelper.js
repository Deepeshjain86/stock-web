/**
 * FIFO Queue Helper for Inventory Management
 * Synchronizes the FIFO Queue (purchase_batches) and Product Master (MRP & Expiry Date)
 * for a given product ID.
 */
export const syncProductFifoState = async (connection, productId) => {
  if (!productId) return;
  try {
    // 1. Get total actual stock from stock table across all warehouses
    const [[stockSum]] = await connection.query(
      'SELECT COALESCE(SUM(quantity), 0) as totalStock FROM stock WHERE product_id = ?',
      [productId]
    );
    const totalStock = Number(stockSum?.totalStock || 0);

    // 2. Reconcile purchase_batches remaining_quantity with actual totalStock
    if (totalStock <= 0) {
      // If total stock is 0 or negative, mark all purchase_batches as exhausted
      await connection.query(
        'UPDATE purchase_batches SET remaining_quantity = 0 WHERE product_id = ?',
        [productId]
      );
    } else {
      // Allocate totalStock from NEWEST to OLDEST batches so active stock matches totalStock exactly
      const [allBatches] = await connection.query(
        `SELECT id, purchase_quantity, remaining_quantity 
         FROM purchase_batches 
         WHERE product_id = ? 
         ORDER BY purchase_date DESC, id DESC`,
        [productId]
      );

      let stockToDistribute = totalStock;
      for (const b of allBatches) {
        if (stockToDistribute <= 0) {
          // Excess old batches are marked exhausted
          await connection.query('UPDATE purchase_batches SET remaining_quantity = 0 WHERE id = ?', [b.id]);
        } else {
          const origQty = Number(b.purchase_quantity > 0 ? b.purchase_quantity : stockToDistribute);
          const allocatedQty = Math.min(origQty, stockToDistribute);
          await connection.query('UPDATE purchase_batches SET remaining_quantity = ? WHERE id = ?', [allocatedQty, b.id]);
          stockToDistribute -= allocatedQty;
        }
      }
    }

    // 3. Find FRONT NODE of FIFO queue (oldest active batch with remaining_quantity > 0)
    const [activeBatches] = await connection.query(
      `SELECT id, batch_number, expiry_date, mrp, selling_price, purchase_price, remaining_quantity
       FROM purchase_batches
       WHERE product_id = ? AND remaining_quantity > 0
       ORDER BY purchase_date ASC, id ASC
       LIMIT 1`,
      [productId]
    );

    if (activeBatches.length > 0) {
      const frontNode = activeBatches[0];
      const newMrp = Number(frontNode.mrp || 0);
      const newExpiry = frontNode.expiry_date || null;
      const newPurchasePrice = Number(frontNode.purchase_price || 0);

      const updateFields = [];
      const queryParams = [];

      if (newPurchasePrice > 0) {
        updateFields.push('purchase_price = ?');
        queryParams.push(newPurchasePrice);
      }
      if (newMrp > 0) {
        updateFields.push('mrp = ?');
        queryParams.push(newMrp);
      }
      if (newExpiry && newExpiry !== '0000-00-00' && newExpiry !== 'N/A') {
        updateFields.push('expiry_date = ?');
        queryParams.push(newExpiry);
      }

      if (updateFields.length > 0) {
        queryParams.push(productId);
        await connection.query(
          `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
          queryParams
        );
      }
    } else {
      // Fallback: If no active batches remain in purchase_batches, check latest purchase_items / grn_items
      const [latestGrn] = await connection.query(
        `SELECT mrp, expiry_date FROM grn_items WHERE product_id = ? AND mrp > 0 ORDER BY id DESC LIMIT 1`,
        [productId]
      );
      if (latestGrn.length > 0) {
        const fallbackMrp = Number(latestGrn[0].mrp || 0);
        const fallbackExp = latestGrn[0].expiry_date;
        if (fallbackMrp > 0) {
          await connection.query('UPDATE products SET mrp = ? WHERE id = ?', [fallbackMrp, productId]);
        }
        if (fallbackExp && fallbackExp !== '0000-00-00' && fallbackExp !== 'N/A') {
          await connection.query('UPDATE products SET expiry_date = ? WHERE id = ?', [fallbackExp, productId]);
        }
      }

      const [latestPurchaseItem] = await connection.query(
        `SELECT purchase_price FROM purchase_items WHERE product_id = ? AND purchase_price > 0 ORDER BY id DESC LIMIT 1`,
        [productId]
      );
      if (latestPurchaseItem.length > 0 && Number(latestPurchaseItem[0].purchase_price) > 0) {
        await connection.query('UPDATE products SET purchase_price = ? WHERE id = ?', [Number(latestPurchaseItem[0].purchase_price), productId]);
      }
    }
  } catch (err) {
    console.warn(`[FIFO Queue Sync Error for product ${productId}]:`, err.message);
  }
};
