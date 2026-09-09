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
  if (failureExitCodeEnabled) process.exitCode = 1
  console.log(getDisplayActionText(`Failure: ${text}`, Status.failed))
}

let failureExitCodeEnabled = false

export function enableFailureExitCode(): void {
  failureExitCodeEnabled = true
}

export function displayWarning(text: string): void {
  console.error(`Warning: ${text}`)
}

export function displaySuccess(text: string) {
  console.log(getDisplayActionText(`Success: ${text}`, Status.success))
}
