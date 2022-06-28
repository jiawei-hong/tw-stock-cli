interface Colors {
  rest: string
  red: string
  green: string
}

const color: Colors = {
  rest: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
}

export { color }
