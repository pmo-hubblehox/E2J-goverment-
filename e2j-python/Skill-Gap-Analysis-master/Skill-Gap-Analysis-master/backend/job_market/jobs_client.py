import os
import asyncpg
from dotenv import load_dotenv
import asyncio


load_dotenv()


class Jobs:
    def __init__(self):
        self.pool = None
        print('Jobs class instantiated')

    @classmethod
    async def create(cls):
        """Factory method to create and initialize Jobs instance"""
        instance = cls()
        instance.pool = await asyncpg.create_pool(
            host="localhost",
            port=5432,
            database=os.getenv('POSTGRES_DB'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PWD'),
            min_size=10,
            max_size=20
        )
        return instance

    async def query_from_database(self, designation, limit=10):
        """
        Query jobs from database filtered by designation.
        
        Args:
            designation: The job designation to filter by
            limit: Number of jobs to retrieve (default: 10)
        
        Returns:
            List of job records as dictionaries
        """
        try:
            async with self.pool.acquire() as conn:
                query = """
                    SELECT * FROM jobs_data 
                    WHERE designation ILIKE $1 
                    ORDER BY created_at DESC 
                    LIMIT $2
                """
                rows = await conn.fetch(query, f"%{designation}%", limit)
                return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error querying database: {e}")
            return []
    
    async def close(self):
        """Close the connection pool"""
        if self.pool:
            await self.pool.close()
    
    async def insert_into_database(self, rows: list[dict], table_name="jobs_data"):
        if not rows:
            return

        # Use keys from the first row as the column order
        columns = list(rows[0].keys())

        # Convert dicts -> tuples in the same column order
        records = [tuple(r.get(c) for c in columns) for r in rows]

        try:
            async with self.pool.acquire() as conn:
                create_query = f"""
                    CREATE TABLE IF NOT EXISTS {table_name} (
                        id SERIAL PRIMARY KEY,
                        job_id TEXT,
                        job_title TEXT,
                        designation TEXT,
                        company TEXT,
                        reviews INTEGER,
                        location TEXT,
                        experience TEXT,
                        salary TEXT,
                        posted_on DATE,
                        openings INTEGER,
                        applications INTEGER,
                        role TEXT,
                        job_description TEXT,
                        industry_type TEXT,
                        department TEXT,
                        employment_type TEXT,
                        role_category TEXT,
                        education TEXT,
                        key_skills TEXT,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                """
                await conn.execute(create_query)

                result = await conn.copy_records_to_table(
                    table_name,
                    records=records,
                    columns=columns,
                    timeout=30
                )
                print(f"Inserted {result} records in Jobs DB")
        except Exception as e:
            print(f"Error inserting into database: {e}")


async def main():
    jobclass = await Jobs.create()
    try:
        results = await jobclass.query_from_database(designation="Engineer")
        return results
    finally:
        await jobclass.close()  # Clean up the pool


if __name__ == '__main__':
    asyncio.run(main())
