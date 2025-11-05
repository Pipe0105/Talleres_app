import os
from dotenv import load_dotenv
load_dotenv()

API_PREFIX = os.getenv("API_PREFIX", "/api")
DATABASE_URL = os.getenv("DATABASE_URL")
