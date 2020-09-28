import objection from 'objection';

const { ValidationError } = objection;

const validationErrors = {
  password: new ValidationError({
    type: 'ModelValidation',
    message: 'validation error: wrong password value',
    data: {
      currentPassword: [{
        message: 'password: wrong value',
        keyword: 'wrongPassword',
        params: null,
      }],
    },
  }),
  repeatedPassword: new ValidationError({
    type: 'ModelValidation',
    message: 'validation error: repeatedPassword should be equal to password',
    data: {
      repeatedPassword: [{
        message: 'repeatedPassword: should be equal to password',
        keyword: 'equality',
        params: null,
      }],
    },
  }),
};

export default (type) => (validationCondition) => {
  if (!validationCondition) {
    throw validationErrors[type];
  }
};
