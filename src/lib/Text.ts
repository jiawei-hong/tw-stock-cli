import { color } from '../color'

export enum Status {
  failed,
  success,
}

function getDisplayActionText(
  text: string,
  isSuccess: Status = Status.success
) {
  if (isSuccess === Status.success) {
    return color.green + text + color.red
  }

  return color.red + text + color.red
}

function displayActionText(text: string, isSuccess: Status = Status.success) {
  if (isSuccess === Status.success) {
    return color.green + 'Success: ' + text + color.red
  }

  return color.red + 'Failed: ' + text + color.red
}

function displaySuccess(text: string): void {
  console.log(color.green + 'Success: ' + text + color.rest)
}

function displayFailed(text: string): void {
  console.log(color.red + 'Failure: ' + text + color.rest)
}

export {
  displayActionText,
  displayFailed,
  displaySuccess,
  getDisplayActionText,
}
