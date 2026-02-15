import { color } from '@/constants'

export enum Status {
  failed,
  success,
}

export function getDisplayActionText(text: string, status: Status) {
  return `${status === Status.failed ? color.red : color.green}${text}${
    color.rest
  }`
}

export function displayFailed(text: string) {
  console.log(getDisplayActionText(`Failure: ${text}`, Status.failed))
}

export function displaySuccess(text: string) {
  console.log(getDisplayActionText(`Success: ${text}`, Status.success))
}
