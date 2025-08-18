import fs from 'fs'
import path from 'path'

const baseDir = path.resolve(__dirname, '../../data')

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export const readUserData = async <T = any>(category: string, login: string, fallback: T): Promise<T> => {
  const dir = path.join(baseDir, category)
  const file = path.join(dir, `${login}.json`)
  try {
    ensureDir(dir)
    if (!fs.existsSync(file)) return fallback
    const raw = await fs.promises.readFile(file, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const writeUserData = async <T = any>(category: string, login: string, data: T): Promise<void> => {
  const dir = path.join(baseDir, category)
  const file = path.join(dir, `${login}.json`)
  ensureDir(dir)
  await fs.promises.writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
}

