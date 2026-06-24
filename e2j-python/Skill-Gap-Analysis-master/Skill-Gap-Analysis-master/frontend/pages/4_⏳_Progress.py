import streamlit as st
import requests
import time
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Progress", page_icon="⏳", layout="wide",
    initial_sidebar_state="collapsed")

# Completely hide sidebar
st.markdown("""
    <style>
        [data-testid="stSidebar"] {
            display: none;
        }
        [data-testid="collapsedControl"] {
            display: none;
        }
    </style>
""", unsafe_allow_html=True)

st.title("⏳ Analysis in Progress")

job = st.session_state.get('job_designation', 'Unknown')
mode = st.session_state.get('analysis_mode', 'Unknown')

st.subheader(f"Analyzing: {job}")
st.caption(f"Mode: {mode}")

st.markdown("---")

def get_task_status(task_id):
    try:
        response = requests.get(f"{BACKEND_URL}/api/status/{task_id}")
        response.raise_for_status()
        return response.json()
    except:
        return None

def get_task_result(task_id):
    try:
        response = requests.get(f"{BACKEND_URL}/api/result/{task_id}")
        response.raise_for_status()
        return response.json()
    except:
        return None

# Progress tracking
task_id = st.session_state.get('task_id')

if not task_id:
    st.error("No task ID found. Please submit an analysis first.")
    if st.button("Go Back"):
        st.switch_page("app.py")
    st.stop()

with st.status("Analyzing...", expanded=True) as status:
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    while True:
        task_status = get_task_status(task_id)
        
        if not task_status:
            st.error("Failed to fetch status")
            break
        
        progress = task_status.get('progress', 0)
        progress_bar.progress(progress / 100)
        status_text.text(f"{task_status['status']}: {task_status.get('message', '')}")
        
        if task_status['status'] in ['completed', 'finished']:
            status.update(label="✅ Complete!", state="complete")
            result = get_task_result(task_id)
            
            if result:
                st.session_state.results = result
                st.success("Analysis complete!")
                st.switch_page("pages/5_📊_Results.py")
            break
        
        elif task_status['status'] == 'failed':
            status.update(label="❌ Failed", state="error")
            st.error(f"Analysis failed: {task_status.get('error', 'Unknown error')}")
            break
        
        time.sleep(5)
