const errorKeywordMapping = {
  required: () => 'поле не должно быть пустым',
  minLength: ({ limit }) => (limit > 1
    ? `должно быть не меньше ${limit} символов`
    : 'поле не должно быть пустым'),
  format: () => 'неправильный формат email',
  unique: () => 'это значение уже используется',
  equality: () => 'должно совпадать с паролем',
  wrongPassword: () => 'неверный пароль',
  minimum: () => 'поле не должно быть пустым',
};

export default (app) => ({
  route: (name) => app.reverse(name),
  getInputErrorMessage: (errors) => errors
    .map(({ message, keyword, params }) => (errorKeywordMapping[keyword]
      ? errorKeywordMapping[keyword](params)
      : message))
    .join(', '),
  formatDate: (str) => {
    const date = new Date(`${str} GMT`);
    return date.toLocaleString();
  },
});
