"""
Company scraper to extract company information from websites and Wikipedia
"""
import logging
import re
from typing import Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from openai import OpenAI

# Playwright is optional - only needed for _scrape_website() method
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    async_playwright = None

from app.core.config import Settings
from app.models.company_profile import CompanyProfile, RegulatoryTopic

logger = logging.getLogger(__name__)
settings = Settings()


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
                website_data = self._scrape_website_simple(website_url)
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

    def _scrape_website_simple(self, url: str) -> dict:
        """
        Extract company information from company website using requests (simpler, no JS)

        Args:
            url: Company website URL

        Returns:
            Dictionary with extracted company data
        """
        logger.info(f"Scraping website (simple): {url}")

        data = {}

        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                data['description'] = meta_desc['content'][:1000]

            # Extract from common sections
            keywords = []

            # Extract text from key sections
            for section in soup.find_all(['section', 'div'], class_=re.compile(r'(about|company|products|services|technology)', re.I)):
                text = section.get_text(strip=True)[:500]
                # Extract potential keywords
                words = re.findall(r'\b[A-Z][a-z]{3,}\b', text)
                keywords.extend(words[:5])

            if keywords:
                data['keywords'] = list(set(keywords))[:20]

            # Try to extract technologies
            tech_keywords = ['AI', 'ML', 'Cloud', 'AWS', 'Azure', 'React', 'Python',
                            'Kubernetes', 'Docker', 'API', 'SaaS', 'IoT', 'Blockchain']

            page_text = soup.get_text()
            found_tech = [tech for tech in tech_keywords if tech in page_text]
            if found_tech:
                data['technologies_used'] = found_tech

            # Infer regulatory topics
            data['regulatory_topics'] = self._infer_regulatory_topics(data)

        except Exception as e:
            logger.error(f"Error in simple website scraping: {e}")
            raise

        return data

    async def _scrape_website(self, url: str) -> dict:
        """
        Extract company information from company website using Playwright

        Args:
            url: Company website URL

        Returns:
            Dictionary with extracted company data
        """
        if not PLAYWRIGHT_AVAILABLE:
            raise ImportError(
                "Playwright is not installed. Install it with: "
                "pip install playwright && playwright install"
            )

        logger.info(f"Scraping website: {url}")

        data = {}

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.goto(url, timeout=self.timeout, wait_until='networkidle')

                # Get page content
                content = await page.content()
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
                await browser.close()

        return data

    def _infer_regulatory_topics(self, data: dict) -> list[str]:
        """
        Infer relevant regulatory topics using GPT based on company information
        Maps to predefined RegulatoryTopic enum values

        Args:
            data: Company data dictionary

        Returns:
            List of relevant regulatory topics from the enum
        """
        # Get text to analyze
        text_fields = [
            f"Description: {data.get('description', '')}",
            f"Industry: {data.get('industry', '')}",
            f"Products/Services: {', '.join(data.get('products_services', []))}",
            f"Technologies: {', '.join(data.get('technologies_used', []))}",
            f"Keywords: {', '.join(data.get('keywords', []))}",
        ]
        company_info = '\n'.join([field for field in text_fields if field.split(': ')[1]])

        if not company_info.strip():
            logger.warning("No company information available for topic inference")
            return None

        # Available topics
        available_topics = [topic.value for topic in RegulatoryTopic]
        topics_str = ', '.join(available_topics)

        # Use GPT to determine relevant topics
        try:
            api_key = settings.get_openai_api_key()
            if not api_key:
                logger.warning("OpenAI API key not configured, falling back to keyword matching")
                return self._infer_regulatory_topics_fallback(data)

            client = OpenAI(api_key=api_key)

            prompt = f"""Based on the following company information, determine which EU regulatory topics are most relevant.

Company Information:
{company_info}

Available regulatory topics:
{topics_str}

CRITICAL RULES (must follow):
1. Financial services (banking, fintech, payments, trading, investment): MUST include BaFin, GDPR, AMLR
2. GDPR applies to almost ALL companies - include it unless the company clearly does NOT handle any customer/user data
3. AI/ML companies: MUST include AI Act, GDPR
4. Any online service, platform, or SaaS: MUST include GDPR
5. Sustainability/climate focus: include ESG
6. Cybersecurity/security services: include Cybersecurity

Instructions:
- Return topics as a comma-separated list
- Be inclusive - when in doubt, include the topic
- GDPR should be included for 90%+ of companies

Example responses:
- Fintech: "BaFin, GDPR, AMLR"
- AI startup: "AI Act, GDPR"
- SaaS platform: "GDPR, Cybersecurity"
- Bank: "BaFin, GDPR, AMLR"
- Green tech: "ESG, GDPR"

Response (comma-separated topics only):"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert in EU regulations and compliance. You help identify which regulatory topics are relevant to different companies."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=100
            )

            result = response.choices[0].message.content.strip()

            if result.lower() == "none":
                return None

            # Parse and validate the topics
            suggested_topics = [topic.strip() for topic in result.split(',')]
            valid_topics = [topic for topic in suggested_topics if topic in available_topics]

            logger.info(f"GPT suggested topics: {valid_topics}")
            return valid_topics if valid_topics else None

        except Exception as e:
            logger.error(f"Error using GPT for topic inference: {e}")
            return self._infer_regulatory_topics_fallback(data)

    def _infer_regulatory_topics_fallback(self, data: dict) -> list[str]:
        """
        Fallback keyword-based topic inference if GPT is unavailable

        Args:
            data: Company data dictionary

        Returns:
            List of relevant regulatory topics from the enum
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

        # Define regulatory topic mappings to enum values
        topic_mappings = {
            RegulatoryTopic.AI_ACT: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'algorithm', 'neural', 'deep learning'],
            RegulatoryTopic.GDPR: ['data', 'privacy', 'gdpr', 'personal', 'information', 'data protection', 'consent'],
            RegulatoryTopic.CYBERSECURITY: ['security', 'cyber', 'encryption', 'authentication', 'firewall', 'threat', 'vulnerability'],
            RegulatoryTopic.BAFIN: ['finance', 'banking', 'payment', 'fintech', 'financial', 'investment', 'trading', 'broker'],
            RegulatoryTopic.AMLR: ['anti-money laundering', 'aml', 'amlr', 'money laundering', 'financial crime', 'compliance', 'transaction monitoring', 'kyc', 'know your customer', 'identity verification', 'customer verification', 'onboarding', 'due diligence'],
            RegulatoryTopic.ESG: ['environmental', 'social', 'governance', 'esg', 'sustainability', 'climate', 'green', 'carbon', 'renewable'],
        }

        for topic_enum, keywords in topic_mappings.items():
            if any(keyword in combined_text for keyword in keywords):
                topics.add(topic_enum.value)

        return list(topics) if topics else None
