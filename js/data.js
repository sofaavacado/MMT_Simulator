window.examples = {
  1: [
    {
      name: "Простая замена",
      description: "Заменяет все символы 'a' на 'b'",
      tapeCount: 1,
      states: ["q0", "qf"],
      initialState: "q0",
      finalStates: ["qf"],
      alphabet: ["a", "b", "_"],
      transitions: [
        { from: "q0", read: ["a"], to: "q0", write: ["b"], move: ["R"], description: "Заменяем 'a' на 'b'" },
        { from: "q0", read: ["b"], to: "q0", write: ["b"], move: ["R"], description: "Оставляем 'b' как есть" },
        { from: "q0", read: ["_"], to: "qf", write: ["_"], move: ["S"], description: "Конец ленты" }
      ],
      initialTapes: [["a", "b", "a", "a"]]
    }
  ],
  2: [
    {
      name: "Копирование строки",
      description: "Копирует строку с первой ленты на вторую",
      tapeCount: 2,
      states: ["q0", "qf"],
      initialState: "q0",
      finalStates: ["qf"],
      alphabet: ["a", "b", "c", "_"],
      transitions: [
        { from: "q0", read: ["a", "_"], to: "q0", write: ["a", "a"], move: ["R", "R"], description: "Копируем 'a'" },
        { from: "q0", read: ["b", "_"], to: "q0", write: ["b", "b"], move: ["R", "R"], description: "Копируем 'b'" },
        { from: "q0", read: ["c", "_"], to: "q0", write: ["c", "c"], move: ["R", "R"], description: "Копируем 'c'" },
        { from: "q0", read: ["_", "_"], to: "qf", write: ["_", "_"], move: ["S", "S"], description: "Конец строки - останавливаемся" }
      ],
      initialTapes: [["a", "b", "c"], ["_", "_", "_"]]
    },
    {
      name: "Проверка палиндрома",
      description: "Проверяет, является ли строка палиндромом",
      tapeCount: 2,
      states: ["q0", "q1", "q2", "q3", "q4", "qaccept", "qreject"],
      initialState: "q0",
      finalStates: ["qaccept", "qreject"],
      alphabet: ["a", "b", "_", "X"],
      transitions: [
        { from: "q0", read: ["a", "_"], to: "q1", write: ["X", "a"], move: ["R", "R"], description: "Помечаем 'a' и запоминаем" },
        { from: "q0", read: ["b", "_"], to: "q2", write: ["X", "b"], move: ["R", "R"], description: "Помечаем 'b' и запоминаем" },
        { from: "q0", read: ["_", "_"], to: "qaccept", write: ["_", "_"], move: ["S", "S"], description: "Пустая строка - палиндром" },
        { from: "q1", read: ["a", "_"], to: "q1", write: ["a", "_"], move: ["R", "S"], description: "Ищем конец строки" },
        { from: "q1", read: ["b", "_"], to: "q1", write: ["b", "_"], move: ["R", "S"], description: "Ищем конец строки" },
        { from: "q1", read: ["_", "a"], to: "q3", write: ["_", "X"], move: ["L", "L"], description: "Нашли соответствующую 'a'" },
        { from: "q1", read: ["_", "b"], to: "qreject", write: ["_", "b"], move: ["S", "S"], description: "Не палиндром" },
        { from: "q2", read: ["a", "_"], to: "q2", write: ["a", "_"], move: ["R", "S"], description: "Ищем конец строки" },
        { from: "q2", read: ["b", "_"], to: "q2", write: ["b", "_"], move: ["R", "S"], description: "Ищем конец строки" },
        { from: "q2", read: ["_", "b"], to: "q3", write: ["_", "X"], move: ["L", "L"], description: "Нашли соответствующую 'b'" },
        { from: "q2", read: ["_", "a"], to: "qreject", write: ["_", "a"], move: ["S", "S"], description: "Не палиндром" },
        { from: "q3", read: ["a", "_"], to: "q3", write: ["a", "_"], move: ["L", "S"], description: "Возвращаемся к началу" },
        { from: "q3", read: ["b", "_"], to: "q3", write: ["b", "_"], move: ["L", "S"], description: "Возвращаемся к началу" },
        { from: "q3", read: ["X", "_"], to: "q0", write: ["X", "_"], move: ["R", "S"], description: "Следующая итерация" },
        { from: "q0", read: ["X", "_"], to: "q4", write: ["X", "_"], move: ["R", "S"], description: "Проверяем оставшиеся символы" },
        { from: "q4", read: ["X", "_"], to: "q4", write: ["X", "_"], move: ["R", "S"], description: "Пропускаем помеченные" },
        { from: "q4", read: ["_", "_"], to: "qaccept", write: ["_", "_"], move: ["S", "S"], description: "Все символы проверены - палиндром" }
      ],
      initialTapes: [["a", "b", "a"], ["_", "_", "_"]]
    }
  ],
  3: [],
  4: [],
  5: []
};
