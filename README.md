# tw-stock

This command use in my daily qucikly search stock information.

# How to install:

```js
npm install -g tw-stock
```

# How to update stock.json:

```sheel
tw-stock update
```

# How to use:

```sheel
tw-stock stock <stock_code>
```

`<stock_code>` input your search tw_stock_code

| Options       | Description                            |
| ------------- | -------------------------------------- |
| -l --listed   | input this tw_stock_code is tse or otc |
| -m --mutiple  | search multiple stock_code             |
| -f --favorite | show stocks in favorite list           |
| -d --date     | search stock history trade             |

> Tips: When you must use date options search stock history trade.

| DateFormat | Description          |
| ---------- | -------------------- |
| YYYY-MM    | get month trade data |
| YYYY-MM-DD | get day trade data   |

# How to search tw-stock index:

```sheel
tw-stock index [index]
```

| Index | Description        |
| ----- | ------------------ |
| TAIEX | search taiex index |
| TWO   | search two index   |
| FRMSA | search frmsa index |

| Options      | Description                                            |
| ------------ | ------------------------------------------------------ |
| -m --mutiple | search multiple stock index                            |
| -d --date    | user can input startDate and endDate filter chart data |
| -c --chart   | draw index chart on today                              |

# How to use favorite:

```sheel
tw-stock favorite
```

| Options     | Description                        |
| ----------- | ---------------------------------- |
| -c --create | create favorite file.              |
| -a --add    | add stockCode in favorite file.    |
| -d --delete | delete stockCode in favorite file. |

# Search Tse Stock

![tse.png](./tse.png)

# Search Otc Stock

![otc.png](./otc.png)

# Search Multiple Stock

![multiple.png](./multiple.png)

# Add Stock in Favorite List

![addStockInFavorite.png](./addStockInFavorite.png)

# Show Favorite List

![showFavoriteList.png](./showFavoriteList.png)
