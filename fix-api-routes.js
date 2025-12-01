#!/usr/bin/env node
/**
 * Script to add 'export const dynamic = force-dynamic' to all API routes
 * This prevents build-time execution of routes that require environment variables
 */

const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.js') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixApiRoutes() {
  const apiDir = path.join(process.cwd(), 'app', 'api');

  if (!fs.existsSync(apiDir)) {
    console.error('❌ app/api directory not found');
    return;
  }

  // Find all route.js files in app/api
  const files = findRouteFiles(apiDir);

  console.log(`Found ${files.length} API route files`);

  let updatedCount = 0;

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8');

      // Skip if already has dynamic export
      if (content.includes('export const dynamic')) {
        console.log(`⏭️  Skipped (already has dynamic): ${path.relative(process.cwd(), file)}`);
        continue;
      }

      // Find the first export async function
      const exportMatch = content.match(/^export async function/m);

      if (!exportMatch) {
        console.log(`⚠️  Warning: No export async function found in ${path.relative(process.cwd(), file)}`);
        continue;
      }

      // Add dynamic export before the first export async function
      content = content.replace(
        /^export async function/m,
        `// Force dynamic rendering to prevent build-time execution\nexport const dynamic = 'force-dynamic'\n\nexport async function`
      );

      fs.writeFileSync(file, content, 'utf-8');
      updatedCount++;
      console.log(`✅ Updated: ${path.relative(process.cwd(), file)}`);

    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✅ Done! Updated ${updatedCount} files`);
}

fixApiRoutes();
