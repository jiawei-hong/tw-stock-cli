import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const repositoryRoot = path.resolve(__dirname, '../..')
const cliPath = path.join(repositoryRoot, 'build/index.js')
const preloadPath = path.join(__dirname, 'fetch-preload.cjs')
let workingDirectory: string
let requestLog: string

type RunResult = {
  output: string
  requests: string[]
}

describe.sequential('built CLI', () => {
  beforeEach(() => {
    workingDirectory = mkdtempSync(path.join(tmpdir(), 'tw-stock-e2e-'))
    requestLog = path.join(workingDirectory, 'requests.log')
  })

  afterEach(() => {
    rmSync(workingDirectory, { recursive: true, force: true })
  })

  it('keeps single-stock lookup independent from the security directory', () => {
    const result = run(['stock', '2330'])

    expect(result.output).toContain('TSMC')
    expect(result.output).toContain('1,000.00')
    expect(result.output).toContain('2026-09-04 09:30:00')
    expect(result.output).toContain('報價狀態')
    expect(result.requests.some((url) => url.includes('tdcc'))).toBe(false)
    expect(exists('stock.json')).toBe(false)
  })

  it('supports the favorite lifecycle without stock.json', () => {
    expect(run(['favorite', 'create']).output).toContain(
      'Create favorite file is created!'
    )
    expect(run(['favorite', 'add', '2330']).output).toContain(
      'added to the favorite list'
    )
    expect(run(['favorite', 'add', '6547']).output).toContain(
      'added to the favorite list'
    )
    const favoritePath = path.join(workingDirectory, 'favorite.json')
    const favoriteBeforeUpdate = readFileSync(favoritePath)
    expect(readFileSync(favoritePath)).toEqual(favoriteBeforeUpdate)
    expect(run(['favorite', 'list']).output).toContain('TSMC')
    expect(run(['favorite', 'list']).output).toContain('Medigen')
    expect(run(['favorite', 'delete', '2330']).output).toContain(
      'removed from favorite list'
    )
    expect(readJson('favorite.json')).toEqual({ stockCodes: ['6547'] })
    expect(exists('stock.json')).toBe(false)
  })

  it('manages favorites without TDCC and accepts unavailable prices', () => {
    run(['favorite', 'create'])
    const added = run(['favorite', 'add', '1101'], 'directory-failure')
    expect(added.requests).toHaveLength(1)
    expect(added.requests[0]).toContain('getStockInfo.jsp')
    const listed = run(['favorite', 'list'], 'directory-failure')
    expect(listed.output).toContain('Taiwan Cement')
    expect(listed.requests).toHaveLength(1)
    expect(readJson('favorite.json')).toEqual({ stockCodes: ['1101'] })
  })

  it('routes mixed, favorite, and leading-zero symbols by their exchange', () => {
    const mixed = run(['stock', '2330-6547-0050-00679B', '--multiple'])
    expect(mixed.output).toContain('TSMC')
    expect(mixed.output).toContain('Medigen')
    expect(mixed.output).toContain('ETF50')
    expect(mixed.output).toContain('USD Bond ETF')
    expect(mixed.output).toContain('1,000.00')
    expect(mixed.output).toContain('42.50')
    expect(mixed.requests.at(-1)).toContain(
      'tse_2330.tw|otc_2330.tw|tse_6547.tw|otc_6547.tw|tse_0050.tw|otc_0050.tw|tse_00679B.tw|otc_00679B.tw'
    )

    writeFileSync(
      path.join(workingDirectory, 'favorite.json'),
      JSON.stringify({ stockCodes: ['0050', '6547'] })
    )
    const favorites = run(['stock', '--favorite'])
    expect(favorites.output).toContain('ETF50')
    expect(favorites.output).toContain('Medigen')
    expect(favorites.requests.at(-1)).toContain(
      'tse_0050.tw|otc_0050.tw|tse_6547.tw|otc_6547.tw'
    )
    expect(favorites.requests).toHaveLength(1)
  })

  it('renders an unavailable current price without losing the stock row', () => {
    const result = run(['stock', '1101'])
    expect(result.output).toContain('Taiwan Cement')
    expect(result.output).toContain('無成交價')
    expect(result.output).toMatch(
      /1101\s*\|\s*上市\s*\|\s*Taiwan Cement\s*\|\s*-\s*\|/
    )
  })

  it('covers representative history, index, rank, and institutional flows', () => {
    const history = run(['stock', '2330', '--date', '2026-09'])
    expect(history.output).toContain('115/09/07')
    expect(history.output).toContain('1,000.00')

    const index = run(['index', 'TAIEX'])
    expect(index.output).toContain('TAIEX')
    expect(index.requests.at(-1)).toContain('tse_t00.tw')

    const rank = run(['rank', '--date', '2026-09-07', '--number', '1'])
    expect(rank.output).toContain('TSMC')
    expect(rank.output).toContain('2.04%')

    const institutional = run(['institutional', '2330', '--date', '2026-09-07'])
    expect(institutional.output).toContain('TSMC')
    expect(institutional.output).toContain('1,700')
  })

  it('quotes mixed markets even when the directory API is unavailable', () => {
    const result = run(
      ['stock', '2330-6547', '--multiple'],
      'directory-failure'
    )

    expect(result.output).toContain('TSMC')
    expect(result.output).toContain('Medigen')
    expect(result.requests).toHaveLength(1)
    expect(exists('stock.json')).toBe(false)
  })
})

function run(args: string[], scenario = 'success'): RunResult {
  writeFileSync(requestLog, '')
  const result = spawnSync(
    process.execPath,
    ['--require', preloadPath, cliPath, ...args],
    {
      cwd: workingDirectory,
      encoding: 'utf8',
      timeout: 10_000,
      env: {
        ...process.env,
        TW_STOCK_E2E_REQUEST_LOG: requestLog,
        TW_STOCK_E2E_SCENARIO: scenario,
      },
    }
  )
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`CLI exited with ${result.status}: ${stripAnsi(output)}`)
  }
  if (stripAnsi(output).includes('Failure:')) {
    throw new Error(`CLI reported failure: ${stripAnsi(output)}`)
  }

  return {
    output: stripAnsi(output),
    requests: readFileSync(requestLog, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean),
  }
}

function readJson(filename: string) {
  return JSON.parse(readFileSync(path.join(workingDirectory, filename), 'utf8'))
}

function exists(filename: string) {
  return require('node:fs').existsSync(path.join(workingDirectory, filename))
}

function runAllowFailure(args: string[], scenario: string): RunResult {
  writeFileSync(requestLog, '')
  const result = spawnSync(
    process.execPath,
    ['--require', preloadPath, cliPath, ...args],
    {
      cwd: workingDirectory,
      encoding: 'utf8',
      timeout: 10_000,
      env: {
        ...process.env,
        TW_STOCK_E2E_REQUEST_LOG: requestLog,
        TW_STOCK_E2E_SCENARIO: scenario,
      },
    }
  )
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`

  if (result.error) throw result.error
  return {
    output: stripAnsi(output),
    requests: readFileSync(requestLog, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean),
  }
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, '')
}
