const fs = require('fs');
const path = require('path');

/**
 * Check that import paths are valid
 */
function checkImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      checkImports(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importLines = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
      
      for (const importLine of importLines) {
        const match = importLine.match(/from\s+['"]([^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          
          // Skip node modules and absolute imports
          if (importPath.startsWith('@/') || importPath.startsWith('react') || !importPath.startsWith('.')) {
            continue;
          }
          
          // Check if relative import exists
          const importFullPath = path.resolve(path.dirname(fullPath), importPath + (importPath.endsWith('.ts') ? '' : '.ts'));
          const importTsxPath = path.resolve(path.dirname(fullPath), importPath + (importPath.endsWith('.tsx') ? '' : '.tsx'));
          
          if (!fs.existsSync(importFullPath) && !fs.existsSync(importTsxPath) && !fs.existsSync(importFullPath + '/index.ts')) {
            console.log(`Error in ${fullPath}: Import not found - ${importPath}`);
          }
        }
      }
    }
  }
}

// Start checking from src directory
checkImports(path.resolve(__dirname, '../src'));
console.log('Import check complete');
