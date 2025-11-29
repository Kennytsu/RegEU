# Web Scraper API

FastAPI application for web scraping functionality.

## Features

- FastAPI-based REST API
- Ready-to-extend scraping endpoint
- CORS enabled for frontend integration
- Health check endpoints
- Structured for easy scraping implementation

## Setup

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the API

#### Development mode (with auto-reload):
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check

### Scraping
- `POST /scrape` - Scrape a website (implementation pending)

  Request body:
  ```json
  {
    "url": "https://example.com",
    "options": {}
  }
  ```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env.example         # Example environment variables
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Next Steps

1. Implement the actual scraping logic in the `/scrape` endpoint
2. Add specific scraping modules (BeautifulSoup, Playwright, etc.)
3. Add authentication if needed
4. Implement rate limiting
5. Add logging and monitoring
6. Create scraping utilities and helper functions

## Dependencies

- **FastAPI**: Modern web framework for building APIs
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation
- **BeautifulSoup4**: HTML parsing (ready for scraping implementation)
- **Requests/HTTPX**: HTTP client
- **Playwright**: Browser automation (for dynamic content)

## Development

To add scraping functionality, implement the logic in the `scrape_website` function in `main.py` or create separate scraping modules.
