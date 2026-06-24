import streamlit as st
import json
import pandas as pd
import plotly.graph_objects as go
import networkx as nx
from pyvis.network import Network
import streamlit.components.v1 as components

st.set_page_config(page_title="Results", page_icon="📊", layout="wide",
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

st.title("📊 Analysis Results")

job = st.session_state.get('job_designation', 'Unknown')
mode = st.session_state.get('analysis_mode', 'Unknown')

st.subheader(f"Career Path: {job}")
st.caption(f"Mode: {mode}")

# Navigation buttons
col1, col2 = st.columns([1, 1])

with col1:
    if st.button("🔄 New Analysis", use_container_width=True):
        st.session_state.clear()
        st.switch_page("app.py")

with col2:
    if 'results' in st.session_state:
        json_str = json.dumps(st.session_state.results, indent=2)
        st.download_button(
            "📥 Download Report",
            json_str,
            f"analysis_{job}.json",
            "application/json",
            use_container_width=True
        )

st.markdown("---")

# Check if results exist
if 'results' not in st.session_state:
    st.error("No results available")
    if st.button("Go Home"):
        st.switch_page("app.py")
    st.stop()

# Process results
result = st.session_state.results

# Create dataframe for filtering
if 'skill_cluster_df' not in st.session_state:
    skill_clusters = result.get('skill_clusters_w_classification', {})
    all_rows = []
    
    for skill_type in skill_clusters:
        for cluster, skills in skill_clusters.get(skill_type, {}).items():
            for skill_name, weight, is_core in skills:
                all_rows.append({
                    'Skill Type': skill_type,
                    'Cluster': cluster,
                    'Skill': skill_name,
                    'Weight': weight,
                    'Is Core': is_core
                })
    
    st.session_state.skill_cluster_df = pd.DataFrame(all_rows) if all_rows else pd.DataFrame()

st.success("✅ Analysis Complete!")

# Chart generation functions
def create_horizontal_bar_chart(df: pd.DataFrame, top_n: int = 20):
    """Create horizontal bar chart for top skills"""
    skill_weights = df.groupby('Skill')['Weight'].sum().sort_values(ascending=False).head(top_n)
    
    fig = go.Figure(go.Bar(
        x=skill_weights.values,
        y=skill_weights.index,
        orientation='h',
        text=[f"{w:.0f}" for w in skill_weights.values],
        textposition='auto',
        marker=dict(
            color='rgba(50, 171, 96, 0.7)',
            line=dict(color='rgba(50, 171, 96, 1.0)', width=1)
        )
    ))
    fig.update_layout(
        title=f"Top {top_n} Skills by Market Demand",
        xaxis_title="Market Demand (No. of times found in job descriptions)",
        yaxis_title="Skill",
        yaxis={'autorange': 'reversed'},
        height=500,
        margin=dict(l=150)
    )
    return fig


def create_sunburst_chart(clusters: dict):
    """Create sunburst chart from skill clusters"""
    labels = ['All Skills']
    parents = ['']
    values = [0]
    
    for cluster_name, skills in clusters.items():
        labels.append(cluster_name)
        parents.append('All Skills')
        cluster_value = sum(skill[1] for skill in skills)
        values.append(cluster_value)
    
    for cluster_name, skills in clusters.items():
        for skill_arr in skills:
            skill_name = skill_arr[0]
            weight = skill_arr[1]
            skill_label = f"{cluster_name}: {skill_name}"
            labels.append(skill_label)
            parents.append(cluster_name)
            values.append(weight)
    
    values[0] = sum(values[1:len(clusters)+1])
    
    fig = go.Figure(go.Sunburst(
        labels=labels,
        parents=parents,
        values=values,
        branchvalues='total',
        hovertemplate='<b>%{label}</b><br>Weight: %{value}<br>',
        insidetextorientation='radial'
    ))
    fig.update_layout(
        title="Skill Weight Sunburst",
        height=500,
        margin=dict(t=50, l=10, r=10, b=10)
    )
    return fig


def generate_network_chart(skill_cluster: dict, skill_type: str):
    """Generate network chart HTML for skills visualization"""
    if len(skill_cluster) == 0:
        return None

    def to_dataframe(skill_cluster):
        return pd.DataFrame([
            [item, skill_cluster[item][0][0], skill_cluster[item][0][1], skill_cluster[item][0][2]]
            for item in skill_cluster
        ], columns=['Cluster', 'Skill', 'Weight', 'Is Core'])

    skill_cluster_dataframe = to_dataframe(skill_cluster[skill_type])

    # Only top 10 clusters by total weight
    cluster_weight_sum = skill_cluster_dataframe.groupby("Cluster")["Weight"].sum()
    top_clusters = cluster_weight_sum.sort_values(ascending=False).head(10).index
    df_top = skill_cluster_dataframe[skill_cluster_dataframe["Cluster"].isin(top_clusters)].copy()
    df_top["Cluster"] = df_top["Cluster"].astype(str)

    G = nx.Graph()

    # Add cluster nodes
    for cluster in df_top["Cluster"].unique():
        G.add_node(cluster, label=cluster, color="#1976D2", size=45)

    # Add skill nodes and edges
    for _, row in df_top.iterrows():
        skill = row["Skill"]
        cluster = row["Cluster"]
        weight = row["Weight"]
        is_core = row["Is Core"]
        node_color = "#43A047" if is_core else "#FFA000"
        node_size = min(15 + weight, 65)
        title = f"Weight: {weight}"
        if is_core:
            title += " — Core Skill (University Curriculum & Hot in Job Market)"
        G.add_node(skill, label=skill, color=node_color, size=node_size, title=title)
        G.add_edge(cluster, skill, weight=weight)

    net = Network(height="650px", width="100%", notebook=False, cdn_resources='in_line')
    net.force_atlas_2based()
    net.from_nx(G)

    html = net.generate_html()
    
    return html

def flatten_skill_clusters(nested_dict):
    """Flatten {'Soft': {...}, 'Technical': {...}} → merged {...}"""
    merged = {}
    for skill_type in ['Soft', 'Technical', 'Knowledge']:
        merged.update(nested_dict.get(skill_type, {}))
    return merged

def show_trend_analysis(result, combined_result):
    """Display trend analysis with charts"""
    st.subheader("Skills Trend Analysis")
    df = st.session_state.skill_cluster_df
    
    if df is None or len(df) == 0:
        st.info("No skill cluster data available")
        return
    
    # Filters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        cluster_filter = st.selectbox("Filter by Cluster:", 
                                     options=["All Clusters"] + list(df['Cluster'].unique()))
    
    with col2:
        core_filter = st.selectbox("Filter by Type:", 
                                   options=["All Skills", "Core Skills", "Non-Core Skills"])
    
    with col3:
        top_n = st.number_input("Top N Skills:", min_value=5, max_value=50, value=20)
    
    # Apply filters
    filtered_df = df.copy()
    if cluster_filter != "All Clusters":
        filtered_df = filtered_df[filtered_df['Cluster'] == cluster_filter]
    
    if core_filter == "Core Skills":
        filtered_df = filtered_df[filtered_df['Is Core'] == True]
    elif core_filter == "Non-Core Skills":
        filtered_df = filtered_df[filtered_df['Is Core'] == False]
    
    # Charts
    st.markdown("### 📊 Top Skills by Market Demand")
    bar_chart = create_horizontal_bar_chart(filtered_df, top_n)
    st.plotly_chart(bar_chart, use_container_width=True)
    
    st.markdown("### 🎯 Skill Weight Sunburst")
    sunburst_chart = create_sunburst_chart(combined_result['skill_clusters_w_classification'])
    st.plotly_chart(sunburst_chart, use_container_width=True)
    
    # Network Graphs
    st.markdown("### 🕸️ Skill-Cluster Network Graph")
    skill_clusters = result.get('skill_clusters_w_classification', {})
    skill_types = list(skill_clusters.keys())
    
    if skill_types:
        network_tabs = st.tabs([st.replace('_', ' ').title() for st in skill_types])
        
        for idx, skill_type in enumerate(skill_types):
            with network_tabs[idx]:
                try:
                    html_data = generate_network_chart(skill_clusters, skill_type)
                    components.html(html_data, height=700, scrolling=False)
                except Exception as e:
                    st.info(f"No network visualization available for {skill_type}")


def show_course_recommendations(result):
    """Display course recommendations"""
    st.subheader("🎓 Course Recommendations")
    course_recs = result.get('cluster_wise_course_recommendation', {})
    
    if not course_recs:
        st.info("No course recommendations available")
        return
    
    for cluster_key, cluster_data in course_recs.items():
        with st.expander(f"📚 {cluster_data.get('title', cluster_key)}", expanded=False):
            courses = cluster_data.get('courses', {})
            if not courses:
                st.info("No courses available for this cluster")
                continue
            
            for skill_category, course_list in courses.items():
                st.markdown(f"**{skill_category}**")
                if isinstance(course_list, str):
                    st.markdown(f"- [View Course]({course_list})")
                elif isinstance(course_list, dict):
                    for name, url in course_list.items():
                        st.markdown(f"- [{name}]({url})")
                elif isinstance(course_list, list):
                    for course in course_list:
                        if isinstance(course, list) and len(course) >= 2:
                            st.markdown(f"- [{course[0]}]({course[1]})")
                        else:
                            st.markdown(f"- {course}")
                st.markdown("---")


def show_curriculum_recommendations(result):
    """Display curriculum recommendations"""
    st.subheader("📚 Curriculum Improvement Recommendations")
    recommendations = result.get('curriculum_recommendations', {})
    
    if not recommendations:
        st.info("No curriculum recommendations available")
        return
    
    for skill_type in recommendations:
        st.markdown(f"### {skill_type.replace('_', ' ').title()} Skills")
        
        for cluster_name, cluster_data in recommendations.get(skill_type, {}).items():
            with st.expander(f"🎯 Cluster: {cluster_name}", expanded=False):
                skills = cluster_data.get('skills', [])
                if skills:
                    st.markdown("**Skills to Add:**")
                    for skill in skills:
                        st.markdown(f"- {skill}")
                
                pages = cluster_data.get('pages', [])
                if pages:
                    st.markdown(f"**Suggested Pages:** {', '.join(map(str, pages))}")
                
                st.markdown("---")
                
                llm_rec = cluster_data.get('llm_recommendation', {})
                if isinstance(llm_rec, dict):
                    col1, col2 = st.columns(2)
                    with col1:
                        st.markdown("**Original Section**")
                        st.text_area("Original", value=llm_rec.get('Original Section', 'N/A'),
                                   height=200, key=f"orig{skill_type}{cluster_name}", disabled=True)
                    with col2:
                        st.markdown("**Revised Section**")
                        st.text_area("Revised", value=llm_rec.get('Revised Section', 'N/A'),
                                   height=200, key=f"rev{skill_type}_{cluster_name}", disabled=True)
                    
                    st.markdown("**Explanation**")
                    st.info(llm_rec.get('Explanation', 'N/A'))
                else:
                    st.write(llm_rec)


def show_raw_json(result):
    """Display raw JSON output"""
    st.subheader("📋 Raw JSON Response")
    st.json(result)


# Display tabs based on analysis mode
if mode == "Course Recommendation":
    # Combine results for course recommendation
    skill_clusters_flat = flatten_skill_clusters(result.get('skill_clusters_w_classification', {}))
    course_recs_flat = flatten_skill_clusters(result.get('cluster_wise_course_recommendation', {}))
    combined_result = {
        'skill_clusters_w_classification': skill_clusters_flat,
        'cluster_wise_course_recommendation': course_recs_flat
    }

    tab1, tab2, tab3 = st.tabs(["📊 Trend Analysis", "🎓 Course Recommendations", "📋 Raw JSON"])
    
    with tab1:
        show_trend_analysis(result, combined_result)
    with tab2:
        show_course_recommendations(combined_result)
    with tab3:
        show_raw_json(result)

else:  # Curriculum Recommendation
    tab1, tab2, tab3 = st.tabs(["📊 Trend Analysis", "📚 Curriculum Recommendations", "📋 Raw JSON"])
    
    with tab1:
        skill_clusters_flat = flatten_skill_clusters(result.get('skill_clusters_w_classification', {}))
        show_trend_analysis(result, {'skill_clusters_w_classification': skill_clusters_flat})
    with tab2:
        show_curriculum_recommendations(result)
    with tab3:
        show_raw_json(result)
