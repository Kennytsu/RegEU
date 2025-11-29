"""
Company scraper to extract company information from websites and Wikipedia
"""
import logging
import re
from typing import Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

from app.models.company_profile import CompanyProfile

logger = logging.getLogger(__name__)


class CompanyScraper:
    """Scraper for extracting company information from various sources"""

    def __init__(self, timeout: int = 30000):
        self.timeout = timeout
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def scrape_company(
        self,
        company_name: str,
        website_url: Optional[str] = None,
        wikipedia_url: Optional[str] = None
    ) -> CompanyProfile:
        """
        Scrape company information from website and/or Wikipedia

        Args:
            company_name: Name of the company
            website_url: Company website URL
            wikipedia_url: Wikipedia page URL

        Returns:
            CompanyProfile object with extracted information
        """
        logger.info(f"Starting scrape for company: {company_name}")

        profile_data = {
            "company_name": company_name,
            "website_url": website_url,
            "wikipedia_url": wikipedia_url,
            "scrape_status": "pending"
        }

        # Scrape from Wikipedia if URL provided
        if wikipedia_url:
            try:
                wiki_data = self._scrape_wikipedia(wikipedia_url)
                profile_data.update(wiki_data)
                profile_data["source_type"] = "wikipedia"
            except Exception as e:
                logger.error(f"Error scraping Wikipedia for {company_name}: {e}")
                profile_data["scrape_error"] = str(e)

        # Scrape from company website if URL provided
        if website_url:
            try:
                website_data = self._scrape_website(website_url)
                # Merge website data with existing data
                for key, value in website_data.items():
                    if value and not profile_data.get(key):
                        profile_data[key] = value

                if profile_data.get("source_type") == "wikipedia":
                    profile_data["source_type"] = "combined"
                else:
                    profile_data["source_type"] = "website"
            except Exception as e:
                logger.error(f"Error scraping website for {company_name}: {e}")
                if not profile_data.get("scrape_error"):
                    profile_data["scrape_error"] = str(e)

        # Determine scrape status
        if profile_data.get("description") or profile_data.get("industry"):
            profile_data["scrape_status"] = "success" if not profile_data.get("scrape_error") else "partial"
        else:
            profile_data["scrape_status"] = "failed"

        return CompanyProfile(**profile_data)

    def _scrape_wikipedia(self, url: str) -> dict:
        """
        Extract company information from Wikipedia page

        Args:
            url: Wikipedia page URL

        Returns:
            Dictionary with extracted company data
        """
        logger.info(f"Scraping Wikipedia: {url}")

        response = requests.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        data = {}

        # Extract from infobox
        infobox = soup.find('table', class_='infobox')
        if infobox:
            # Extract industry
            for row in infobox.find_all('tr'):
                header = row.find('th')
                if header:
                    header_text = header.get_text(strip=True).lower()
                    value_cell = row.find('td')
                    if value_cell:
                        value = value_cell.get_text(strip=True)

                        if 'industry' in header_text or 'type' in header_text:
                            data['industry'] = value
                        elif 'founded' in header_text:
                            # Extract year from founded text
                            year_match = re.search(r'\b(19|20)\d{2}\b', value)
                            if year_match:
                                data['founded_year'] = int(year_match.group())
                        elif 'headquarters' in header_text or 'hq' in header_text:
                            data['headquarters'] = value
                        elif 'employee' in header_text:
                            data['employee_count'] = value
                        elif 'product' in header_text or 'service' in header_text:
                            products = [p.strip() for p in value.split(',')]
                            data['products_services'] = products[:10]  # Limit to 10

        # Extract first paragraph as description
        first_para = soup.find('p', class_=lambda x: x != 'mw-empty-elt')
        if first_para:
            description = first_para.get_text(strip=True)
            # Clean up reference markers like [1], [2]
            description = re.sub(r'\[\d+\]', '', description)
            data['description'] = description[:1000]  # Limit length

        # Extract categories
        categories = []
        category_links = soup.find_all('a', href=re.compile(r'/wiki/Category:'))
        for link in category_links[:15]:  # Limit to 15 categories
            category = link.get_text(strip=True)
            categories.append(category)
        if categories:
            data['categories'] = categories

        # Infer regulatory topics based on industry and description
        data['regulatory_topics'] = self._infer_regulatory_topics(data)

        return data

    def _scrape_website(self, url: str) -> dict:
        """
        Extract company information from company website using Playwright

        Args:
            url: Company website URL

        Returns:
            Dictionary with extracted company data
        """
        logger.info(f"Scraping website: {url}")

        data = {}

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                page = browser.new_page()
                page.goto(url, timeout=self.timeout, wait_until='networkidle')

                # Get page content
                content = page.content()
                soup = BeautifulSoup(content, 'html.parser')

                # Extract meta description
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                if meta_desc and meta_desc.get('content'):
                    data['description'] = meta_desc['content'][:1000]

                # Extract from common sections
                # Look for about/company/products sections
                keywords = []

                # Extract text from key sections
                for section in soup.find_all(['section', 'div'], class_=re.compile(r'(about|company|products|services|technology)', re.I)):
                    text = section.get_text(strip=True)[:500]
                    # Extract potential keywords
                    words = re.findall(r'\b[A-Z][a-z]{3,}\b', text)
                    keywords.extend(words[:5])

                if keywords:
                    data['keywords'] = list(set(keywords))[:20]

                # Try to extract technologies from tech stack or footer
                tech_keywords = ['AI', 'ML', 'Cloud', 'AWS', 'Azure', 'React', 'Python',
                                'Kubernetes', 'Docker', 'API', 'SaaS', 'IoT', 'Blockchain']

                page_text = soup.get_text()
                found_tech = [tech for tech in tech_keywords if tech in page_text]
                if found_tech:
                    data['technologies_used'] = found_tech

                # Infer regulatory topics
                data['regulatory_topics'] = self._infer_regulatory_topics(data)

            finally:
                browser.close()

        return data

    def _infer_regulatory_topics(self, data: dict) -> list[str]:
        """
        Infer relevant regulatory topics based on company information

        Args:
            data: Company data dictionary

        Returns:
            List of relevant regulatory topics
        """
        topics = set()

        # Get text to analyze
        text_fields = [
            data.get('description', ''),
            data.get('industry', ''),
            ' '.join(data.get('products_services', [])),
            ' '.join(data.get('technologies_used', [])),
            ' '.join(data.get('keywords', []))
        ]
        combined_text = ' '.join(text_fields).lower()

        # Define regulatory topic mappings
        topic_mappings = {
            'data protection': ['data', 'privacy', 'gdpr', 'personal', 'information'],
            'ai regulation': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'algorithm'],
            'digital services': ['digital', 'online', 'platform', 'marketplace', 'e-commerce'],
            'cybersecurity': ['security', 'cyber', 'encryption', 'authentication'],
            'financial services': ['finance', 'banking', 'payment', 'fintech', 'financial'],
            'healthcare': ['health', 'medical', 'pharmaceutical', 'clinical', 'patient'],
            'environmental': ['environmental', 'climate', 'sustainability', 'green', 'carbon'],
            'telecommunications': ['telecom', 'network', '5g', 'communication', 'broadband'],
            'transportation': ['transport', 'logistics', 'automotive', 'mobility', 'vehicle'],
            'energy': ['energy', 'electricity', 'power', 'renewable', 'grid'],
        }

        for topic, keywords in topic_mappings.items():
            if any(keyword in combined_text for keyword in keywords):
                topics.add(topic)

        return list(topics) if topics else None
