import { describe, expect, it } from 'vitest';
import axios from 'axios';

import { getApiErrorMessage } from './apiError';

describe('getApiErrorMessage', () => {
  it('возвращает строковый detail из ответа API', () => {
    const error = new axios.AxiosError(
      'fail',
      '400',
      undefined,
      undefined,
      {
        status: 400,
        data: { detail: 'Неверный период' },
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
      }
    );

    expect(getApiErrorMessage(error, 'Ошибка')).toBe('Неверный период');
  });

  it('собирает сообщения из массива detail', () => {
    const error = new axios.AxiosError(
      'fail',
      '422',
      undefined,
      undefined,
      {
        status: 422,
        data: { detail: [{ msg: 'Поле обязательно' }, 'Другая ошибка'] },
        statusText: 'Unprocessable',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
      }
    );

    expect(getApiErrorMessage(error, 'Ошибка')).toBe(
      'Поле обязательно. Другая ошибка'
    );
  });

  it('возвращает forbiddenMessage при статусе 403', () => {
    const error = new axios.AxiosError(
      'fail',
      '403',
      undefined,
      undefined,
      {
        status: 403,
        data: {},
        statusText: 'Forbidden',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
      }
    );

    expect(getApiErrorMessage(error, 'Ошибка', 'Нет доступа')).toBe('Нет доступа');
  });

  it('возвращает fallback для неизвестной ошибки', () => {
    expect(getApiErrorMessage(new Error('x'), 'Запасной текст')).toBe(
      'Запасной текст'
    );
  });
});
