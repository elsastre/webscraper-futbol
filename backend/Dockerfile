FROM python:3.11-slim

# Dependencias para Chrome headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium chromium-driver libnss3 libxss1 libasound2 libgbm1 libxshmfence1 fonts-liberation wget \
 && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_BIN=/usr/bin/chromedriver
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Por si no instaláramos el paquete, esto expone src (belt & suspenders)
ENV PYTHONPATH=/app/src

WORKDIR /app

# Dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el backend completo
COPY . /app

# Instalar el paquete local (para importar webscraper_futbol.*)
RUN pip install --no-cache-dir .

# Usuario no root
RUN useradd -m appuser
USER appuser

EXPOSE 8000
# ⚠️ Tu app vive en backend/api.py => módulo "api:app"
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
