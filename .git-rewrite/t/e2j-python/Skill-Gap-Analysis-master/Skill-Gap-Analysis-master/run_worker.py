from workers.worker import worker


import os
import certifi

# This forces requests to use the certified bundle inside your .venv
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['CURL_CA_BUNDLE'] = certifi.where()


worker.work(
        # with_scheduler=False,
        # This runs cleanup every 600 seconds (default is 600)
        # maintenance_interval=600  
    )