import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const cliPath = path.resolve(__dirname, '../../build/index.js')
const symbols = [
  { code: '2330', category: 'tse', market: '上市' },
  { code: '6547', category: 'otc', market: '上櫃' },
] as const
const numericPrice = /^\d+(?:\.\d+)?$/
const tradeTime = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{8}$/.test(value)) return false
  const date = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`
  const parsed = new Date(`${date}T00:00:00Z`)
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  )
}

async function fetchMixedQuotes(): Promise<JsonRecord[]> {
  const url = new URL('https://mis.twse.com.tw/stock/api/getStockInfo.jsp')
  url.search = new URLSearchParams({
    ex_ch: symbols
      .flatMap(({ code }) => [`tse_${code}.tw`, `otc_${code}.tw`])
      .join('|'),
    json: '1',
    delay: '0',
  }).toString()
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  })
  expect(response.ok, `MIS returned HTTP ${response.status}`).toBe(true)
  const payload: unknown = await response.json()
  if (
    !isRecord(payload) ||
    payload.rtcode !== '0000' ||
    !isRecord(payload.queryTime)
  ) {
    throw new Error(`Invalid MIS response: ${JSON.stringify(payload)}`)
  }
  expect(validDate(payload.queryTime.sysDate), 'MIS server date').toBe(true)
  expect(payload.queryTime.sysTime).toMatch(tradeTime)
  if (!Array.isArray(payload.msgArray) || !payload.msgArray.every(isRecord)) {
    throw new Error('MIS msgArray must contain objects')
  }
  const rows = payload.msgArray
  const queryTime = payload.queryTime
  return symbols.map(({ code, category }) => {
    const matches = rows.filter(
      (row: JsonRecord) => row.c === code && row.ex === category
    )
    expect(matches, `MIS quote for ${category}_${code}`).toHaveLength(1)
    const quote = matches[0] as JsonRecord
    expect(typeof quote.n).toBe('string')
    expect((quote.n as string).trim()).not.toBe('')
    expect(
      quote.z == null ||
        quote.z === '' ||
        quote.z === '-' ||
        (typeof quote.z === 'string' && numericPrice.test(quote.z)),
      `MIS price for ${category}_${code}`
    ).toBe(true)
    const time = quote.tt ?? quote.t
    expect(
      quote.d == null ||
        quote.d === '' ||
        quote.d === '-' ||
        validDate(quote.d),
      `MIS trade date for ${category}_${code}`
    ).toBe(true)
    expect(
      time == null ||
        time === '' ||
        time === '-' ||
        (typeof time === 'string' && tradeTime.test(time)),
      `MIS trade time for ${category}_${code}`
    ).toBe(true)
    console.info(
      `${category}_${code}: name=${quote.n}, price=${quote.z ?? '-'}, date=${
        quote.d ?? '-'
      }, tradeTime=${time ?? '-'}, server=${queryTime.sysDate} ${
        queryTime.sysTime
      }`
    )
    return quote
  })
}

async function runCli(cwd: string, args: string[]): Promise<string> {
  const env: NodeJS.ProcessEnv = { ...process.env, TERM: 'dumb' }
  delete env.NODE_OPTIONS
  delete env.NODE_PATH
  const result = await execFileAsync(process.execPath, [cliPath, ...args], {
    cwd,
    env,
    timeout: 30_000,
    killSignal: 'SIGKILL',
    maxBuffer: 1024 * 1024,
  })
  const output = `${result.stdout}${result.stderr}`.replace(
    /\u001b\[[0-9;]*m/g,
    ''
  )
  expect(output, `CLI ${args.join(' ')}`).not.toContain('Failure:')
  return output
}

function assertQuoteOutput(output: string, quotes: JsonRecord[]): void {
  expect(output).toContain('成交時間 (台北)')
  expect(output).toContain('報價狀態')
  for (const [index, { code, market }] of symbols.entries()) {
    const rows = output
      .split('\n')
      .map((line) =>
        line
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim())
      )
      .filter((cells) => cells[0] === code)
    expect(rows, `CLI row for ${code}`).toHaveLength(1)
    const cells = rows[0]
    expect(cells[1]).toBe(market)
    expect(cells[2]).toBe((quotes[index].n as string).trim())
    const price = cells[3].replace(/,/g, '')
    const timestamp = cells[12]
    const status = cells[13]
    expect(timestamp).toMatch(
      /^(?:-|\d{4}-\d{2}-\d{2} (?:-|(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d))$/
    )
    if (timestamp !== '-') {
      expect(validDate(timestamp.slice(0, 10).replace(/-/g, ''))).toBe(true)
    }
    if (price === '-' || price === '') {
      expect(status).toBe('無成交價')
    } else {
      expect(price).toMatch(numericPrice)
      expect(
        timestamp === '-' ? ['日期未知'] : ['今日成交', '前期成交', '日期異常']
      ).toContain(status)
    }
    console.info(
      `CLI ${code}: price=${
        price || '-'
      }, timestamp=${timestamp}, status=${status}`
    )
  }
}

describe('live MIS and built CLI workflows', () => {
  let cwd: string

  beforeEach(async () => {
    cwd = await mkdtemp(path.join(tmpdir(), 'tw-stock-live-'))
  })

  afterEach(async () => {
    if (cwd) await rm(cwd, { recursive: true, force: true })
  })

  it('resolves both markets in one direct MIS request and quotes them with --multiple', async () => {
    const quotes = await fetchMixedQuotes()
    assertQuoteOutput(
      await runCli(cwd, ['stock', '2330-6547', '--multiple']),
      quotes
    )
    expect(await readdir(cwd)).toEqual([])
  }, 60_000)

  it('creates, adds, lists, quotes, and deletes mixed-market favorites', async () => {
    const quotes = await fetchMixedQuotes()
    const favoritePath = path.join(cwd, 'favorite.json')
    expect(await runCli(cwd, ['favorite', 'create'])).toContain(
      'Create favorite file is created!'
    )
    expect(JSON.parse(await readFile(favoritePath, 'utf8'))).toEqual({
      stockCodes: [],
    })
    for (const { code } of symbols) {
      expect(await runCli(cwd, ['favorite', 'add', code])).toContain(
        'added to the favorite list'
      )
    }
    const saved = await readFile(favoritePath, 'utf8')
    expect(JSON.parse(saved)).toEqual({
      stockCodes: symbols.map(({ code }) => code),
    })
    const listed = await runCli(cwd, ['favorite', 'list'])
    for (const quote of quotes) {
      expect(listed).toContain((quote.n as string).trim())
      expect(listed).toContain(quote.c)
    }
    expect(await readFile(favoritePath, 'utf8')).toBe(saved)
    assertQuoteOutput(await runCli(cwd, ['stock', '--favorite']), quotes)
    expect(await readFile(favoritePath, 'utf8')).toBe(saved)
    expect(await runCli(cwd, ['favorite', 'delete', '2330'])).toContain(
      'removed from favorite list'
    )
    expect(JSON.parse(await readFile(favoritePath, 'utf8'))).toEqual({
      stockCodes: ['6547'],
    })
    expect(await readdir(cwd)).toEqual(['favorite.json'])
  }, 240_000)
})
