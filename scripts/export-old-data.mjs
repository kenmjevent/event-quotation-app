import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const envPath = path.join(root, '.env.local')

if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env.local not found')
  process.exit(1)
}

const envText = fs.readFileSync(envPath, 'utf8')

function getEnvValue(name) {
  const line = envText
    .split(/\r?\n/)
    .find((row) => row.trim().startsWith(`${name}=`))

  if (!line) return ''

  return line
    .substring(line.indexOf('=') + 1)
    .trim()
    .replace(/^["']|["']$/g, '')
}

const supabaseUrl = getEnvValue(
  'NEXT_PUBLIC_SUPABASE_URL'
)

const supabaseKey = getEnvValue(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
)

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'ERROR: Supabase URL or key missing from .env.local'
  )
  process.exit(1)
}

console.log('Using old Supabase:')
console.log(supabaseUrl)
console.log('')

const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

const tables = [
  'materials',
  'customers',
  'quotations',
  'quotation_materials',
  'quotation_items',
  'quotation_logs',
  'labour_rates',
  'logistics_rates',
  'profiles',
]

const backupDir = path.join(
  root,
  'supabase-backup'
)

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, {
    recursive: true,
  })
}

const summary = []

for (const table of tables) {
  console.log(`Exporting ${table}...`)

  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')

    if (error) {
      console.log(
        `  FAILED: ${error.message}`
      )

      summary.push({
        table,
        status: 'FAILED',
        rows: 0,
        error: error.message,
      })

      continue
    }

    const rows = data || []

    const outputPath = path.join(
      backupDir,
      `${table}.json`
    )

    fs.writeFileSync(
      outputPath,
      JSON.stringify(rows, null, 2),
      'utf8'
    )

    console.log(
      `  OK: ${rows.length} row(s)`
    )

    summary.push({
      table,
      status: 'OK',
      rows: rows.length,
    })
  } catch (err) {
    console.log(
      `  ERROR: ${err.message}`
    )

    summary.push({
      table,
      status: 'ERROR',
      rows: 0,
      error: err.message,
    })
  }
}

const summaryPath = path.join(
  backupDir,
  '_export-summary.json'
)

fs.writeFileSync(
  summaryPath,
  JSON.stringify(summary, null, 2),
  'utf8'
)

console.log('')
console.log('==============================')
console.log('EXPORT COMPLETED')
console.log('==============================')

for (const item of summary) {
  console.log(
    `${item.table}: ${item.status} - ${item.rows} row(s)`
  )
}

console.log('')
console.log(
  `Backup folder: ${backupDir}`
)