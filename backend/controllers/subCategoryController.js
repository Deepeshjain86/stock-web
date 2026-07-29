import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all sub categories
// @route   GET /api/sub-categories
// @access  Private
export const getSubCategories = async (req, res, next) => {
  try {
    const { category_id, status, search } = req.query;

    let queryStr = `
      SELECT sc.*, c.name as category_name 
      FROM sub_categories sc
      JOIN categories c ON sc.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      queryStr += ' AND sc.category_id = ?';
      params.push(Number(category_id));
    }

    if (status) {
      queryStr += ' AND sc.status = ?';
      params.push(status);
    }

    if (search) {
      queryStr += ' AND (sc.name LIKE ? OR c.name LIKE ? OR sc.description LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    queryStr += ' ORDER BY c.name ASC, sc.name ASC';

    const [subCategories] = await req.db.query(queryStr, params);

    return res.status(200).json({
      success: true,
      count: subCategories.length,
      subCategories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a sub category
// @route   POST /api/sub-categories
// @access  Private
export const createSubCategory = async (req, res, next) => {
  try {
    const { name, category_id, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Sub Category Name is required' });
    }

    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Parent Main Category is required' });
    }

    const catIdNum = Number(category_id);

    // Verify Main Category exists and is Active
    const [parentCat] = await req.db.query('SELECT id, name, status FROM categories WHERE id = ?', [catIdNum]);
    if (parentCat.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected Parent Category does not exist' });
    }

    // Duplicate check under same parent category
    const [existing] = await req.db.query(
      'SELECT id FROM sub_categories WHERE name = ? AND category_id = ?',
      [name.trim(), catIdNum]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A Sub Category named "${name.trim()}" already exists under category "${parentCat[0].name}".`
      });
    }

    const statusVal = status || 'Active';

    const [result] = await req.db.query(
      `INSERT INTO sub_categories (name, category_id, description, status) VALUES (?, ?, ?, ?)`,
      [name.trim(), catIdNum, description ? description.trim() : null, statusVal]
    );

    await logActivity(req.user.id, 'Create Sub Category', 'Categories',
      `Created Sub Category "${name.trim()}" under "${parentCat[0].name}" (ID: ${result.insertId})`, req.ip);

    return res.status(201).json({
      success: true,
      message: 'Sub Category created successfully',
      subCategory: {
        id: result.insertId,
        name: name.trim(),
        category_id: catIdNum,
        category_name: parentCat[0].name,
        description: description ? description.trim() : null,
        status: statusVal
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a sub category
// @route   PUT /api/sub-categories/:id
// @access  Private
export const updateSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category_id, description, status } = req.body;

    const [existing] = await req.db.query('SELECT * FROM sub_categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Sub Category not found' });
    }

    const targetCatId = category_id !== undefined ? Number(category_id) : existing[0].category_id;
    const targetName = name !== undefined ? name.trim() : existing[0].name;

    // Verify Main Category exists
    if (category_id) {
      const [parentCat] = await req.db.query('SELECT id FROM categories WHERE id = ?', [targetCatId]);
      if (parentCat.length === 0) {
        return res.status(404).json({ success: false, message: 'Selected Parent Category does not exist' });
      }
    }

    // Duplicate check excluding self
    const [dupCheck] = await req.db.query(
      'SELECT id FROM sub_categories WHERE name = ? AND category_id = ? AND id != ?',
      [targetName, targetCatId, id]
    );

    if (dupCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A Sub Category named "${targetName}" already exists under this Parent Category.`
      });
    }

    await req.db.query(
      `UPDATE sub_categories 
       SET name = ?, category_id = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        targetName,
        targetCatId,
        description !== undefined ? (description ? description.trim() : null) : existing[0].description,
        status || existing[0].status,
        id
      ]
    );

    // Sync products table category_id for products belonging to this sub_category_id
    if (targetCatId) {
      await req.db.query('UPDATE products SET category_id = ? WHERE sub_category_id = ?', [targetCatId, id]);
    }

    await logActivity(req.user.id, 'Update Sub Category', 'Categories',
      `Updated Sub Category ID: ${id} to "${targetName}"`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Sub Category updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle sub category status (Active/Inactive)
// @route   PATCH /api/sub-categories/:id/status
// @access  Private
export const toggleSubCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [existing] = await req.db.query('SELECT id, name, status FROM sub_categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Sub Category not found' });
    }

    const newStatus = status || (existing[0].status === 'Active' ? 'Inactive' : 'Active');

    await req.db.query('UPDATE sub_categories SET status = ? WHERE id = ?', [newStatus, id]);

    await logActivity(req.user.id, 'Toggle Sub Category Status', 'Categories',
      `Toggled status of Sub Category "${existing[0].name}" (ID: ${id}) to ${newStatus}`, req.ip);

    return res.status(200).json({
      success: true,
      message: `Sub Category "${existing[0].name}" is now ${newStatus}`,
      status: newStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sub category (Disabled by ERP policy)
// @route   DELETE /api/sub-categories/:id
// @access  Private
export const deleteSubCategory = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: 'Permanent deletion is disabled in Kirana ERP master settings. Please toggle status to Inactive instead.'
  });
};
