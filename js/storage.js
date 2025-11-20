const STORAGE_KEY = 'instructions_app_data';

function loadStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : getDefaultData();
}

function saveStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDefaultData() {
  return {
    groups: [
      { id: 'mail', name: 'Почта' },
      { id: 'jkh', name: 'ЖКХ' },
      { id: 'shops', name: 'Магазины' }
    ],
    instructions: [
      {
        id: 'mail-1',
        groupId: 'mail',
        name: 'Как отправить письмо',
        content: '<h2>Инструкция по отправке письма</h2><p>1. Напишите письмо...<br>2. Нажмите отправить.</p>',
        favorite: false
      },
      {
        id: 'jkh-1',
        groupId: 'jkh',
        name: 'Оплата ЖКХ',
        content: '<h2>Как оплатить ЖКХ</h2><p>1. Зайдите в личный кабинет...<br>2. Нажмите "Оплатить".</p>',
        favorite: false
      }
    ]
  };
}