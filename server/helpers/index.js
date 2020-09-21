const errorKeywordMapping = {
  required: () => 'поле не должно быть пустым',
  minLength: ({ limit }) => (limit > 1
    ? `должно быть не меньше ${limit} символов`
    : 'поле не должно быть пустым'),
  format: () => 'неправильный формат email',
  unique: () => 'этот email уже используется',
  equality: () => 'должно совпадать с паролем',
  wrongPassword: () => 'неверный пароль',
};

export default (app) => ({
  assetPath: (filename) => `/assets/${filename}`,
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
