#!/usr/bin/env node

/**
 * Image Audit Script
 *
 * Scans the uploads folder and reports:
 * - Images missing WebP/AVIF versions
 * - Large unoptimized images
 * - Images without responsive variants
 * - Total size and potential savings
 *
 * Usage:
 *   node scripts/audit-images.js
 */

const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const MAX_SIZE_KB = 500; // Warn if image is larger than this

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function auditImages() {
  console.log(colorize('\n🔍 Image Optimization Audit', 'cyan'));
  console.log(colorize('='.repeat(60), 'cyan'));

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error(colorize(`❌ Uploads directory not found: ${UPLOADS_DIR}`, 'red'));
    process.exit(1);
  }

  const files = fs.readdirSync(UPLOADS_DIR);

  // Categorize files
  const originals = {};
  const webp = new Set();
  const avif = new Set();
  const variants = {};

  let totalSize = 0;
  let totalWebpSize = 0;
  let totalAvifSize = 0;

  files.forEach((file) => {
    const filePath = path.join(UPLOADS_DIR, file);
    const stats = fs.statSync(filePath);

    if (!stats.isFile()) return;

    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);

    totalSize += stats.size;

    // Check if it's a variant (small_, medium_, large_)
    const variantMatch = baseName.match(/^(small|medium|large|xsmall)_(.+)$/);

    if (ext === '.webp') {
      totalWebpSize += stats.size;
      webp.add(variantMatch ? variantMatch[2] : baseName);
    } else if (ext === '.avif') {
      totalAvifSize += stats.size;
      avif.add(variantMatch ? variantMatch[2] : baseName);
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      if (variantMatch) {
        const [, size, name] = variantMatch;
        if (!variants[name]) variants[name] = {};
        variants[name][size] = { file, size: stats.size, ext };
      } else {
        originals[baseName] = { file, size: stats.size, ext };
      }
    }
  });

  // Report statistics
  console.log(colorize('\n📊 Statistics:', 'blue'));
  console.log(`   Total files: ${files.length}`);
  console.log(`   Original images: ${Object.keys(originals).length}`);
  console.log(`   Variants generated: ${Object.keys(variants).length}`);
  console.log(`   WebP versions: ${webp.size}`);
  console.log(`   AVIF versions: ${avif.size}`);
  console.log(`   Total size: ${formatBytes(totalSize)}`);
  console.log(`   WebP size: ${formatBytes(totalWebpSize)} (${((totalWebpSize / totalSize) * 100).toFixed(1)}%)`);
  console.log(`   AVIF size: ${formatBytes(totalAvifSize)} (${((totalAvifSize / totalSize) * 100).toFixed(1)}%)`);

  // Check for missing optimizations
  console.log(colorize('\n⚠️  Missing Optimizations:', 'yellow'));

  let issuesFound = 0;

  Object.entries(originals).forEach(([baseName, { file, size, ext }]) => {
    const issues = [];

    // Check for WebP version
    if (!webp.has(baseName)) {
      issues.push('Missing WebP');
    }

    // Check for AVIF version
    if (!avif.has(baseName)) {
      issues.push('Missing AVIF');
    }

    // Check for variants
    if (!variants[baseName]) {
      issues.push('Missing responsive variants');
    }

    // Check size
    const sizeKB = size / 1024;
    if (sizeKB > MAX_SIZE_KB) {
      issues.push(`Large file (${formatBytes(size)})`);
    }

    if (issues.length > 0) {
      console.log(colorize(`   ⚠ ${file}`, 'yellow'));
      issues.forEach((issue) => {
        console.log(`      - ${issue}`);
      });
      issuesFound++;
    }
  });

  if (issuesFound === 0) {
    console.log(colorize('   ✅ All images are properly optimized!', 'green'));
  } else {
    console.log(colorize(`\n   Found ${issuesFound} image(s) with optimization issues`, 'yellow'));
  }

  // Calculate potential savings
  console.log(colorize('\n💾 Potential Savings:', 'blue'));

  const originalTotal = Object.values(originals).reduce((sum, img) => sum + img.size, 0);
  const potentialWebpSavings = originalTotal * 0.6; // 60% average savings
  const potentialAvifSavings = originalTotal * 0.7; // 70% average savings

  console.log(`   Current original images size: ${formatBytes(originalTotal)}`);
  console.log(`   With WebP: ~${formatBytes(originalTotal - potentialWebpSavings)} (${colorize('60% savings', 'green')})`);
  console.log(`   With AVIF: ~${formatBytes(originalTotal - potentialAvifSavings)} (${colorize('70% savings', 'green')})`);

  // Recommendations
  console.log(colorize('\n💡 Recommendations:', 'cyan'));

  if (webp.size < Object.keys(originals).length) {
    console.log('   • Generate WebP versions for all images');
    console.log('     Run: Upload images via Strapi admin (auto-generates WebP)');
  }

  if (avif.size < Object.keys(originals).length) {
    console.log('   • Generate AVIF versions for all images');
    console.log('     Run: Upload images via Strapi admin (auto-generates AVIF)');
  }

  const largeImages = Object.entries(originals).filter(
    ([, { size }]) => size / 1024 > MAX_SIZE_KB
  );

  if (largeImages.length > 0) {
    console.log(`   • Optimize ${largeImages.length} large image(s)`);
    console.log('     Consider compressing before upload or adjusting quality settings');
  }

  console.log(colorize('\n' + '='.repeat(60), 'cyan'));
  console.log(colorize('✅ Audit complete!\n', 'green'));

  // Exit with error code if issues found
  process.exit(issuesFound > 0 ? 1 : 0);
}

// Run audit
try {
  auditImages();
} catch (error) {
  console.error(colorize('❌ Audit failed:', 'red'), error.message);
  process.exit(1);
}
