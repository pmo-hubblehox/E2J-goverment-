from redis import Redis
from rq import Queue
from rq_win import WindowsWorker

# Adjust the Redis URL if needed
redis_conn = Redis.from_url("redis://localhost:6379/0")
queue = Queue('default', connection=redis_conn)
worker = WindowsWorker([queue], connection=redis_conn)
