import logging
import multiprocessing

import schedule

from app.core.scheduling import scheduler
from app.data_sources.scrapers.legislative_observatory_scraper import LegislativeObservatoryScraper

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def scrape_legislative_observatory(stop_event: multiprocessing.synchronize.Event):
    scraper = LegislativeObservatoryScraper(stop_event=stop_event)
    return scraper.scrape()


def setup_scheduled_jobs():
    scheduler.register(
        "scrape_legislative_observatory",
        scrape_legislative_observatory,
        schedule.every().monday.at("04:20"),
        run_in_process=True,
    )
