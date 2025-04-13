import requests

# Replace with your API key and CX ID
GOOGLE_API_KEY = "AIzaSyA8dDHrep5MellJ76UySFctdijNJ6p3cB8"
CX_ID = "4282c6dc11d524060"

def fetch_company_image(company_name):
    """Fetches the first image related to the given company name using Google Custom Search API."""
    search_url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": f"{company_name} banner",  # Search for the company logo
        "searchType": "image",
        "key": GOOGLE_API_KEY,
        "cx": CX_ID,
        "num": 1,  # Fetch only the first image
    }

    try:
        response = requests.get(search_url, params=params)
        response.raise_for_status()  # Raise an error for bad responses (4xx, 5xx)
        data = response.json()

        if "items" in data and len(data["items"]) > 0:
            return data["items"][0]["link"]  # Return the first image link
        else:
            return "No image found for this company."

    except requests.exceptions.RequestException as e:
        return f"Error fetching image: {e}"


def fetch_company_logo(company_name):
    """Fetches the first image related to the given company name using Google Custom Search API."""
    search_url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": f"{company_name} logo",  # Search for the company logo
        "searchType": "image",
        "key": GOOGLE_API_KEY,
        "cx": CX_ID,
        "num": 1,# Fetch only the first image
    }

    try:
        response = requests.get(search_url, params=params)
        response.raise_for_status()  # Raise an error for bad responses (4xx, 5xx)
        data = response.json()

        if "items" in data and len(data["items"]) > 0:
            return data["items"][0]["link"]  # Return the first image link
        else:
            return "No image found for this company."

    except requests.exceptions.RequestException as e:
        return f"Error fetching image: {e}"


