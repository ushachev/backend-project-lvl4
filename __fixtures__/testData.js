export default {
  users: [
    {
      firstName: 'Vitaly',
      lastName: 'Ushachev',
      email: 'admin@example.com',
      password: 'password',
    },
    {
      firstName: 'Cordell',
      lastName: 'Bartoletti',
      email: 'Kiley.Pouros@Virgie.com',
      password: '8Ollie58',
    },
    {
      firstName: 'Ella',
      lastName: 'Stoltenberg',
      email: 'Emelia.Daugherty@Junius.io',
      password: '6Christophe68',
    },
  ],
  statuses: [
    { name: 'Harum est occaecati' },
    { name: 'Iste adipisci' },
    { name: 'Vero voluptatem facere' },
  ],
  labels: [
    { name: 'tempore' },
    { name: 'facere' },
    { name: 'explicabo' },
    { name: 'perferendis' },
  ],
  tasks: [
    {
      name: 'Accusantium excepturi',
      status_id: 2,
      creator_id: 2,
      executor_id: 3,
    },
    {
      name: 'Est assumenda sunt et quia vel quisquam et.',
      status_id: 3,
      creator_id: 3,
      executor_id: 2,
    },
  ],
  tasksLabels: [
    {
      task_id: 1,
      label_id: 2,
    },
    {
      task_id: 1,
      label_id: 3,
    },
    {
      task_id: 2,
      label_id: 3,
    },
    {
      task_id: 2,
      label_id: 4,
    },
  ],
};
