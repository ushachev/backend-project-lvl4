export default {
  translation: {
    flash: {
      session: {
        create: {
          success: 'вы вошли в сервис',
          error: 'неправильный email или пароль',
        },
        delete: {
          success: 'вы вышли из аккаунта',
        },
      },
      users: {
        create: {
          success: '{{account}} успешно зарегистрирован',
          error: 'не удалось зарегистрировать',
        },
        edit: {
          success: 'аккаунт {{account}} изменён',
          error: 'не удалось изменить аккаунт {{account}}',
        },
        delete: {
          success: 'аккаунт {{account}} удалён',
        },
      },
      taskStatuses: {
        create: {
          success: "статус '{{name}}' успешно создан",
        },
        edit: {
          success: "значение статуса '{{oldName}}' изменено на '{{newName}}'",
          error: "не удалось изменить статус '{{name}}'",
        },
        delete: {
          success: "статус '{{name}}' удалён",
        },
      },
      tasks: {
        create: {
          success: "задача '{{name}}' успешно создана",
        },
        edit: {
          success: "задача '{{name}}' успешно изменена",
          error: "не удалось изменить задачу '{{name}}'",
        },
        delete: {
          authorship: 'нельзя удалить задачу, созданную другим пользователем',
          success: "задача '{{name}}' успешно удалена",
        },
      },
    },
    layouts: {
      unauthenticated: {
        signUp: 'регистрация',
        signIn: 'войти',
      },
      application: {
        author: 'ushachev, 2020',
        projectCode: 'код проекта',
        greeting: 'приветствуем, {{firstName}} {{lastName}}',
        account: 'аккаунт',
        signOut: 'выйти',
        users: 'пользователи',
        tasks: 'задачи',
        taskStatuses: 'статусы',
        tags: 'метки',
        urgently: 'срочные задачи',
      },
    },
    views: {
      session: {
        new: {
          title: 'вход в сервис',
          email: 'email',
          password: 'пароль',
          submit: 'войти',
        },
      },
      users: {
        index: {
          id: 'id',
          fullName: 'полное имя',
          email: 'email',
          createdAt: 'дата создания',
        },
        new: {
          title: 'регистрация',
          firstName: 'имя',
          lastName: 'фамилия',
          email: 'email',
          password: 'пароль',
          repeatPassword: 'повторите пароль',
          submit: 'сохранить',
        },
        edit: {
          account: 'аккаунт',
          profile: 'профиль',
          password: 'пароль',
          deleteAcc: 'удалить аккаунт',
          firstName: 'имя',
          lastName: 'фамилия',
          submit: 'сохранить',
          oldPassword: 'старый пароль',
          newPassword: 'новый пароль',
          repeatNewPassword: 'повторите новый пароль',
          deletionAcc: 'удаление аккаунта',
          deletionWarning: 'внимание! отменить удаление аккаунта невозможно',
          submitDel: 'удалить',
        },
      },
      welcome: {
        index: {
          title: 'менеджер задач',
          description: 'учебный проект в рамках профессии',
          profession: 'node.js-програмист',
          platform: 'на образовательной платформе',
          link: 'Хекслет',
          realized: 'реализованные возможности',
          feature1: 'регистрация пользователя',
          feature2: 'аутентификация',
          feature3: 'управление задачами',
          feature4: 'фильтрация задач',
        },
      },
      application: {
        index: {
          title: 'менеджер задач',
        },
      },
      taskStatuses: {
        index: {
          create: 'создать статус',
          submit: 'добавить',
          empty: 'ещё не создано ни одного статуса',
          id: 'id',
          name: 'нименование',
          createdAt: 'дата создания',
          change: 'изменить',
          delete: 'удалить',
        },
        edit: {
          status: 'статус:',
          submit: 'изменить',
        },
      },
      tasks: {
        index: {
          create: 'создать задачу',
          empty: 'ещё не создано ни одной задачи',
          id: 'id',
          name: 'нименование',
          status: 'статус',
          author: 'автор',
          executor: 'исполнитель',
          createdAt: 'дата создания',
          notAssigned: 'не назначен',
          change: 'изменить',
          delete: 'удалить',
        },
        new: {
          title: 'новая задача',
          submit: 'создать',
        },
        _form: {
          name: 'наименование',
          description: 'описание',
          executor: 'исполнитель',
          status: 'статус',
          tags: 'метки',
        },
        edit: {
          title: 'изменение задачи',
          submit: 'изменить',
        },
        show: {
          title: 'задача',
          author: 'автор',
          executor: 'исполнитель',
          notAssigned: 'не назначен',
          status: 'статус',
          createdAt: 'создана',
          change: 'изменить задачу',
          deleteTask: 'удалить задачу',
          description: 'описание',
          deletionTask: 'удаление задачи',
          deletionWarning: 'внимание! задача будет удалена',
          submitDel: 'удалить',
        },
      },
    },
  },
};
