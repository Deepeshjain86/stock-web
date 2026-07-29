import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all brands
// @route   GET /api/brands
// @access  Private
export const getBrands = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let queryStr = 'SELECT * FROM brands WHERE 1=1';
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

    const [brands] = await req.db.query(queryStr, params);

    return res.status(200).json({
      success: true,
      count: brands.length,
      brands
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a brand
// @route   POST /api/brands
// @access  Private
export const createBrand = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Brand Name is required' });
    }

    // Duplicate check
    const [existing] = await req.db.query(
      'SELECT id FROM brands WHERE name = ?',
      [name.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A Brand named "${name.trim()}" already exists.`
      });
    }

    const statusVal = status || 'Active';

    const [result] = await req.db.query(
      `INSERT INTO brands (name, description, status) VALUES (?, ?, ?)`,
      [name.trim(), description ? description.trim() : null, statusVal]
    );

    await logActivity(req.user.id, 'Create Brand', 'Brands',
      `Created Brand "${name.trim()}" (ID: ${result.insertId})`, req.ip);

    return res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      brand: {
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

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private
export const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const [existing] = await req.db.query('SELECT * FROM brands WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    const targetName = name !== undefined ? name.trim() : existing[0].name;

    // Duplicate check excluding self
    if (name) {
      const [dupCheck] = await req.db.query(
        'SELECT id FROM brands WHERE name = ? AND id != ?',
        [targetName, id]
      );
      if (dupCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: `A Brand named "${targetName}" already exists.`
        });
      }
    }

    await req.db.query(
      `UPDATE brands 
       SET name = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        targetName,
        description !== undefined ? (description ? description.trim() : null) : existing[0].description,
        status || existing[0].status,
        id
      ]
    );

    await logActivity(req.user.id, 'Update Brand', 'Brands',
      `Updated Brand ID: ${id} to "${targetName}"`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Brand updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle brand status (Active/Inactive)
// @route   PATCH /api/brands/:id/status
// @access  Private
export const toggleBrandStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [existing] = await req.db.query('SELECT id, name, status FROM brands WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    const newStatus = status || (existing[0].status === 'Active' ? 'Inactive' : 'Active');

    await req.db.query('UPDATE brands SET status = ? WHERE id = ?', [newStatus, id]);

    await logActivity(req.user.id, 'Toggle Brand Status', 'Brands',
      `Toggled status of Brand "${existing[0].name}" (ID: ${id}) to ${newStatus}`, req.ip);

    return res.status(200).json({
      success: true,
      message: `Brand "${existing[0].name}" is now ${newStatus}`,
      status: newStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a brand (Disabled by ERP policy)
// @route   DELETE /api/brands/:id
// @access  Private
export const deleteBrand = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: 'Permanent deletion is disabled in Kirana ERP master settings. Please toggle status to Inactive instead.'
  });
};
