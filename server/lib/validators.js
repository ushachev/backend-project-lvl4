import objection from 'objection';

const { ValidationError } = objection;

const validationErrorBodies = {
  password: {
    type: 'ModelValidation',
    message: 'validation error: wrong password value',
    data: {
      currentPassword: [{
        message: 'password: wrong value',
        keyword: 'wrongPassword',
        params: null,
      }],
    },
  },
  repeatedPassword: {
    type: 'ModelValidation',
    message: 'validation error: repeatedPassword should be equal to password',
    data: {
      repeatedPassword: [{
        message: 'repeatedPassword: should be equal to password',
        keyword: 'equality',
        params: null,
      }],
    },
  },
};

export default (kind) => (validationCondition) => {
  if (!validationCondition) {
    throw new ValidationError(validationErrorBodies[kind]);
  }
};
