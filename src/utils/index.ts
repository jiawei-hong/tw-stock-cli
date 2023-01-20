import { MAX_TERMINAL_WIDTH } from '../constants/index'
import type { FieldProps } from '../field'

export const toUppercase = (value: string) => value?.toUpperCase()

export const getTableHeader = (headerField: FieldProps[]): string[] =>
  headerField.map((field) => field.name)

export const isTerminalWidthSmall = () =>
  process.stdout.columns < MAX_TERMINAL_WIDTH
