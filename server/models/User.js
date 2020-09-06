let id = 0;

const generateId = () => {
  id += 1;
  return id;
};

export default class User {
  constructor({
    firstName, lastName, email, password,
  }) {
    this.id = generateId();
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
  }
}
