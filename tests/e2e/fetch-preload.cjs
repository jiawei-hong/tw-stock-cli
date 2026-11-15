const fs = require('node:fs')

const scenario = process.env.TW_STOCK_E2E_SCENARIO || 'success'
const requestLog = process.env.TW_STOCK_E2E_REQUEST_LOG
const terminalColumns = Number(process.env.TW_STOCK_E2E_COLUMNS)

if (Number.isFinite(terminalColumns) && terminalColumns > 0) {
  Object.defineProperty(process.stdout, 'columns', {
    configurable: true,
    value: terminalColumns,
  })
}

const stockRows = {
  2330: stock('2330', 'TSMC', 'tse', '1000.00'),
  6488: stock('6488', 'GlobalWafers', 'otc', '400.00'),
  6547: stock('6547', 'Medigen', 'otc', '42.50'),
  '0050': stock('0050', 'ETF50', 'tse', '180.25'),
  '00679B': stock('00679B', 'USD Bond ETF', 'tse', '29.75'),
  1101: stock('1101', 'Taiwan Cement', 'tse', '-'),
  T00: stock('TAIEX', 'TAIEX', 'tse', '24500.00'),
}

globalThis.fetch = async (input) => {
  const url = decodeURIComponent(String(input))
  if (requestLog) fs.appendFileSync(requestLog, `${url}\n`)

  if (
    scenario === 'overview-all-failure' ||
    (scenario === 'overview-quote-failure' && url.includes('getStockInfo.jsp'))
  ) {
    return new Response('Unavailable', { status: 400 })
  }

  if (url.includes('/tpex_exright_prepost')) {
    return fixtureResponse({
      json: [
        {
          ExRrightsExDividendDate: '1150918',
          SecuritiesCompanyCode: '6488',
          CompanyName: 'GlobalWafers',
          ExRrightsExDividend: '息',
          CashDividend: '5',
          StockDividendRatio: '',
        },
      ],
    })
  }

  if (
    url.includes('/tpex_disposal_information') ||
    url.includes('/tpex_trading_warning_information') ||
    url.includes('/tpex_spendi_history')
  ) {
    return fixtureResponse({ json: [] })
  }

  if (url.includes('/tpex_mainboard_peratio_analysis')) {
    return fixtureResponse({
      json: [
        {
          Date: '1150915',
          SecuritiesCompanyCode: '6488',
          CompanyName: 'GlobalWafers',
          PriceEarningRatio: '15',
          YieldRatio: '4',
          PriceBookRatio: '2',
        },
      ],
    })
  }

  if (url.includes('/mopsfin_t187ap05_O')) {
    return fixtureResponse({
      json: [
        {
          公司代號: '6488',
          公司名稱: 'GlobalWafers',
          資料年月: '11508',
          '營業收入-當月營收': '5000',
          '營業收入-去年同月增減(%)': '12',
        },
      ],
    })
  }

  if (url.includes('/mopsfin_t187ap06_O_ci')) {
    return fixtureResponse({
      json: [
        {
          公司代號: '6488',
          公司名稱: 'GlobalWafers',
          年度: '115',
          季別: '2',
          '基本每股盈餘（元）': '18',
        },
      ],
    })
  }

  if (/t187ap06_[LO]_(basi|bd|fh|ins|mim)/.test(url)) {
    return fixtureResponse({ json: [] })
  }

  if (
    scenario === 'valuation-failure' &&
    url.includes('/exchangeReport/BWIBBU_ALL')
  ) {
    return fixtureResponse({ json: { invalid: true } })
  }

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

  if (
    (url.includes('/exchangeReport/STOCK_DAY') ||
      url.includes('/afterTrading/tradingStock')) &&
    scenario.startsWith('chart')
  ) {
    const parsed = new URL(url)
    const date = parsed.searchParams.get('date').replaceAll('/', '')
    const month = date.slice(0, 6)
    if (scenario === 'chart-failure')
      return new Response('Unavailable', { status: 400 })
    const rows =
      scenario === 'chart-empty'
        ? []
        : Array.from({ length: 20 }, (_, index) => [
            `${Number(month.slice(0, 4)) - 1911}/${month.slice(4)}/${String(
              index + 1
            ).padStart(2, '0')}`,
            '1000',
            '100000',
            '100',
            '110',
            '90',
            String(100 + index),
            '1',
            '100',
          ])
    return fixtureResponse({
      json: url.includes('tradingStock')
        ? { stat: 'ok', tables: [{ data: rows }] }
        : { stat: 'OK', data: rows },
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

  if (url.includes('/holidaySchedule/holidaySchedule')) {
    return fixtureResponse({
      json: [
        {
          Name: 'Mid-Autumn Festival',
          Date: '1150925',
          Description: '依規定放假1日。',
        },
        {
          Name: '國曆新年開始交易日',
          Date: '1150102',
          Description: '國曆新年開始交易。',
        },
      ],
    })
  }

  if (url.includes('/exchangeReport/TWT48U_ALL')) {
    return fixtureResponse({
      json: [
        {
          Date: '1150918',
          Code: '2330',
          Name: 'TSMC',
          Exdividend: '息',
          CashDividend: '5',
          StockDividendRatio: '',
        },
      ],
    })
  }

  if (url.includes('/announcement/punish')) {
    return fixtureResponse({
      json: [
        {
          Code: '2330',
          Name: 'Cross-month disposition',
          DispositionPeriod: '115/08/28～115/09/05',
          ReasonsOfDisposition: 'fixture',
          DispositionMeasures: '處置',
        },
        {
          Code: '2330',
          Name: 'Expired disposition',
          DispositionPeriod: '115/07/01～115/07/10',
          ReasonsOfDisposition: 'fixture',
          DispositionMeasures: '處置',
        },
      ],
    })
  }

  if (url.includes('/announcement/notice')) {
    return fixtureResponse({
      json: [
        {
          Code: '2330',
          Name: 'Expired notice',
          Date: '1150701',
          TradingInfoForAttention: 'fixture',
        },
      ],
    })
  }

  if (url.includes('/exchangeReport/TWTAWU')) {
    return fixtureResponse({
      json: [
        {
          Code: '2330',
          Name: 'Expired halt',
          TradingHaltDate: '1150701',
          TradingResumptionDate: '1150702',
        },
      ],
    })
  }

  if (url.includes('/exchangeReport/BWIBBU_ALL')) {
    return fixtureResponse({
      json: [
        {
          Date: '1150915',
          Code: '2330',
          Name: 'TSMC',
          PEratio: '25',
          DividendYield: '2',
          PBratio: '7',
        },
      ],
    })
  }

  if (url.includes('/opendata/t187ap05_L')) {
    return fixtureResponse({
      json: [
        {
          公司代號: '2330',
          公司名稱: 'TSMC',
          資料年月: '11508',
          '營業收入-當月營收': '1000',
          '營業收入-去年同月增減(%)': '10',
        },
      ],
    })
  }

  if (url.includes('/opendata/t187ap06_L_ci')) {
    return fixtureResponse({
      json: [
        {
          公司代號: '2330',
          公司名稱: 'TSMC',
          年度: '115',
          季別: '2',
          '基本每股盈餘（元）': '20',
        },
      ],
    })
  }

  if (
    scenario === 'screen-failure' &&
    (url.includes('/afterTrading/MI_INDEX') ||
      url.includes('/afterTrading/dailyQuotes'))
  ) {
    return new Response('Unavailable', { status: 400 })
  }

  if (url.includes('/afterTrading/MI_INDEX')) {
    return fixtureResponse({
      json: {
        stat: 'OK',
        date: '20260907',
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
    return fixtureResponse({ json: twseInstitutionalRows() })
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
    return fixtureResponse({ json: tpexInstitutionalRows() })
  }

  if (
    url.includes('stk_quote_result.php') ||
    url.includes('/afterTrading/dailyQuotes')
  ) {
    return fixtureResponse({
      json: {
        stat: 'ok',
        date: '20260907',
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

const INSTITUTIONAL_STOCKS = [
  // code, name, foreign net, trust net, dealer net (total = sum)
  ['6488', 'GlobalWafers', 300, 50, -20],
  ['2330', 'TSMC', 1000, 500, 200],
  ['6547', 'Medigen', 300, 50, -20],
]

const shares = (value) => value.toLocaleString('en-US')

// TWSE T86 layout: 19 columns, foreign 2-4, foreign dealer 5-7, trust 8-10,
// dealer 11 (proprietary 12-14, hedge 15-17), total 18.
function twseInstitutionalRows() {
  return {
    stat: 'OK',
    data: INSTITUTIONAL_STOCKS.map(([code, name, foreign, trust, dealer]) => [
      code,
      name,
      '0',
      '0',
      shares(foreign),
      '0',
      '0',
      '0',
      '0',
      '0',
      shares(trust),
      shares(dealer),
      '0',
      '0',
      shares(dealer),
      '0',
      '0',
      '0',
      shares(foreign + trust + dealer),
    ]),
  }
}

// TPEx 3itrade_hedge_result layout: 24 columns in tables[0].data, foreign
// total 8-10, trust 11-13, dealer total 20-22, total 23.
function tpexInstitutionalRows() {
  return {
    stat: 'ok',
    tables: [
      {
        data: INSTITUTIONAL_STOCKS.map(
          ([code, name, foreign, trust, dealer]) => [
            code,
            name,
            '0',
            '0',
            shares(foreign),
            '0',
            '0',
            '0',
            '0',
            '0',
            shares(foreign),
            '0',
            '0',
            shares(trust),
            '0',
            '0',
            shares(dealer),
            '0',
            '0',
            '0',
            '0',
            '0',
            shares(dealer),
            shares(foreign + trust + dealer),
          ]
        ),
      },
    ],
  }
}

function isDirectoryUrl(url) {
  return (
    url.includes('isin/C_public.jsp') ||
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
