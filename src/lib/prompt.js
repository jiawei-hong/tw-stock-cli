const { Select } = require('enquirer')

class Prompt {
  static select(name = '', message = '', choices = []) {
    const selectPrompt = new Select({ name, message, choices })

    return this.execute(selectPrompt)
  }

  static async execute(prompt) {
    return await prompt
      .run()
      .then((res) => res)
      .catch(console.error)
  }
}

module.exports = Prompt
