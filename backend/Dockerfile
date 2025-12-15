FROM python:3.11-slim

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt
COPY ./app /app/app
COPY ./seed_indicators.py /app/seed_indicators.py
COPY ./startup.sh /app/startup.sh

RUN pip install --upgrade pip && \
    pip install -r /app/requirements.txt && \
    chmod +x /app/startup.sh

EXPOSE 8000

CMD ["/app/startup.sh"]