import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(__dirname, '../..')
const cliPath = path.join(projectRoot, 'build/index.js')

const directoryEndpoint = 'https://openapi.tdcc.com.tw/v1/opendata/1-1'

type Category = 'tse' | 'otc'
type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getField(row: JsonRecord, key: string): string {
  const value = row[key] ?? row[`\ufeff${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

async function fetchJson(url: string): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
  } catch (error) {
    throw new Error(`Network request failed for ${url}: ${String(error)}`)
  }

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new Error(`${url} returned malformed JSON: ${String(error)}`)
  }
}

function requireNonEmptyArray(value: unknown, source: string): JsonRecord[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isRecord)) {
    throw new Error(`${source} response is not a non-empty object array`)
  }

  return value
}

function assertDirectoryContract(rows: JsonRecord[]): void {
  const requiredFields = ['證券代號', '證券名稱', '市場別', '證券狀態']
  const supportedRows = rows.filter((row) =>
    ['上市', '上櫃'].includes(getField(row, '市場別')) &&
    getField(row, '證券狀態') === '正常'
  )
  for (const [index, row] of supportedRows.entries()) {
    for (const fieldName of requiredFields) {
      expect(
        getField(row, fieldName).length > 0,
        `TDCC row ${index} has invalid ${fieldName}`
      ).toBe(true)
    }
  }
}

function selectSymbol(rows: JsonRecord[], category: Category): string {
  const market = category === 'tse' ? '上市' : '上櫃'
  const entry = rows.find(
    (row) =>
      getField(row, '市場別') === market &&
      getField(row, '證券狀態') === '正常' &&
      getField(row, '證券代號').length > 0 &&
      getField(row, '證券名稱').length > 0
  )

  if (!entry) {
    throw new Error(`TDCC contains no valid ${category} symbol`)
  }

  return getField(entry, '證券代號')
}

function taipeiDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value

  return `${part('year')}${part('month')}${part('day')}`
}

function parseMisQueryTime(queryTime: JsonRecord): number {
  const date = queryTime.sysDate
  const time = queryTime.sysTime

  if (
    typeof date !== 'string' ||
    !/^\d{8}$/.test(date) ||
    typeof time !== 'string' ||
    !/^\d{2}:\d{2}:\d{2}$/.test(time)
  ) {
    throw new Error('MIS queryTime date/time contract is malformed')
  }

  const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`
  return Date.parse(`${isoDate}T${time}+08:00`)
}

function validateMisQuote(
  payload: unknown,
  code: string,
  category: Category
): 'current' | 'previous-session' | 'unavailable' {
  if (!isRecord(payload)) {
    throw new Error('MIS response is not an object')
  }
  if (payload.rtcode !== '0000' || !isRecord(payload.queryTime)) {
    throw new Error(`MIS response failed: ${JSON.stringify(payload)}`)
  }

  const queryTimestamp = parseMisQueryTime(payload.queryTime)
  expect(queryTimestamp).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000)
  expect(Date.now() - queryTimestamp).toBeLessThan(7 * 24 * 60 * 60 * 1000)

  const rows = requireNonEmptyArray(payload.msgArray, 'MIS')
  const quote = rows.find((row) => row.c === code && row.ex === category)
  if (!quote) {
    throw new Error(`MIS response does not contain ${category}_${code}`)
  }

  if (
    typeof quote.d !== 'string' ||
    !/^\d{8}$/.test(quote.d) ||
    typeof quote.t !== 'string' ||
    !/^\d{2}:\d{2}:\d{2}$/.test(quote.t)
  ) {
    throw new Error(`MIS quote date/time is malformed for ${category}_${code}`)
  }

  const price = quote.z
  if (price === '-' || price === '') {
    return 'unavailable'
  }
  if (typeof price !== 'string' || !/^\d+(\.\d+)?$/.test(price)) {
    throw new Error(`MIS price is malformed for ${category}_${code}`)
  }
  return quote.d === taipeiDate() ? 'current' : 'previous-session'
}

describe('live market smoke test', () => {
  let cwd: string | undefined
  let symbols: Record<Category, string>

  afterAll(async () => {
    if (cwd) {
      await rm(cwd, { recursive: true, force: true })
    }
  })

  it('validates TDCC and selects current listed and OTC symbols', async () => {
    const rows = requireNonEmptyArray(
      await fetchJson(directoryEndpoint),
      'TDCC'
    )
    assertDirectoryContract(rows)
    cwd = await mkdtemp(path.join(tmpdir(), 'tw-stock-live-'))
    symbols = {
      tse: selectSymbol(rows, 'tse'),
      otc: selectSymbol(rows, 'otc'),
    }
  })

  it.each(['tse', 'otc'] as const)(
    'quotes a downloaded %s symbol through MIS and the CLI',
    async (category) => {
      if (!cwd || !symbols) {
        throw new Error('TDCC smoke test did not produce its test context')
      }

      const code = symbols[category]
      const quoteUrl =
        'https://mis.twse.com.tw/stock/api/getStockInfo.jsp?' +
        new URLSearchParams({
          ex_ch: `${category}_${code}.tw`,
          json: '1',
          delay: '0',
        })
      const payload = await fetchJson(quoteUrl)
      const availability = validateMisQuote(payload, code, category)
      console.info(`${category}_${code}: ${availability}`)

      const childEnv = { ...process.env, TERM: 'dumb' }
      delete childEnv.NODE_OPTIONS
      delete childEnv.NODE_PATH

      const cliQuote = await execFileAsync(
        process.execPath,
        [cliPath, 'stock', code, '--listed', category],
        {
          cwd,
          env: childEnv,
          timeout: 30_000,
        }
      )
      expect(cliQuote.stdout).toContain(code)
      expect(cliQuote.stdout).not.toContain('Failure:')
      expect(['current', 'previous-session', 'unavailable']).toContain(
        availability
      )
    }
  )
})
