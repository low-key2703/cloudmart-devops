FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

RUN groupadd --system product && useradd --system --no-create-home --gid product product

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=product:product . .

USER product

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]



