from fastapi import HTTPException, status


INVALID_CREDENTIALS = "Неверный email или пароль"
INSUFFICIENT_PERMISSIONS = "У вас недостаточно прав для выполнения этой операции"
USER_DEPARTMENT_NOT_SET = "У пользователя не указан отдел"
DEPARTMENT_ACCESS_DENIED = "Доступно только для сотрудников вашего отдела"
SCHEDULE_NOT_FOUND = "Расписание не найдено"
SHIFT_NOT_FOUND = "Смена не найдена"
CURATOR_SELF_ASSIGN_ONLY = "Куратор может записывать только себя на смену"
PAST_SHIFT_SIGNUP = "Нельзя записаться на прошедшую смену"
SCHEDULE_SIGNUP_NOT_OPEN = "Запись на смены в этом расписании ещё не открыта"
CURATOR_SELF_REMOVE_ONLY = "Можно удалять только свою запись на смену"
SHIFT_REMOVAL_CLOSED = "Удаление записей на смены сейчас недоступно"
SHIFT_ALREADY_ASSIGNED = "Куратор уже записан на эту смену"
SHIFT_NO_FREE_SLOTS = "На смене нет свободных мест"
PERIOD_END_BEFORE_START = "Конец периода не может быть раньше начала"
_AUTH_HEADER = {"WWW-Authenticate": "Bearer"}


def unauthorized(detail: str = INVALID_CREDENTIALS) -> None:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, headers=_AUTH_HEADER)


def forbidden(detail: str = INSUFFICIENT_PERMISSIONS) -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def bad_request(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def not_found(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def schedule_not_found() -> None:
    not_found(SCHEDULE_NOT_FOUND)


def shift_not_found() -> None:
    not_found(SHIFT_NOT_FOUND)


def shift_already_assigned() -> None:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=SHIFT_ALREADY_ASSIGNED)


def shift_no_free_slots() -> None:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=SHIFT_NO_FREE_SLOTS)


def period_end_before_start() -> None:
    bad_request(PERIOD_END_BEFORE_START)
