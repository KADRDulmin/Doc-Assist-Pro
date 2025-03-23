const fs = require('fs');
const path = require('path');

/**
 * Check that all required files exist
 */
function checkRequiredFiles() {
  const srcRoot = path.resolve(__dirname, '../src');
  
  // Define critical files that need to exist
  const requiredFiles = [
    'models/index.ts',
    'models/user.model.ts',
    'models/auth.model.ts',
    'services/token.service.ts',
    'services/index.ts',
    'services/api/base-api.service.ts',
    'services/api/auth-api.service.ts',
    'services/api/index.ts',
    'controllers/auth.controller.ts',
    'controllers/index.ts',
    'hooks/useAuth.ts'
  ];
  
  console.log('Checking for required files...');
  let allFilesExist = true;
  
  // Check each file
  for (const file of requiredFiles) {
    const fullPath = path.join(srcRoot, file);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} is missing`);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    console.log('\nAll required files exist! ✨');
  } else {
    console.log('\n⚠️ Some files are missing. Please create them or check your import paths.');
  }
}

checkRequiredFiles();
