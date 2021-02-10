import i18next from 'i18next';
import { get } from 'lodash';

const alertClasses = {
  error: 'danger',
  success: 'success',
  info: 'info',
};

export default (app) => ({
  route: (name) => app.reverse(name),
  getInputErrorMessage: (errors) => errors
    .map(({ message, keyword, params }) => i18next
      .t(`inputErrors.${keyword}`, message, { count: params?.limit }))
    .join(', '),
  getAlertClass: (type) => get(alertClasses, type, 'secondary'),
  formatDate: (str) => {
    const date = new Date(`${str} GMT`);
    return date.toLocaleString();
  },
});
