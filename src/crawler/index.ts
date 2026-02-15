import axios from 'axios'
import Cheerio from 'cheerio'
import { decode } from 'iconv-lite'
import { displaySuccess } from '../lib/Text'
import FilePath from '../lib/FilePath'
import { CRAWLER_STOCK_FILE_CREATED } from '../message/Crawler'
import { StockPayload } from '../types/stock'

interface Crawler {
  urls: {
    tse: string
    otc: string
  }
  data: StockPayload
}

class Crawler {
  constructor() {
    this.urls = {
      tse: 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=2',
      otc: 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=4',
    }

    this.data = {}
  }

  async execute() {
    for (let category in this.urls) {
      const html = await axios.get(
        this.urls[category as keyof typeof this.urls],
        {
          responseType: 'arraybuffer',
          transformResponse: [(data) => decode(Buffer.from(data), 'big5')],
        }
      )
      const $ = Cheerio.load(html.data)

      $('tr').each((_, ele) => {
        const stockData = $(ele).find('td').first().text().split(/\s/g)
        const stockDataExistEmptyString =
          stockData.filter((str) => str.length === 0).length > 0

        if (!stockDataExistEmptyString) {
          this.data[stockData[0]] = {
            name: stockData[1],
            category,
          }
        }
      })
    }

    FilePath.stock.write(this.data)

    displaySuccess(CRAWLER_STOCK_FILE_CREATED)
  }
}

export default Crawler
