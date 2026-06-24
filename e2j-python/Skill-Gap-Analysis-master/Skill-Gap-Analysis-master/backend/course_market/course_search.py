from typing import Tuple, List
from backend.common.integrations.oxylab_fns import zyte_scrape_batch
import asyncio

async def course_search(queries: List[str]) -> List[List[Tuple[str, str]]]:
    tasks = [zyte_scrape_batch(q) for q in queries]
    results = await asyncio.gather(*tasks)
    return results