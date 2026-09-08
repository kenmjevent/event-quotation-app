import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

/*
  NEW SUPABASE PROJECT
*/
const NEW_SUPABASE_URL =
  'https://ocoyfogausmitbhuxjag.supabase.co'

const NEW_SUPABASE_KEY =
  'sb_publishable_HGllrpnYC6va2oLpvbN2Bg_xBT9Ym5l'

const supabase = createClient(
  NEW_SUPABASE_URL,
  NEW_SUPABASE_KEY
)

const root = process.cwd()

const backupDir = path.join(
  root,
  'supabase-backup'
)

if (!fs.existsSync(backupDir)) {
  console.error(
    'ERROR: supabase-backup folder not found.'
  )

  console.error(
    `Expected folder: ${backupDir}`
  )

  process.exit(1)
}

function readBackup(table) {
  const filePath = path.join(
    backupDir,
    `${table}.json`
  )

  if (!fs.existsSync(filePath)) {
    console.log(
      `${table}: backup file not found - skipped`
    )

    return []
  }

  try {
    const content = fs.readFileSync(
      filePath,
      'utf8'
    )

    return JSON.parse(content)
  } catch (error) {
    console.error(
      `${table}: cannot read JSON`
    )

    console.error(error.message)

    return []
  }
}

async function checkExistingRows(
  table,
  rows
) {
  if (!rows || rows.length === 0) {
    return []
  }

  const rowsWithId = rows.filter(
    (row) => row.id
  )

  if (rowsWithId.length === 0) {
    return rows
  }

  const ids = rowsWithId.map(
    (row) => row.id
  )

  const { data, error } = await supabase
    .from(table)
    .select('id')
    .in('id', ids)

  if (error) {
    console.log(
      `${table}: existing-row check failed, continuing import`
    )

    return rows
  }

  const existingIds = new Set(
    (data || []).map(
      (row) => row.id
    )
  )

  return rows.filter(
    (row) =>
      !row.id ||
      !existingIds.has(row.id)
  )
}

async function insertRows(
  table,
  rows
) {
  if (!rows || rows.length === 0) {
    console.log(
      `${table}: 0 rows - skipped`
    )

    return
  }

  const rowsToInsert =
    await checkExistingRows(
      table,
      rows
    )

  if (rowsToInsert.length === 0) {
    console.log(
      `${table}: all rows already exist - skipped`
    )

    return
  }

  console.log(
    `Importing ${table}...`
  )

  const { error } = await supabase
    .from(table)
    .insert(rowsToInsert)

  if (error) {
    console.error(
      `${table}: FAILED`
    )

    console.error(
      error.message
    )

    throw error
  }

  console.log(
    `${table}: OK - ${rowsToInsert.length} row(s)`
  )
}

async function verifyTable(
  table
) {
  const { count, error } =
    await supabase
      .from(table)
      .select('*', {
        count: 'exact',
        head: true,
      })

  if (error) {
    console.log(
      `${table}: verify failed - ${error.message}`
    )

    return
  }

  console.log(
    `${table}: ${count || 0} row(s) in new database`
  )
}

async function run() {
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'IMPORT OLD DATA TO NEW SUPABASE'
  )
  console.log(
    '================================'
  )
  console.log('')

  console.log(
    `Target: ${NEW_SUPABASE_URL}`
  )

  console.log('')

  const materials =
    readBackup('materials')

  const customers =
    readBackup('customers')

  const quotations =
    readBackup('quotations')

  const quotationMaterials =
    readBackup(
      'quotation_materials'
    )

  const quotationItems =
    readBackup(
      'quotation_items'
    )

  const rawQuotationLogs =
    readBackup(
      'quotation_logs'
    )

  const labourRates =
    readBackup(
      'labour_rates'
    )

  const logisticsRates =
    readBackup(
      'logistics_rates'
    )

  const profiles =
    readBackup('profiles')

  /*
    Some old activity logs may point
    to quotations that were deleted.

    The new database has a foreign key
    from quotation_logs.quotation_id
    to quotations.id.

    If the old quotation no longer exists,
    we preserve the log but set
    quotation_id = null.
  */
  const validQuotationIds = new Set(
    quotations.map(
      (quotation) => quotation.id
    )
  )

  const quotationLogs =
    rawQuotationLogs.map(
      (log) => ({
        ...log,

        quotation_id:
          log.quotation_id &&
          validQuotationIds.has(
            log.quotation_id
          )
            ? log.quotation_id
            : null,
      })
    )

  /*
    Import order is important because
    some tables have foreign keys.
  */

  await insertRows(
    'materials',
    materials
  )

  await insertRows(
    'customers',
    customers
  )

  await insertRows(
    'labour_rates',
    labourRates
  )

  await insertRows(
    'logistics_rates',
    logisticsRates
  )

  await insertRows(
    'profiles',
    profiles
  )

  await insertRows(
    'quotations',
    quotations
  )

  await insertRows(
    'quotation_items',
    quotationItems
  )

  await insertRows(
    'quotation_materials',
    quotationMaterials
  )

  await insertRows(
    'quotation_logs',
    quotationLogs
  )

  console.log('')
  console.log(
    '=============================='
  )
  console.log(
    'VERIFY NEW DATABASE'
  )
  console.log(
    '=============================='
  )
  console.log('')

  await verifyTable(
    'materials'
  )

  await verifyTable(
    'customers'
  )

  await verifyTable(
    'quotations'
  )

  await verifyTable(
    'quotation_materials'
  )

  await verifyTable(
    'quotation_items'
  )

  await verifyTable(
    'quotation_logs'
  )

  await verifyTable(
    'labour_rates'
  )

  await verifyTable(
    'logistics_rates'
  )

  await verifyTable(
    'profiles'
  )

  console.log('')
  console.log(
    '=============================='
  )
  console.log(
    'IMPORT COMPLETED'
  )
  console.log(
    '=============================='
  )
  console.log('')
}

run().catch(
  (error) => {
    console.error('')
    console.error(
      '=============================='
    )
    console.error(
      'IMPORT STOPPED'
    )
    console.error(
      '=============================='
    )

    console.error(
      error?.message ||
      error
    )

    process.exit(1)
  }
)