import formAutoContent from 'form-auto-content';

export default async (app, { email, password }) => {
  const response = await app.inject({
    method: 'POST',
    url: '/session',
    ...formAutoContent({ email, password }),
  });
  const [{ name, value }] = response.cookies;
  const cookie = { [name]: value };

  return cookie;
};
