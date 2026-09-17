import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const cli = path.resolve(__dirname, '../../build/index.js')
let directory: string
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'tw-stock-chart-screen-'))
})
afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

async function run(args: string[]): Promise<string> {
  const result = await exec(process.execPath, [cli, ...args], {
    cwd: directory,
    env: { ...process.env, XDG_CONFIG_HOME: path.join(directory, 'config') },
    timeout: 50_000,
  })
  expect(result.stdout).not.toContain('Failure:')
  return result.stdout
}

it.each([
  ['2330', 'tse'],
  ['6488', 'otc'],
])('charts real %s monthly closing prices', async (code, market) => {
  const output = await run([
    'stock',
    code,
    '--listed',
    market,
    '--chart',
    '--date',
    '2026-08',
  ])
  expect(output).toContain(code)
  expect(output).toContain('2026-08-')
  expect(output).toContain('區間漲跌幅')
  expect(output).toContain('未還原權息')
  expect(output).not.toContain('NaN')
})

it.each(['tse', 'otc'])(
  'screens real %s data for an exact historical date',
  async (market) => {
    const output = await run([
      'screen',
      '--listed',
      market,
      '--date',
      '2026-09-07',
      '--min-volume',
      '10000',
      '-n',
      '3',
    ])
    expect(output).toContain('2026-09-07')
    expect(output).toContain('顯示 3 筆')
    expect(output).toContain('成交股數')
    expect(output).not.toContain('NaN')
  }
)
