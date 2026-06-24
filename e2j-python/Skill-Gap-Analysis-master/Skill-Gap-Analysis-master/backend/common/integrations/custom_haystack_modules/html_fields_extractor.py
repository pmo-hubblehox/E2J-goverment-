from haystack import component
from bs4 import BeautifulSoup
from typing import List, Optional
from haystack.dataclasses import ByteStream, Document
from bs4.element import Comment
from link_content_selenium import LinkContentFetcherSelenium

@component
class HTMLFieldsExtractor:
    """
    Custom Haystack Component that extracts visible HTML element features.
    Stores text content in Document.content and other attributes in Document.meta.
    Removes duplicate documents based on their content and metadata.
    Filters out elements that are not displayed on the screen or belong to unwanted tags.
    """
    
    @component.output_types(documents=List[Document])
    def run(self, html_docs: List[ByteStream]):
        documents = []
        seen = set()  # To track unique documents (based on content + meta)

        for doc in html_docs:
            soup = BeautifulSoup(doc.data, 'html.parser')
            
            for element in soup.find_all(text=True):  # Extract all text nodes
                # Skip unwanted tags and hidden elements
                if self._is_hidden(element) or not self._is_visible_tag(element):
                    continue
                
                # Extract text content (primary document content)
                text = element.strip()
                
                # Skip elements with empty text
                if not text:
                    continue
                
                # Extract metadata attributes
                parent = element.parent  # Get parent tag for metadata extraction
                metadata = {
                    "tag": parent.name,
                    "class": " ".join(parent.get("class", [])),
                    "role": parent.get("role"),
                    "id": parent.get("id"),
                    "parent_tag": self._get_parent_attr(parent, "name"),
                    "parent_class": self._get_parent_attr(parent, "class")
                }
                
                # Create a unique identifier for the document (e.g., hash of content + meta)
                unique_identifier = (text, tuple(metadata.items()))
                
                # Check if the document is a duplicate
                if unique_identifier not in seen:
                    seen.add(unique_identifier)  # Mark as seen
                    
                    # Create document with text content and metadata
                    documents.append(
                        Document(
                            content=text,
                            meta={k: v for k, v in metadata.items() if v not in [None, ""]}
                        )
                    )
        
        return {'documents': documents}

    def _get_parent_attr(self, element, attr: str) -> Optional[str]:
        """Helper to safely get parent attributes"""
        parent = element.find_parent()
        if not parent:
            return None
            
        if attr == "class":
            return " ".join(parent.get("class", [])) if parent.has_attr("class") else None
        return parent.get(attr)

    def _is_hidden(self, element) -> bool:
        """
        Determines if an element or its parents are hidden based on their attributes.
        
        :param element: The BeautifulSoup element to check.
        :return: True if the element or its parents are hidden; False otherwise.
        """
        parent = element.parent  # Check visibility of parent elements recursively
        while parent:
            # Check for 'hidden' attribute
            if parent.has_attr("hidden"):
                return True
            
            # Check for inline styles that hide the element
            style = parent.get("style", "")
            if any(hidden_style in style for hidden_style in ["display:none", "visibility:hidden"]):
                return True
            
            parent = parent.parent  # Move up the DOM tree
        
        return False

    def _is_visible_tag(self, element) -> bool:
        """
        Determines if an element belongs to visible tags.
        
        :param element: The BeautifulSoup element to check.
        :return: True if the tag is visible; False otherwise.
        """
        unwanted_tags = ['style', 'script', 'head', 'title', 'meta', '[document]']
        if isinstance(element, Comment):  # Skip comments
            return False
        
        if element.parent.name in unwanted_tags:  # Skip unwanted tags
            return False
        
        return True

if __name__ == "__main__":
    fetcher = LinkContentFetcherSelenium()
    extractor  = HTMLFieldsExtractor()
    output = fetcher.run(["https://mnit.ac.in/news/newsall?type=event"])
    extracted = extractor.run(output["streams"])
    print('test')
