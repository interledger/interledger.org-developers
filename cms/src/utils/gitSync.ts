import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

function escapeForShell(str: string): string {
  return str.replace(/'/g, "'\\''")
}

/**
 * Pulls latest changes, stages the filepath, commits, and pushes.
 * Resolves even on failure so Strapi saves content.
 */
export async function gitCommitAndPush(
  filepath: string,
  message: string
): Promise<void> {
  if (process.env.STRAPI_DISABLE_GIT_SYNC === 'true') {
    console.log('⏭️  Git sync disabled via STRAPI_DISABLE_GIT_SYNC')
    return
  }

  const projectRoot = path.resolve(process.cwd(), '..') // repo root above /cms
  const safeMessage = escapeForShell(message)
  const safeFilepath = escapeForShell(filepath)

  // Always include public/uploads if it exists so media changes are committed
  const uploadsDir = path.join(projectRoot, 'public', 'uploads')
  const addPaths = [safeFilepath]
  if (fs.existsSync(uploadsDir)) {
    const uploadsRelative = escapeForShell(
      path.relative(projectRoot, uploadsDir)
    )
    addPaths.push(uploadsRelative)
  }

  return new Promise((resolve) => {
    const commands = [
      `git add ${addPaths.map((p) => `'${p}'`).join(' ')}`,
      `git commit -m '${safeMessage}'`,
      'git pull --rebase',
      'git push'
    ].join(' && ')

    exec(commands, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.error(`⚠️  Git sync failed: ${error.message}`)
        if (stderr) console.error(`stderr: ${stderr}`)
        resolve()
        return
      }
      console.log(`✅ Git sync complete: ${message}`)
      if (stdout) console.log(stdout)
      resolve()
    })
  })
}
