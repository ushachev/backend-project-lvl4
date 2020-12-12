import casual from 'casual';
import formAutoContent from 'form-auto-content';

export const addFakeUser = async (app) => {
  const fakeUser = {
    firstName: casual.first_name,
    lastName: casual.last_name,
    email: casual.email,
    password: casual.password,
  };

  await app.inject({
    method: 'POST',
    url: '/users',
    ...formAutoContent({ ...fakeUser, repeatedPassword: fakeUser.password }),
  });

  return fakeUser;
};

export const authenticateUser = async (app, { email, password }) => {
  const { headers: { 'set-cookie': cookie } } = await app.inject({
    method: 'POST',
    url: '/session',
    ...formAutoContent({ email, password }),
  });

  return cookie;
};
