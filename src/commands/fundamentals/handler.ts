import { table } from 'table'

import {
  formatRocDate,
  formatRocMonth,
  getTwseOpenData,
} from '@/services/twse-openapi'
import { tableConfig } from '@/utils/table'
import { displayFailed } from '@/utils/text'

type Valuation = {
  Date: string
  Code: string
  Name: string
  PEratio: string
  DividendYield: string
  PBratio: string
}
type Revenue = Record<string, string>
type Income = Record<string, string>

class Fundamentals {
  constructor(private code: string) {}

  initialize(): Promise<void> {
    return this.execute().catch((error) => displayFailed(String(error)))
  }

  async execute(): Promise<void> {
    const code = this.code.toUpperCase()
    const [valuations, revenues, incomes] = await Promise.all([
      getTwseOpenData<Valuation>('exchangeReport/BWIBBU_ALL'),
      getTwseOpenData<Revenue>('opendata/t187ap05_L'),
      getTwseOpenData<Income>('opendata/t187ap06_L_ci'),
    ])
    const valuation = valuations.find((item) => item.Code === code)
    const revenue = revenues.find((item) => item['公司代號'] === code)
    const income = incomes.find((item) => item['公司代號'] === code)
    if (!valuation && !revenue && !income) {
      throw new Error(`No TWSE fundamentals found for ${code}`)
    }
    const name =
      valuation?.Name ?? revenue?.['公司名稱'] ?? income?.['公司名稱'] ?? code
    console.log(
      table(
        [
          ['項目', '數值', '資料期間'],
          ['公司', `${code} ${name}`, '-'],
          [
            '本益比',
            valuation?.PEratio || '-',
            formatRocDate(valuation?.Date ?? ''),
          ],
          [
            '殖利率 (%)',
            valuation?.DividendYield || '-',
            formatRocDate(valuation?.Date ?? ''),
          ],
          [
            '股價淨值比',
            valuation?.PBratio || '-',
            formatRocDate(valuation?.Date ?? ''),
          ],
          [
            '月營收 (千元)',
            revenue?.['營業收入-當月營收'] || '-',
            formatRocMonth(revenue?.['資料年月'] ?? ''),
          ],
          [
            '年增率 (%)',
            revenue?.['營業收入-去年同月增減(%)'] || '-',
            formatRocMonth(revenue?.['資料年月'] ?? ''),
          ],
          [
            '基本 EPS',
            income?.['基本每股盈餘（元）'] || '-',
            `${income?.['年度'] ? Number(income['年度']) + 1911 : '-'} Q${
              income?.['季別'] || '-'
            }`,
          ],
        ],
        tableConfig
      )
    )
  }
}

export default Fundamentals
