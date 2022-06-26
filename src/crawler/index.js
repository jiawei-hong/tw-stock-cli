import axios from 'axios'
import Cheerio from 'cheerio'
import iconv from 'iconv-lite'
import Text from '../lib/text'
import FilePath from '../lib/filePath'

class Crawler {
  constructor() {
    this.urls = {
      tse: 'http://isin.twse.com.tw/isin/C_public.jsp?strMode=2',
      otc: 'http://isin.twse.com.tw/isin/C_public.jsp?strMode=4',
    }

    this.data = {}
  }

  async execute() {
    for (let category in this.urls) {
      const html = await axios.get(this.urls[category], {
        responseType: 'arraybuffer',
        transformResponse: [(data) => iconv.decode(Buffer.from(data), 'big5')],
      })
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

    if (FilePath.stock.exist()) {
      console.log(Text.green('Stock list created successfully.'))
    } else {
      console.log(Text.red('Stock list is existed.'))
    }
  }
}

export default Crawler
