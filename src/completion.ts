import omelette from 'omelette'

const completion = omelette('tw-stock <command>')

completion.tree({
  stock: [
    '--listed',
    '--multiple',
    '--favorite',
    '--oddLot',
    '--date',
    '--details',
    '--chart',
    '--range',
  ],
  overview: ['--listed'],
  index: ['TAIEX', 'TWO', 'FRMSA', '--multiple', '--time', '--chart'],
  institutional: ['--listed', '--date', '--number'],
  screen: [
    '--listed',
    '--date',
    '--min-price',
    '--max-price',
    '--min-volume',
    '--max-volume',
    '--min-change',
    '--max-change',
    '--sort',
    '--number',
  ],
  rank: ['--listed', '--date', '--number', '--losers', '--volume'],
  favorite: ['create', 'add', 'delete', 'list', 'import', 'path'],
})

export default completion
