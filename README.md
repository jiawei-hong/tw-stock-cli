# tw-stock

This command use in my daily qucikly search stock information.

# How to install:

```js
npm install -g tw-stock
```

# How to update stock.json:

```shell
tw-stock update
```

# How to use:

```shell
tw-stock stock [stock_code]
```

`[stock_code]` input your search tw_stock_code

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

# How to search tw-stock index:

```shell
tw-stock index [index]
```

| Index | Description        |
| ----- | ------------------ |
| TAIEX | search taiex index |
| TWO   | search two index   |
| FRMSA | search frmsa index |

| Options       | Description                                            |
| ------------- | ------------------------------------------------------ |
| -m --multiple | search multiple stock index                            |
| -t --time     | user can input startDate and endDate filter chart data |
| -c --chart    | draw index chart on today                              |

# How to use favorite:

```shell
tw-stock favorite [code]
```

`[code]` input your add or delete stockCode

| Options     | Description                        |
| ----------- | ---------------------------------- |
| -c --create | create favorite file.              |
| -a --add    | add stockCode in favorite file.    |
| -d --delete | delete stockCode in favorite file. |

# Search Tse Stock

![Search_TSE_Stock](/images/TSE.png)

# Search Otc Stock

![Search_OTC_Stock](/images/OTC.png)

# Search Multiple Stock

![Search_MULTIPLE_Stock](/images/MULTIPLE.png)
