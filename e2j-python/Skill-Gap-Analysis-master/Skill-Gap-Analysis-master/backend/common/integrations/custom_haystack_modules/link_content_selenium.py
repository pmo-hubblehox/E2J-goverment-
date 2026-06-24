from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from haystack import component
from haystack.dataclasses import ByteStream
from typing import List, Optional

@component
class LinkContentFetcherSelenium:
    """
    Custom Haystack Component
    
    Fetches webpage content using Selenium and returns it as ByteStream.
    """
    def __init__(self,driver=None):
        self.driver = driver

    @component.output_types(streams=List[ByteStream])
    def run(self, urls: Optional[List[str]] = None, html_text: Optional[str] = None):
        """
        Fetches content from a list of URLs using Selenium WebDriver.

        :param urls: List of URLs to fetch content from
        :returns: List of ByteStream objects containing the HTML content of each URL.
        """
        streams = []

        try:
            # Create a new WebDriver instance if not provided
            options = webdriver.ChromeOptions()
            options.add_argument("--headless")  # Run browser in headless mode
            self.driver = webdriver.Chrome(options=options)

            # Fetch content for each URL using the WebDriver
            if urls!=None:
                for url in urls:
                    try:
                        # Navigate to the URL
                        self.driver.get(url)

                        # Extract page source (HTML content)
                        page_source = self.driver.page_source

                        # Convert HTML content into ByteStream
                        stream = ByteStream.from_string(page_source)
                        stream.meta = {"url": url, "content_type": "text/html"}
                        streams.append(stream)

                    except Exception as e:
                        print(f"Failed to fetch content from {url}: {e}")
                        continue  # Skip to the next URL if an error occurs
            elif html_text:
                try:
                    stream = ByteStream.from_string(html_text[0])
                    stream.meta = {"url": "from html_text", "content_type": "text/html"}
                    streams.append(stream)
                except Exception as e:
                    print(f"Failed to parse content")
        finally:
            # Close the browser only if we created it locally
            self.driver.quit()

        return {"streams": streams}