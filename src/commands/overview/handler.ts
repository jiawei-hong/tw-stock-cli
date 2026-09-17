import { Category } from '@/types/stock'
import { displayFailed } from '@/utils/text'

import Events from '../events/handler'
import Fundamentals from '../fundamentals/handler'
import Institutional from '../institutional/handler'
import RealtimeStock from '../stock/realtime-handler'

class Overview {
  constructor(private code: string, private market: Category = Category.TSE) {}

  initialize(): Promise<void> {
    return this.execute().catch((error) => displayFailed(String(error)))
  }

  async execute(): Promise<void> {
    const code = this.code.trim().toUpperCase()
    if (!/^[A-Z0-9]{4,6}$/.test(code)) {
      throw new Error('stock code must contain 4 to 6 letters or digits')
    }
    if (this.market !== Category.TSE && this.market !== Category.OTC) {
      throw new Error('market must be tse or otc')
    }
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
    const part = (type: string) =>
      parts.find((item) => item.type === type)!.value
    const date = `${part('year')}-${part('month')}-${part('day')}`
    const month = date.slice(0, 7)

    console.log(`${code} ${this.market.toUpperCase()} 個股摘要`)
    const sections: Array<[string, () => Promise<void>]> = [
      [
        '報價',
        () => new RealtimeStock(code, { listed: this.market }).execute(),
      ],
      ['基本面', () => new Fundamentals(code, this.market).execute()],
      [
        `三大法人（查詢日 ${date}）`,
        () => new Institutional(code, { listed: this.market, date }).execute(),
      ],
      [
        `本月事件（${month}）`,
        () => new Events(code, month, this.market).execute(),
      ],
    ]
    // Keep each section's output together, including its source warnings.
    for (const [label, execute] of sections) {
      console.log(`\n${label}`)
      try {
        await execute()
      } catch (error) {
        displayFailed(`${label} unavailable: ${String(error)}`)
      }
    }
  }
}

export default Overview
