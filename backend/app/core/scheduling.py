"""
Simple scheduler for running scraping jobs
"""
import logging
import multiprocessing
import threading
import time
from typing import Callable

import schedule

logger = logging.getLogger(__name__)


class JobScheduler:
    """Simple scheduler wrapper for managing scraping jobs"""

    def __init__(self):
        self.jobs = {}
        self.running = False
        self.thread = None

    def register(self, name: str, func: Callable, schedule_time, run_in_process: bool = False):
        """Register a job to be run on a schedule"""
        logger.info(f"Registering job: {name} with schedule: {schedule_time}")
        self.jobs[name] = {
            "func": func,
            "schedule": schedule_time,
            "run_in_process": run_in_process
        }

        # Wrap the function to handle stop events
        def job_wrapper():
            stop_event = multiprocessing.Event()
            try:
                logger.info(f"Starting job: {name}")
                result = func(stop_event)
                logger.info(f"Completed job: {name} - Result: {result}")
            except Exception as e:
                logger.error(f"Error running job {name}: {e}", exc_info=True)

        schedule_time.do(job_wrapper)

    def start(self):
        """Start the scheduler in a background thread"""
        if self.running:
            logger.warning("Scheduler is already running")
            return

        self.running = True

        def run_schedule():
            logger.info("Scheduler thread started")
            while self.running:
                schedule.run_pending()
                time.sleep(1)
            logger.info("Scheduler thread stopped")

        self.thread = threading.Thread(target=run_schedule, daemon=True)
        self.thread.start()
        logger.info(f"Scheduler started with {len(self.jobs)} jobs")

    def stop(self):
        """Stop the scheduler"""
        logger.info("Stopping scheduler...")
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)


# Global scheduler instance
scheduler = JobScheduler()
