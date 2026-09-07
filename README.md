# tw-stock

A command-line tool for quickly searching Taiwan stock market information, including real-time prices, market indices, and historical trading data.

[![npm version](https://img.shields.io/npm/v/tw-stock)](https://www.npmjs.com/package/tw-stock)
[![license](https://img.shields.io/npm/l/tw-stock)](./LICENSE)

## Installation

```sh
npm install -g tw-stock
```

## Commands

### `stock` — Search stock information

```sh
tw-stock stock [stock_code]
```

| Option                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `-l, --listed <listed>` | Market type: `tse` (default) or `otc`              |
| `-m, --multiple`        | Search multiple stock codes (hyphen-separated)     |
| `-f, --favorite`        | Search stocks from favorite list                   |
| `-o, --oddLot`          | Search odd-lot trading data                        |
| `-d, --date <date>`     | Search historical data (`YYYY-MM` or `YYYY-MM-DD`) |
| `--details`             | Show detailed stock data (default: `true`)         |

**Examples:**

```sh
# Search a single TSE stock
tw-stock stock 2330

# Search an OTC stock
tw-stock stock 6488 -l otc

# Search multiple stocks
tw-stock stock 2330-2317-2454 -m

# Search historical monthly data
tw-stock stock 2330 -d 2025-01

# Search historical daily data
tw-stock stock 2330 -d 2025-01-15
```

Stock quote tables show the exchange trade date/time in Taipei time and a
status: `今日成交` (trade dated today), `前期成交` (earlier session), or
`無成交價` (price unavailable). Missing or invalid dates are marked explicitly.
Today's date alone does not guarantee the quote is current; check its timestamp.

### `index` — Search market indices

```sh
tw-stock index [code]
```

Supported indices: `TAIEX`, `TWO`, `FRMSA`

| Option                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| `-m, --multiple`       | Search multiple indices                       |
| `-t, --time <time...>` | Specify time range (`HHMM` format, 0900–1330) |
| `-c, --chart`          | Display ASCII chart                           |

**Examples:**

```sh
# Search TAIEX (default)
tw-stock index

# Search with ASCII chart
tw-stock index TAIEX -c

# Search multiple indices
tw-stock index TAIEX-TWO -m

# Search within a specific time range
tw-stock index TAIEX -t 0900 1100
```

### `institutional` — Institutional investors buy/sell data

```sh
tw-stock institutional [stock_code]
```

View daily buy/sell data from the three major institutional investors (三大法人買賣超). Without a stock code, displays the summary table.

| Option                  | Description                           |
| ----------------------- | ------------------------------------- |
| `-l, --listed <listed>` | Market type: `tse` (default) or `otc` |
| `-d, --date <date>`     | Search specific date (`YYYY-MM-DD`)   |
| `-n, --number <number>` | Number of results to show             |

**Examples:**

```sh
# Show institutional summary for today
tw-stock institutional

# Show institutional data for a specific stock
tw-stock institutional 2330

# Show OTC institutional data for a specific date
tw-stock institutional 6488 -l otc -d 2025-01-15
```

### `rank` — Daily stock ranking

```sh
tw-stock rank
```

Show daily stock ranking by price change or volume (當日漲跌幅排行).

| Option                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `-l, --listed <listed>` | Market type: `tse` (default) or `otc`     |
| `-d, --date <date>`     | Search specific date (`YYYY-MM-DD`)       |
| `-n, --number <number>` | Number of results to show (default: `10`) |
| `--losers`              | Show top losers instead of gainers        |
| `--volume`              | Sort by volume                            |

**Examples:**

```sh
# Show top 10 gainers (default)
tw-stock rank

# Show top 20 losers
tw-stock rank --losers -n 20

# Show top 10 by volume for OTC
tw-stock rank --volume -l otc

# Show ranking for a specific date
tw-stock rank -d 2025-01-15
```

### `favorite` — Manage favorite stocks

```sh
tw-stock favorite              # List all favorite stocks (default)
tw-stock favorite list         # List all favorite stocks
tw-stock favorite create       # Create favorite file
tw-stock favorite add <code>   # Add a stock code
tw-stock favorite delete <code> # Remove a stock code
```

### `completion` — Shell tab-completion

```sh
tw-stock completion           # Setup shell tab-completion
tw-stock completion --cleanup # Remove completion from shell profile
```

## Development and verification

See [Project Improvement TODO](TODO.md) for prioritized work and completion criteria.

Price lookups do not download the TDCC directory or require `stock.json`.
Multiple-stock and favorite price queries resolve both markets through MIS.
Favorite add/list commands fetch only the requested symbols from MIS. Empty
lists and duplicate additions need no request. If names cannot be fetched,
listing still shows saved codes; failed additions leave favorites unchanged.
An unresolved MIS symbol cannot be added, even if it exists in another directory.

Use Node from `.nvmrc` and the Yarn version declared in `package.json`.
Install dependencies with `yarn install --immutable`.

- `yarn test` runs unit tests.
- `yarn lint` checks source formatting and imports.
- `yarn test:e2e` builds the CLI and runs fixture-backed command workflows
  in temporary directories. It does not require exchange connectivity.
- `yarn test:live` builds the CLI and checks external market-data services.
  Run it explicitly with network access; upstream errors fail the checks.

PR checks include deterministic E2E tests. The **Live market data smoke tests**
workflow can be started manually in GitHub Actions. External snapshots may
represent the last trading session; an unavailable price is not a live quote.

## Screenshots

### Search TSE Stock

![Search TSE Stock](/images/TSE.png)

### Search OTC Stock

![Search OTC Stock](/images/OTC.png)

### Search Multiple Stocks

![Search Multiple Stocks](/images/MULTIPLE.png)
