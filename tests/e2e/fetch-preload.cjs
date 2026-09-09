const fs = require('node:fs')

const scenario = process.env.TW_STOCK_E2E_SCENARIO || 'success'
const requestLog = process.env.TW_STOCK_E2E_REQUEST_LOG

const stockRows = {
  2330: stock('2330', 'TSMC', 'tse', '1000.00'),
  6547: stock('6547', 'Medigen', 'otc', '42.50'),
  '0050': stock('0050', 'ETF50', 'tse', '180.25'),
  '00679B': stock('00679B', 'USD Bond ETF', 'tse', '29.75'),
  1101: stock('1101', 'Taiwan Cement', 'tse', '-'),
  T00: stock('TAIEX', 'TAIEX', 'tse', '24500.00'),
}

globalThis.fetch = async (input) => {
  const url = decodeURIComponent(String(input))
  if (requestLog) fs.appendFileSync(requestLog, `${url}\n`)

  if (isDirectoryUrl(url)) {
    if (scenario === 'directory-failure') {
      throw new Error('fixture TPEx outage')
    }

    return fixtureResponse({
      body: directoryHtml(),
      json: directoryJson(),
    })
  }

  if (url.includes('getStockInfo.jsp') || url.includes('getOddInfo.jsp')) {
    const symbols = [...url.matchAll(/(tse|otc)_([A-Za-z0-9]+)\.tw/g)]
    return fixtureResponse({
      json: {
        stat: 'OK',
        rtcode: '0000',
        msgArray: symbols.map((match) => {
          const row = stockRows[match[2].toUpperCase()]
          if (row?.ex !== match[1]) return { c: '', tv: '-', s: '-' }
          return url.includes('getOddInfo.jsp')
            ? { ...row, tt: '09:29:49', t: '09:30:00', s: '123', tv: '-' }
            : row
        }),
      },
    })
  }

  if (url.includes('/exchangeReport/STOCK_DAY')) {
    return fixtureResponse({
      json: {
        stat: 'OK',
        data: [
          [
            '115/09/07',
            '1,234',
            '1,234,000',
            '998.00',
            '1,010.00',
            '995.00',
            '1,000.00',
            '+2.00',
            '321',
          ],
        ],
      },
    })
  }

  if (url.includes('/afterTrading/MI_INDEX')) {
    return fixtureResponse({
      json: {
        stat: 'OK',
        tables: [
          {
            title: '每日收盤行情(全部)',
            fields: [],
            data: [
              [
                '2330',
                'TSMC',
                '10,000',
                '',
                '',
                '',
                '',
                '',
                '1,000.00',
                '<p>+</p>',
                '20.00',
              ],
              [
                '1101',
                'Taiwan Cement',
                '8,000',
                '',
                '',
                '',
                '',
                '',
                '40.00',
                '<p>-</p>',
                '1.00',
              ],
            ],
          },
        ],
      },
    })
  }

  if (url.includes('/fund/T86')) {
    return fixtureResponse({ json: institutionalRows('data') })
  }

  if (url.includes('/fund/BFI82U')) {
    return fixtureResponse({
      json: {
        stat: 'OK',
        data: [['Foreign Investors', '1,000', '400', '600']],
      },
    })
  }

  if (url.includes('3itrade_hedge_result.php')) {
    return fixtureResponse({ json: institutionalRows('aaData') })
  }

  if (url.includes('stk_quote_result.php')) {
    return fixtureResponse({
      json: {
        stat: 'OK',
        tables: [
          {
            data: [
              ['6547', 'Medigen', '42.50', '1.50', '', '', '', '', '5,000'],
            ],
          },
        ],
      },
    })
  }

  throw new Error(`No E2E fixture for ${url}`)
}

function stock(code, name, exchange, price) {
  return {
    c: code,
    ch: code === 'TAIEX' ? 't00.tw' : `${code}.tw`,
    n: name,
    nf: name,
    ex: exchange,
    z: price,
    tv: '10',
    s: '10',
    v: '1000',
    y: '980.00',
    o: '990.00',
    h: '1010.00',
    l: '975.00',
    u: '1075.00',
    w: '885.00',
    t: '09:30:00',
    d: '20260904',
  }
}

function institutionalRows(key) {
  return {
    stat: 'OK',
    [key]: [
      [
        '2330',
        'TSMC',
        '2,000',
        '1,000',
        '1,000',
        '800',
        '300',
        '500',
        '200',
        '0',
        '0',
        '1,700',
      ],
      [
        '6547',
        'Medigen',
        '500',
        '200',
        '300',
        '100',
        '50',
        '50',
        '-20',
        '0',
        '0',
        '330',
      ],
    ],
  }
}

function isDirectoryUrl(url) {
  return (
    url.includes('isin/C_public.jsp') ||
    url.includes('openapi.twse.com.tw') ||
    url.includes('openapi.tdcc.com.tw') ||
    url.includes('/openapi/v1/')
  )
}

function isOtcCrawlerUrl(url) {
  return (
    url.includes('strMode=4') ||
    url.includes('tpex.org.tw/openapi') ||
    /(?:t187ap03_O|tpex_mainboard_quotes)/.test(url)
  )
}

function directoryHtml() {
  const rows = [
    ['2330', 'TSMC'],
    ['6547', 'Medigen'],
    ['0050', 'ETF50'],
    ['00679B', 'USD Bond ETF'],
    ['1101', 'Taiwan Cement'],
  ]
  return `<table>${rows
    .map(([code, name]) => `<tr><td>${code} ${name}</td></tr>`)
    .join('')}</table>`
}

function directoryJson() {
  return [
    { 證券代號: '2330', 證券名稱: 'TSMC', 市場別: '上市', 證券狀態: '正常' },
    { 證券代號: '0050', 證券名稱: 'ETF50', 市場別: '上市', 證券狀態: '正常' },
    { 證券代號: '6547', 證券名稱: 'Medigen', 市場別: '上櫃', 證券狀態: '正常' },
    {
      證券代號: '00679B',
      證券名稱: 'USD Bond ETF',
      市場別: '上市',
      證券狀態: '正常',
    },
    {
      證券代號: '1101',
      證券名稱: 'Taiwan Cement',
      市場別: '上市',
      證券狀態: '正常',
    },
  ]
}

function fixtureResponse({ body, json }) {
  const text = body ?? JSON.stringify(json)
  const bytes = Buffer.from(text)
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'content-type': json ? 'application/json' : 'text/html',
    }),
    json: async () => json ?? JSON.parse(text),
    text: async () => text,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  }
}
