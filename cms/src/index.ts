import fs from 'fs';
import path from 'path';

function copySchemas() {
  const srcDir = path.join(__dirname, '../../src');
  const destDir = path.join(__dirname);

  function copyDir(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else if (entry.name.endsWith('.json')) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  try {
    copyDir(srcDir, destDir);
    console.log('✅ Schema files copied successfully');
  } catch (error) {
    console.error('❌ Error copying schema files:', error);
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi } */) {
    // Copy schema JSON files after TypeScript compilation
    copySchemas();
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Ensure database directory exists with proper permissions
    // Default database path is .tmp/data.db relative to process.cwd()
    const dbDir = path.resolve(process.cwd(), '.tmp');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true, mode: 0o775 });
    } else {
      // Ensure directory has write permissions
      try {
        fs.chmodSync(dbDir, 0o775);
      } catch (error) {
        // Ignore permission errors if we can't change them
      }
    }
    
    // If database file exists, ensure it has write permissions
    const dbPath = path.join(dbDir, 'data.db');
    if (fs.existsSync(dbPath)) {
      try {
        fs.chmodSync(dbPath, 0o664);
      } catch (error) {
        // Ignore permission errors if we can't change them
      }
    }
  },
};
