import os, time, random
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

def get_table(url: str):
    # Si está definida, uso la URL de FBREF que venga del entorno (Render)
    url = os.getenv('FBREF_STANDINGS_URL', url)
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )

    # MUY IMPORTANTE EN RENDER/DOCKER: usar el binario y driver del sistema
    opts.binary_location = os.getenv("CHROME_BIN", "/usr/bin/chromium")
    driver_path = os.getenv("CHROMEDRIVER_BIN", "/usr/bin/chromedriver")

    # Intentar con el driver del sistema; si falla, caer a webdriver_manager
    try:
        service = Service(driver_path)
    except Exception:
        from webdriver_manager.chrome import ChromeDriverManager  # fallback
        service = Service(ChromeDriverManager().install())

    drv = webdriver.Chrome(service=service, options=opts)
    try:
        drv.get(url)
        time.sleep(random.uniform(2, 3))
        html = drv.page_source
        return BeautifulSoup(html, "html5lib")
    finally:
        try:
            drv.quit()
        except Exception:
            pass

def extract_standings(soup: BeautifulSoup):
    table = soup.find("table")
    if not table:
        return []
    rows = []
    for tr in table.select("tbody tr"):
        cells = [c.get_text(strip=True) for c in tr.select("th,td")]
        if cells:
            rows.append(cells)
    return rows

