from dotenv import load_dotenv
import os

load_dotenv()
key = os.getenv("GROQ_API_KEY")
print("Key found:", key[:20] + "..." if key else "NO KEY FOUND")