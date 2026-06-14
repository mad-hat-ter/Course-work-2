FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc python3-dev libpq-dev \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

FROM deps AS production

COPY backend backend

RUN sed -i 's/\r$//' backend/entrypoint.sh \
    && chmod +x backend/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "backend/entrypoint.sh"]

FROM deps AS test

COPY backend backend

WORKDIR /app
