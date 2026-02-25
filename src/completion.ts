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
  ],
  index: ['TAIEX', 'TWO', 'FRMSA', '--multiple', '--time', '--chart'],
  institutional: ['--listed', '--date', '--number'],
  rank: ['--listed', '--date', '--number', '--losers', '--volume'],
  crawler: [],
  favorite: ['create', 'add', 'delete', 'list'],
})

export default completion
