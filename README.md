# tw-stock

This command use in my daily quickly search stock information.

## How to install

```js
npm install -g tw-stock
```

## How to crawler stock.json

```shell
tw-stock crawler
```

## How to use

```shell
tw-stock stock [stock_code]
```

| Options       | Description                            |
| ------------- | -------------------------------------- |
| -l --listed   | input this tw_stock_code is tse or otc |
| -m --multiple  | search multiple stock_code             |
| -f --favorite | show stocks in favorite list           |
| -d --date     | search stock history trade             |

> Tips: When you must use date options search stock history trade.

| DateFormat | Description          |
| ---------- | -------------------- |
| YYYY-MM    | get month trade data |
| YYYY-MM-DD | get day trade data   |

## How to search tw-stock index

```shell
tw-stock index [index] // TAIEX, TWO, FRMSA
```

| Options       | Description                                            |
| ------------- | ------------------------------------------------------ |
| -m --multiple | search multiple index                                  |
| -t --time     | user can specify time to draw indices e.g. 0900 1000   |
| -c --chart    | draw index chart on today                              |

## How to use favorite

```shell
tw-stock favorite [code]
```

`[code]` input your add or delete stockCode

| Options     | Description                        |
| ----------- | ---------------------------------- |
| -c --create | create favorite file.              |
| -a --add    | add stockCode in favorite file.    |
| -d --delete | delete stockCode in favorite file. |

## Search Tse Stock

![Search_TSE_Stock](/images/TSE.png)

## Search Otc Stock

![Search_OTC_Stock](/images/OTC.png)

## Search Multiple Stock

![Search_MULTIPLE_Stock](/images/MULTIPLE.png)
