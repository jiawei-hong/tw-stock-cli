import Text from '../lib/text'

class ChartMessage {
  static startDateIsAfterEndDate() {
    return Text.red('You input startDate isAfter endDate')
  }

  static notFoundData() {
    return Text.red('No data yet')
  }

  static notFound() {
    return Text.red(`Not found stock`)
  }
}

export { ChartMessage }
