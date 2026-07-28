const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const isProd = process.env.NODE_ENV === 'production';

router.use(verifyToken);

/**
 * Get all categories with material counts
 */
router.get('/', authorize('categories:read'), async (req, res) => {
  console.log('GET /api/categories - Fetching all categories');
  
  const query = `
    SELECT 
      category, 
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as count 
    FROM materials 
    WHERE category IS NOT NULL
    GROUP BY category 
    ORDER BY category ASC
  `;

  try {
    const [results] = await db.query(query);
    const requiredCategories = ['Raw Materials', 'Components'];
    requiredCategories.forEach(reqCat => {
      if (!results.find(r => r.category === reqCat)) {
        results.push({ category: reqCat, count: 0 });
      }
    });
    results.sort((a, b) => {
      const aIsReq = requiredCategories.includes(a.category);
      const bIsReq = requiredCategories.includes(b.category);
      if (aIsReq && !bIsReq) return -1;
      if (!aIsReq && bIsReq) return 1;
      if (aIsReq && bIsReq) return requiredCategories.indexOf(a.category) - requiredCategories.indexOf(b.category);
      return a.category.localeCompare(b.category);
    });

    console.log('Categories fetched:', results.length, 'categories');
    console.log('Categories data:', results);
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Database error in GET /api/categories:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Create a new category
 * Note: Creates a placeholder material entry to establish the category
 */
router.post('/', authorize('categories:write'), async (req, res) => {
  console.log('=== POST /api/categories - Create Category ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  const { name } = req.body;
  const userId = req.user?.userId;

  console.log('Extracted data - name:', name, 'userId:', userId);

  if (!name || !name.trim()) {
    console.log('Validation failed: Category name is required');
    return res.status(400).json({
      success: false,
      message: 'Category name is required'
    });
  }

  const categoryName = name.trim();

  // DB schema uses VARCHAR(50) for materials.category
  if (categoryName.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Category name must be 50 characters or less'
    });
  }
  console.log('Processing category name:', categoryName);

  try {
    // Check if category already exists
    const checkQuery = 'SELECT category FROM materials WHERE category = ? LIMIT 1';
    console.log('Checking if category exists...');
    
    const [results] = await db.query(checkQuery, [categoryName]);
    console.log('Check query results:', results);

    if (results.length > 0) {
      console.log('Category already exists:', categoryName);
      return res.status(409).json({
        success: false,
        message: 'Category already exists'
      });
    }

    // Create a placeholder material to establish the category
    const now = Date.now();
    const slug = categoryName.toUpperCase().replace(/\s+/g, '-');
    const maxSlugLen = 50 - 'CAT-'.length - '-'.length - String(now).length;
    const safeSlug = slug.length > maxSlugLen ? slug.substring(0, maxSlugLen) : slug;
    const materialCode = `CAT-${safeSlug}-${now}`;
    console.log('Creating placeholder material with code:', materialCode);
    
    const insertQuery = `
      INSERT INTO materials (
        material_code, 
        material_name, 
        material_type,
        category, 
        unit_of_measurement, 
        current_stock,
        is_active,
        created_by,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      materialCode,
      `${categoryName} - Category Placeholder`,
      'Unspecified',
      categoryName,
      'kg',
      0,
      0, // Set as inactive placeholder
      userId,
      'Placeholder entry for category creation'
    ];

    console.log('Insert query values:', values);

    const [result] = await db.query(insertQuery, values);
    console.log('Category created successfully! Insert result:', result);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category: categoryName,
        count: 0
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      success: false,
      message: isProd ? 'Failed to create category' : `Failed to create category: ${err.sqlMessage || err.message}`
    });
  }
});

/**
 * Rename a category (updates all materials with the old category name)
 */
router.put('/:categoryName', authorize('categories:write'), async (req, res) => {
  const { categoryName } = req.params;
  const { name } = req.body;

  if (categoryName === 'Raw Materials' || categoryName === 'Components') {
    return res.status(400).json({ success: false, message: `${categoryName} is an immutable category and cannot be renamed.` });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'New category name is required' });
  }

  const newName = name.trim();

  if (newName.length > 50) {
    return res.status(400).json({ success: false, message: 'Category name must be 50 characters or less' });
  }

  if (newName === categoryName) {
    return res.status(400).json({ success: false, message: 'New name is the same as the current name' });
  }

  try {
    // Check if new name already exists
    const [existing] = await db.query('SELECT category FROM materials WHERE category = ? LIMIT 1', [newName]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A category with that name already exists' });
    }

    // Rename in all materials rows
    await db.query('UPDATE materials SET category = ? WHERE category = ?', [newName, categoryName]);

    res.status(200).json({ success: true, message: 'Category renamed successfully', data: { oldName: categoryName, newName } });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      success: false,
      message: isProd ? 'Failed to rename category' : `Failed to rename category: ${err.sqlMessage || err.message}`
    });
  }
});

/**
 * Delete a category (only if it has no active materials)
 */
router.delete('/:categoryName', authorize('categories:write'), async (req, res) => {
  const { categoryName } = req.params;

  if (categoryName === 'Raw Materials' || categoryName === 'Components') {
    return res.status(400).json({ success: false, message: `${categoryName} is an immutable category and cannot be deleted.` });
  }

  try {
    // Check if category has active materials
    const checkQuery = 'SELECT COUNT(*) as count FROM materials WHERE category = ? AND is_active = 1';
    
    const [results] = await db.query(checkQuery, [categoryName]);
    const activeCount = Number(results?.[0]?.count || 0);
    
    if (activeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It contains ${activeCount} active material(s)`
      });
    }

    // Instead of deleting placeholder/inactive rows (can fail due to FK constraints),
    // detach them so the category disappears from GROUP BY results.
    const detachQuery = 'UPDATE materials SET category = NULL WHERE category = ? AND is_active = 0';
    await db.query(detachQuery, [categoryName]);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      success: false,
      message: isProd ? 'Failed to delete category' : `Failed to delete category: ${err.sqlMessage || err.message}`
    });
  }
});

module.exports = router;
