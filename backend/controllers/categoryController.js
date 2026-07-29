import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all main categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let queryStr = 'SELECT * FROM categories WHERE 1=1';
    const params = [];

    if (status) {
      queryStr += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      queryStr += ' AND (name LIKE ? OR description LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s);
    }

    queryStr += ' ORDER BY name ASC';

    const [categories] = await req.db.query(queryStr, params);

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get categories tree / flat hierarchy
// @route   GET /api/categories/tree
// @access  Private
export const getHierarchy = async (req, res, next) => {
  try {
    const [categories] = await req.db.query('SELECT * FROM categories ORDER BY name ASC');
    return res.status(200).json({
      success: true,
      count: categories.length,
      tree: categories,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a main category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category Name is required' });
    }

    // Check duplicate name
    const [existing] = await req.db.query(
      'SELECT id FROM categories WHERE name = ?',
      [name.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A Category named "${name.trim()}" already exists.`
      });
    }

    const statusVal = status || 'Active';

    const [result] = await req.db.query(
      `INSERT INTO categories (name, description, status) VALUES (?, ?, ?)`,
      [name.trim(), description ? description.trim() : null, statusVal]
    );

    await logActivity(req.user.id, 'Create Main Category', 'Categories',
      `Created Main Category "${name.trim()}" (ID: ${result.insertId})`, req.ip);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: result.insertId,
        name: name.trim(),
        description: description ? description.trim() : null,
        status: statusVal
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a main category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const [existing] = await req.db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const targetName = name !== undefined ? name.trim() : existing[0].name;

    // Check duplicate name excluding self
    if (name) {
      const [dupCheck] = await req.db.query(
        'SELECT id FROM categories WHERE name = ? AND id != ?',
        [targetName, id]
      );
      if (dupCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: `A Category named "${targetName}" already exists.`
        });
      }
    }

    await req.db.query(
      `UPDATE categories 
       SET name = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        targetName,
        description !== undefined ? (description ? description.trim() : null) : existing[0].description,
        status || existing[0].status,
        id
      ]
    );

    await logActivity(req.user.id, 'Update Main Category', 'Categories',
      `Updated Main Category ID: ${id} to "${targetName}"`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle main category status (Active/Inactive)
// @route   PATCH /api/categories/:id/status
// @access  Private
export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [existing] = await req.db.query('SELECT id, name, status FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const newStatus = status || (existing[0].status === 'Active' ? 'Inactive' : 'Active');

    await req.db.query('UPDATE categories SET status = ? WHERE id = ?', [newStatus, id]);

    await logActivity(req.user.id, 'Toggle Category Status', 'Categories',
      `Toggled status of Main Category "${existing[0].name}" (ID: ${id}) to ${newStatus}`, req.ip);

    return res.status(200).json({
      success: true,
      message: `Main Category "${existing[0].name}" is now ${newStatus}`,
      status: newStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a main category (Disabled by ERP policy)
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: 'Permanent deletion is disabled in Kirana ERP master settings. Please toggle status to Inactive instead.'
  });
};
