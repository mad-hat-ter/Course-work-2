from fastapi import FastAPI
from backend.app.api.v1.department import router as department_router, position_router
from backend.app.api.v1.user import router as user_router
from backend.app.api.v1.shift import router as shift_router, shift_type_router
from backend.app.api.v1.schedule import router as schedule_router
from backend.app.api.v1.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import get_settings
from backend.app.core.logging_config import setup_logging
from loguru import logger
from fastapi import Request
import time

app = FastAPI(
    title="Курсовая работа",
    description="Расписание смен",
    version="0.1.0",
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(department_router, prefix="/department", tags=["Departments"])
app.include_router(position_router, prefix="/position", tags=["Position"])
app.include_router(shift_type_router, prefix="/shift_type", tags=["Shift_type"])
app.include_router(user_router, prefix="/user", tags=["User"])
app.include_router(schedule_router, prefix="/schedule", tags=["Schedule"])
app.include_router(shift_router, prefix="/shift", tags=["Shift"])
app.include_router(auth_router, prefix="", tags=["Auth"])

setup_logging()

logger.info("Приложение запущено")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Начало запроса: {request.method} {request.url.path}")
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = "{0:.2f}".format(process_time)
    logger.info(f"Завершено: {request.method} {request.url.path} | Статус: {response.status_code} | Время: {formatted_process_time}ms")
    return response