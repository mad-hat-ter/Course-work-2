import uuid


def unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}@mail.ru"


def unique_title(prefix: str) -> str:
    return f"{prefix} {uuid.uuid4().hex[:8]}"
