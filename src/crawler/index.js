const { default: axios } = require('axios')
const fs = require('fs')
const Cheerio = require('cheerio')
const iconv = require('iconv-lite')
const Text = require('../lib/text')

class Crawler {
  constructor() {
    this.urls = {
      tse: 'http://isin.twse.com.tw/isin/C_public.jsp?strMode=2',
      otc: 'http://isin.twse.com.tw/isin/C_public.jsp?strMode=4',
    }

    this.data = {}
  }

  async update() {
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

    fs.writeFileSync(`${__dirname}/../stock.json`, JSON.stringify(this.data))

    console.log(Text.green('Stock list created successfully.'))
  }
}

module.exports = Crawler
