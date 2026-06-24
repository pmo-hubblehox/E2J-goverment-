# test_api_fixed.py
import requests
import uuid

def test_all_endpoints():
    base_url = "http://localhost:8000"
    
    print("🔍 Testing API endpoints...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Test 2: Redis debug
    try:
        response = requests.get(f"{base_url}/api/debug-redis")
        print(f"✅ Redis debug: {response.status_code}")
        print(f"   Redis version: {response.json().get('redis_version', 'Unknown')}")
    except Exception as e:
        print(f"❌ Redis debug failed: {e}")
    
    # Test 3: Worker status
    try:
        response = requests.get(f"{base_url}/api/worker-status")
        print(f"✅ Worker status: {response.status_code}")
        print(f"   Workers available: {response.json().get('workers_available', 0)}")
    except Exception as e:
        print(f"❌ Worker status failed: {e}")
    
    # Test 4: Test enqueue
    try:
        response = requests.post(f"{base_url}/api/test-enqueue")
        print(f"✅ Test enqueue: {response.status_code}")
        print(f"   Job ID: {response.json().get('job_id', 'Unknown')}")
    except Exception as e:
        print(f"❌ Test enqueue failed: {e}")

if __name__ == "__main__":
    test_all_endpoints()