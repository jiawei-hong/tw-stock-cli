import {
  searchSecurityDirectory,
  Security,
} from '@/services/security-directory'
import { Category, StockOptionProps } from '@/types/stock'
import { responsiveTable } from '@/utils/table'
import { displayFailed } from '@/utils/text'

const SEARCH_QUERY_MISSING =
  'Please provide a stock code or company name after --search.'
const MAX_SEARCH_RESULTS = 20

function marketName(category: Category): string {
  return category === Category.TSE ? '上市 (TSE)' : '上櫃 (OTC)'
}

export function formatSearchResults(securities: Security[]): string[][] {
  return [
    ['股票代號', '公司名稱', '市場'],
    ...securities.map((security) => [
      security.code,
      security.name,
      marketName(security.category),
    ]),
  ]
}

export function getSearchNotFoundMessage(
  query: string,
  category?: Category
): string {
  const market = category ? ` in ${category.toUpperCase()}` : ''
  return `No active stocks matched "${query}"${market}. Try a stock code or a broader company name.`
}

class SearchStock {
  constructor(
    private readonly query: string,
    private readonly options: StockOptionProps
  ) {}

  initialize() {
    if (!this.query.trim()) {
      return displayFailed(SEARCH_QUERY_MISSING)
    }
    this.execute().catch((error) => displayFailed(String(error)))
  }

  async execute() {
    const results = await searchSecurityDirectory(
      this.query,
      this.options.listed
    )
    if (!results.length) {
      return displayFailed(
        getSearchNotFoundMessage(this.query, this.options.listed)
      )
    }
    console.log(
      responsiveTable(
        formatSearchResults(results.slice(0, MAX_SEARCH_RESULTS)),
        0
      )
    )
  }
}

export default SearchStock
