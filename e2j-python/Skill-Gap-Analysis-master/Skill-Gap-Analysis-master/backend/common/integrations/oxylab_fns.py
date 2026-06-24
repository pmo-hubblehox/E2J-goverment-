from dotenv import load_dotenv

from bs4 import BeautifulSoup
from typing import List, Tuple
from urllib.parse import urlparse, parse_qs

load_dotenv()

import asyncio
import base64
from typing import List, Tuple, Any
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs

from typing import List, Tuple
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs
import os

def extract_headers_and_links(html: str) -> List[Tuple[str, str]]:
    soup = BeautifulSoup(html, "lxml")
    results = []

    # Generic titles to ignore (add more if needed)
    GENERIC_TITLES = {"youtube", "facebook", "twitter", "instagram", "linkedin", "github", "wikipedia"}

    for a in soup.select("a"):
        h3 = a.find("h3")
        if not h3:
            continue
        title = h3.get_text(strip=True)
        href = a.get("href")
        if not href:
            continue

        # Google wraps external links in /url?q=
        if href.startswith("/url?"):
            parsed = urlparse(href)
            q = parse_qs(parsed.query).get("q", [""])[0]
            if q:
                href = q

        if not title or not href:
            continue

        # Skip entries where the title is just a generic platform name
        if title.lower() in GENERIC_TITLES:
            continue

        results.append((title, href))

    # Deduplicate while preserving order
    seen = set()
    unique = []
    for item in results:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique

async def zyte_scrape_batch(
    queries: List[str],
    max_concurrent: int = 5,
    timeout: float = 30.0
) -> List[List[Tuple[str, str]]]:
    """
    Scrape many URLs via Zyte API concurrently.
    
    Args:
        queries: list of search queries
        max_concurrent: semaphore limit (avoid rate limits)
        timeout: per-request timeout
    
    Returns:
        List of extracted data, one per query, in input order.
        Each element is a list of (header, link) tuples.
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def scrape_one(query: str) -> List[Tuple[str, str]]:
        async with semaphore:
            async with httpx.AsyncClient(timeout=timeout, http2=True) as client:
                try:
                    query_lower = query.lower().replace(' ', '+')
                    resp = await client.post(
                        "https://api.zyte.com/v1/extract",
                        auth=(os.getenv("ZYTE_API_KEY"), ""),
                        json={
                            "url": f"https://www.google.com/search?q=({query_lower}+basics+course)+(site%3Audemy.com+OR+site%3Anptel.ac.in+OR+site%3Ayoutube.com+OR+site%3Acoursera.org)",
                            "httpResponseBody": True,
                            "followRedirect": True
                        }
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    html_b64 = data["httpResponseBody"]
                    html = base64.b64decode(html_b64).decode("utf-8", errors="ignore")
                    return extract_headers_and_links(html)
                except Exception as e:
                    # In production, log the exception
                    return []
    
    tasks = [scrape_one(q) for q in queries]
    results = await asyncio.gather(*tasks)
    return results  # List[List[Tuple[str, str]]]

if __name__ == "__main__":

    queries =  [
                "Data Science",
                "Bioanalytical Chemistry"
            ]
    
    api_key = "6248b056df3447d5a6a2fe13fce67fe6"

    results = asyncio.run(zyte_scrape_batch(queries,api_key))

    print('test')