import os

DATA_DIR = os.getenv("DATA_DIR", "/app/data")
STANDINGS_CSV = os.path.join(DATA_DIR, "standings.csv")

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
