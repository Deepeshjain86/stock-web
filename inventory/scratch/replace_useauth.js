import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/Dashboard/Dashboard.jsx',
  'src/pages/Products/ProductList.jsx',
  'src/pages/Purchase/PurchaseList.jsx',
  'src/pages/Sales/SalesDashboard.jsx',
  'src/pages/Sales/SalesList.jsx',
  'src/pages/Settings/ActivityLogs.jsx',
  'src/pages/Stock/StockAdjustment.jsx',
  'src/pages/Stock/StockHistory.jsx',
  'src/pages/Stock/VendorReturnManagement.jsx',
  'src/pages/Users/StaffList.jsx',
  'src/pages/Vendors/VendorList.jsx'
];

for (const relPath of files) {
  const filePath = path.resolve(relPath);
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Determine correct relative path for hooks.js based on file depth
  // e.g. src/pages/Dashboard/Dashboard.jsx has depth 3 (relative: '../../store/hooks')
  const dirName = path.dirname(relPath);
  const depth = dirName.split('/').length;
  let hooksRelativePath = '';
  if (depth === 2) { // src/components/layout
    hooksRelativePath = '../store/hooks';
  } else if (depth === 3) { // src/pages/Dashboard
    hooksRelativePath = '../../store/hooks';
  } else if (depth === 4) { // src/pages/Auth/Login.jsx
    hooksRelativePath = '../../../store/hooks';
  } else {
    hooksRelativePath = '../../store/hooks'; // fallback default
  }

  // Replace import
  content = content.replace(
    /import\s+{[^}]+useAuth[^}]+}\s+from\s+['"][^'"]+AuthContext['"];?/g,
    `import { useAppSelector } from '${hooksRelativePath}';`
  );

  // Replace useAuth call
  content = content.replace(
    /const\s+{\s*user\s*}\s*=\s*useAuth\s*\(\s*\)\s*;?/g,
    'const { user } = useAppSelector((state) => state.auth);'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Successfully migrated: ${relPath}`);
}

console.log('\nMigration completed successfully!');
