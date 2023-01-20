import type { FieldProps } from '../field'

export const toUppercase = (value: string) => value?.toUpperCase()

export const getTableHeader = (headerField: FieldProps[]): string[] =>
  headerField.map((field) => field.name)
