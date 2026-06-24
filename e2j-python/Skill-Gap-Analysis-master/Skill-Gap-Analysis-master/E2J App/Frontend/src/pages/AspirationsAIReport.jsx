import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getAspirations } from "../services/aspirationsService";
import DashboardLayout from "../layout/DashboardLayout";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide } from "d3-force";
import "../styles/aspirations.css";
import courseIcon from "../assets/images/aspirations/aspirations-profile thumbnail.svg"

function NetworkGraph({ networkData, title }) {
  const graphRef = useRef(null);

  if (!networkData.nodes || networkData.nodes.length === 0) {
    return (
      <div className="asp-existing-card" style={{ marginTop: "1.5rem" }}>
        <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>
          No network visualization available
        </p>
      </div>
    );
  }

  return (
    <div className="asp-existing-card" style={{ marginTop: "1.5rem" }}>
      <h3 style={{ margin: "0 0 16px 0" }}>{title}</h3>
      <div style={{ height: "750px", background: "#f9fafb", borderRadius: "8px", overflow: "hidden" }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={networkData}
          nodeColor="color"
          nodeVal="size"
          linkColor={() => "rgba(156, 163, 175, 0.35)"}
          linkWidth={1.5}
          backgroundColor="#f9fafb"
          cooldownTicks={200}
          d3AlphaDecay={0.022}
          d3VelocityDecay={0.3}
          warmupTicks={80}
          onEngineStop={() => {
            networkData.nodes.forEach(n => { if(!n.id.includes('-')){ n.fx=null; n.fy=null; } });
            graphRef.current.zoomToFit(400, 60);
          }}
          d3Force={(f) => {
            f('charge').strength(node =>!node.id.includes('-')? -250 : -90);
            f('link').distance(60).strength(0.4);
            f('collide', forceCollide().radius(d => (d.size || 10) + 8).strength(1));
            f('center').x(0).y(0).strength(0.03);
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = Math.max(10 / globalScale, 5);
            const radius = (node.size || 10) / globalScale;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = node.color || "#999";
            ctx.fill();
            ctx.font = `600 ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#374151";
            ctx.fillText(label, node.x, node.y + radius + 2);
          }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "16px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#1976D2" }} />
          Skill Cluster
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#43A047" }} />
          Learned Skill
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFA000" }} />
          To Learn (Desired)
        </span>
      </div>
    </div>
  );
}

export default function AspirationsAIReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("taskId") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [aspirationMeta, setAspirationMeta] = useState({});
  const [showCourses, setShowCourses] = useState(false);
  const [activeNetworkTab, setActiveNetworkTab] = useState("Technical");
  const [filters, setFilters] = useState({ cluster: "All Clusters", coreFilter: "All Skills", topN: 20 });

  const userName = localStorage.getItem("userName") || "Student";
  const userRole = localStorage.getItem("userRole") || "Student";

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const data = await getAspirations();
        if (!data?.aspirations?.length) { setError("No aspirations found"); return; }
        const target = data.aspirations.find(a => a.aiTaskId === taskId);
        if (!target) { setError("Report not found"); return; }
        if (target.aiStatus!== "finished") { setError("Analysis is not complete yet"); return; }
        if (!target.aiResult) { setError("No analysis results found"); return; }
        setAspirationMeta({ job: target.roleMatch, mode: target.analysisMode });
        setReportData(target.aiResult);
      } catch (e) {
        setError("Failed to load the report");
      } finally {
        setLoading(false);
      }
    }
    taskId? loadReport() : (setError("No task ID provided"), setLoading(false));
  }, [taskId]);

  const skillClusterDF = useMemo(() => {
    if (!reportData?.skill_clusters_w_classification) return [];
    const rows = [];
    for (const type of ["Soft","Technical","Knowledge"]) {
      const clusters = reportData.skill_clusters_w_classification[type] || {};
      for (const [name, skills] of Object.entries(clusters)) {
        if (Array.isArray(skills)) skills.forEach(s => Array.isArray(s) && s.length>=3 && rows.push({skillType:type, cluster:name, skill:s[0], weight:s[1], isCore:s[2]}));
      }
    }
    return rows;
  }, [reportData]);

  const filteredData = useMemo(() => {
    let f = [...skillClusterDF];
    if (filters.cluster!== "All Clusters") f = f.filter(r => r.cluster === filters.cluster);
    if (filters.coreFilter === "Core Skills") f = f.filter(r => r.isCore);
    if (filters.coreFilter === "Non-Core Skills") f = f.filter(r =>!r.isCore);
    return f;
  }, [skillClusterDF, filters]);

  const topSkills = useMemo(() => {
    const w = {};
    filteredData.forEach(r => w[r.skill] = (w[r.skill]||0) + r.weight);
    return Object.entries(w).map(([skill,weight])=>({skill,weight})).sort((a,b)=>b.weight-a.weight).slice(0,filters.topN);
  }, [filteredData, filters.topN]);

  const uniqueClusters = useMemo(() => ["All Clusters",...new Set(skillClusterDF.map(r=>r.cluster))], [skillClusterDF]);
  const skillTypes = useMemo(() => reportData?.skill_clusters_w_classification? Object.keys(reportData.skill_clusters_w_classification).filter(t=>Object.keys(reportData.skill_clusters_w_classification[t]||{}).length) : [], [reportData]);

  const networkDataByType = useMemo(() => {
    if (!reportData?.skill_clusters_w_classification) return {};
    const out = {};
    for (const type of ["Soft","Technical","Knowledge"]) {
      const clusters = reportData.skill_clusters_w_classification[type]||{};
      const entries = Object.entries(clusters);
      if (!entries.length) continue;
      const nodes=[], links=[], ids=new Set();
      const weights={};
      entries.forEach(([n,s])=>{
        if(Array.isArray(s)) weights[n]=s.filter(a=>Array.isArray(a)&&a.length>=3).reduce((sum,a)=>sum+a[1],0);
      });
      const top = Object.entries(weights).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([n])=>n);

      const radius = 100;
      top.forEach((n,i)=>{
        const angle = (i / top.length) * 2 * Math.PI;
        nodes.push({
          id:n, name:n, color:"#1976D2", size:35,
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          fx: radius * Math.cos(angle),
          fy: radius * Math.sin(angle)
        });
      });

      entries.forEach(([cn,skills])=>{
        if(!top.includes(cn)||!Array.isArray(skills))return;
        const clusterNode = nodes.find(nd=>nd.id===cn);
        const validSkills = skills.filter(se=>Array.isArray(se)&&se.length>=3);

        validSkills.forEach((se, idx)=>{
          const [sn,w,core]=se;
          const id=`${cn}-${sn}`;
          if(!ids.has(id)){
            ids.add(id);
            const skillAngle = (idx / validSkills.length) * 2 * Math.PI;
            const skillRadius = 65 + Math.min(w*1.5, 25);
            nodes.push({
              id, name:sn, color:core?"#43A047":"#FFA000",
              size:Math.min(12+w*2.5,22),
              x: clusterNode.x + skillRadius * Math.cos(skillAngle),
              y: clusterNode.y + skillRadius * Math.sin(skillAngle)
            });
          }
          links.push({source:cn,target:id});
        });
      });
      out[type]={nodes,links};
    }
    return out;
  }, [reportData]);

  const courseRecommendations = useMemo(() => {
    if (!reportData?.cluster_wise_course_recommendation) return {};
    const flat={};
    ["Soft","Technical","Knowledge"].forEach(t=>{
      Object.entries(reportData.cluster_wise_course_recommendation[t]||{}).forEach(([k,v])=>{if(typeof v==="object"&&v) flat[k]=v;});
    });
    return flat;
  }, [reportData]);

  const curriculumRecommendations = useMemo(() => reportData?.curriculum_recommendations||{}, [reportData]);

  if (loading) return (
    <DashboardLayout title="Loading" userName={userName} userRole={userRole}>
      <div className="asp-reports-container">
        <div className="asp-reports-header">
          <div className="asp-reports-header-left">
            <h2>Loading...</h2>
            <p>Preparing your analysis report</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout title="Error" userName={userName} userRole={userRole}>
      <div className="asp-reports-container">
        <div className="asp-existing-status asp-existing-status--failed">{error}</div>
        <Link to="/dashboard/aspirations">Back to Aspirations</Link>
      </div>
    </DashboardLayout>
  );

  const isCourseMode = aspirationMeta.mode === "Course Recommendation";

  return (
    <DashboardLayout title={showCourses? "Course Recommendations" : "Analysis Results"} userName={userName} userRole={userRole}>
      <div className="asp-reports-container">
        <div className="asp-reports-header">
          <div className="asp-reports-header-left">
            {!showCourses && (
              <button 
                onClick={() => navigate("/dashboard/aspirations")} 
                className="asp-btn-primary" 
                style={{background:"#6b7280"}}
              >
                ← Back to my Aspirations
              </button>
            )}
            {showCourses && (
              <button 
                onClick={()=>setShowCourses(false)} 
                className="asp-btn-primary" 
                style={{background:"#6b7280"}}
              >
                ← Skills Analysis
              </button>
            )}
            <h2 style={{margin: "12px 0 4px 0"}}>{showCourses? "Course Recommendations" : "Analysis Results"}</h2>
            <p style={{margin: 0}}>Career Path: {aspirationMeta.job} | Mode: {aspirationMeta.mode}</p>
          </div>
          <div className="asp-existing-actions">
            {!showCourses && (
              <button onClick={()=>setShowCourses(true)} className="asp-btn-primary">
                Recommended Courses →
              </button>
            )}  
          </div>
        </div>

        <div className="asp-tab-content">
          {!showCourses? (
            <div>
              <div className="asp-filters">
                <div className="asp-filter-group"><label>Cluster</label><select value={filters.cluster} onChange={e=>setFilters(f=>({...f,cluster:e.target.value}))}>{uniqueClusters.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="asp-filter-group"><label>Skill Type</label><select value={filters.coreFilter} onChange={e=>setFilters(f=>({...f,coreFilter:e.target.value}))}><option>All Skills</option><option>Core Skills</option><option>Non-Core Skills</option></select></div>
                <div className="asp-filter-group"><label>Top N Skills</label><input type="number" min="5" max="50" value={filters.topN} onChange={e=>setFilters(f=>({...f,topN:parseInt(e.target.value)||20}))} /></div>
              </div>

              <div className="asp-existing-card">
                <h3 style={{margin:"0 0 16px 0"}}>Top Skills by Market Demand</h3>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={topSkills} layout="vertical" margin={{left:160,right:40,top:20,bottom:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{fill:"#6b7280",fontSize:12}} />
                    <YAxis type="category" dataKey="skill" width={150} tick={{fill:"#374151",fontSize:12}} />
                    <Tooltip />
                    <Bar dataKey="weight" fill="#4f46e5" radius={[0,6,6,0]}>{topSkills.map((e,i)=><Cell key={i} fill="#4f46e5"/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{marginTop:"1.5rem"}}>
                <h3 style={{marginBottom:"16px"}}>Skill-Cluster Network Graph</h3>
                <div className="asp-tabs-container">{skillTypes.map(st=><button key={st} className={`asp-tab ${activeNetworkTab===st? "asp-tab--active" : ""}`} onClick={()=>setActiveNetworkTab(st)}>{st}</button>)}</div>
                <NetworkGraph networkData={networkDataByType[activeNetworkTab]||{nodes:[],links:[]}} title={`${activeNetworkTab} Skills Network`} />
              </div>
            </div>
          ) : (
            <div>
              {isCourseMode? (
                <div className="asp-reports-list" style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                  {Object.keys(courseRecommendations).length===0?
                    <div className="asp-existing-card"><p style={{color:"#6b7280",textAlign:"center"}}>No course recommendations available</p></div>
                  :
                  Object.entries(courseRecommendations).flatMap(([clusterName, cd]) =>
                    Object.entries(cd.courses||{}).flatMap(([category, list]) => {
                      const courses = typeof list === "string"? [[category, list]]
                                    : Array.isArray(list)? list
                                    : typeof list === "object"? Object.entries(list)
                                    : [];

                      return courses.map((c, i) => {
                        const name = Array.isArray(c)? c[0] : String(c);
                        const url = Array.isArray(c)? c[1] : c;
                        let origin = "Unknown";
                        try {
                          const domain = new URL(url).hostname.replace('www.','');
                          if (domain.includes('coursera')) origin = 'Coursera';
                          else if (domain.includes('youtube')) origin = 'YouTube';
                          else if (domain.includes('edx')) origin = 'edX';
                          else if (domain.includes('udemy')) origin = 'Udemy';
                          else if (domain.includes('pluralsight')) origin = 'Pluralsight';
                          else origin = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
                        } catch(e) {}

                        return (
                          <div key={`${clusterName}-${category}-${i}`} className="asp-existing-card" style={{padding: "20px"}}>
                            <div style={{display: "flex", gap: "16px"}}>
                              <img
                                src={courseIcon}
                                alt={name}
                                style={{width: "120px", height: "80px", objectFit: "cover", borderRadius: "8px", background: "#e5e7eb"}}
                              />
                              <div style={{flex: 1}}>
                                <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px"}}>
                                  <h4 style={{margin: 0, fontSize: "16px", fontWeight: 600, color: "#111827"}}>{name}</h4>
                                  <span style={{fontSize: "12px", padding: "4px 10px", borderRadius: "12px", background: "#f3f4f6", color: "#6b7280", whiteSpace: "nowrap"}}>
                                    {origin}
                                  </span>
                                </div>
                                <div style={{fontSize: "13px", color: "#6b7280", marginBottom: "12px"}}>
                                  Cluster: {cd.title || clusterName} | {category}
                                </div>
                                <a href={url} target="_blank" rel="noreferrer" className="asp-btn-primary" style={{display: "inline-block", fontSize: "13px", padding: "8px 16px"}}>
                                  View Course →
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })
                  )}
                </div>
              ) : (
                <div>{Object.keys(curriculumRecommendations).length===0?<div className="asp-existing-card"><p style={{color:"#6b7280",textAlign:"center"}}>No curriculum recommendations available</p></div>:
                  Object.entries(curriculumRecommendations).map(([st,cls])=>(
                    <div key={st} style={{marginBottom:"2rem"}}><h3 style={{marginBottom:"1rem"}}>{st.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase())} Skills</h3>
                      {Object.entries(cls||{}).map(([cn,cd])=>(
                        <details key={cn} className="asp-existing-card" style={{marginBottom:"1rem"}}><summary style={{cursor:"pointer",fontWeight:600}}>Cluster: {cn}</summary>
                          <div style={{marginTop:"16px",paddingTop:"16px",borderTop:"1px solid #e5e7eb"}}>
                            {cd.skills?.length>0&&<div style={{marginBottom:"16px"}}><strong>Skills to Add:</strong><ul style={{listStyle:"disc",marginLeft:"20px"}}>{cd.skills.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
                            {cd.pages?.length>0&&<div style={{marginBottom:"16px"}}><strong>Suggested Pages:</strong> {cd.pages.join(", ")}</div>}
                            {cd.llm_recommendation&&(
                              <div>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginTop:"16px"}}>
                                  <div>
                                    <strong>Original Section</strong>
                                    <textarea value={cd.llm_recommendation["Original Section"]||"N/A"} readOnly style={{width:"100%",height:"200px",padding:"12px",borderRadius:"8px",border:"1px solid #e5e7eb",fontSize:"13px"}}/>
                                  </div>
                                  <div>
                                    <strong>Revised Section</strong>
                                    <textarea value={cd.llm_recommendation["Revised Section"]||"N/A"} readOnly style={{width:"100%",height:"200px",padding:"12px",borderRadius:"8px",border:"1px solid #e5e7eb",fontSize:"13px"}}/>
                                  </div>
                                </div>
                                {cd.llm_recommendation?.Explanation&&<div style={{marginTop:"12px",padding:"12px",background:"#f0f9ff",borderRadius:"8px",border:"1px solid #bae6fd"}}><strong>Explanation:</strong> {cd.llm_recommendation.Explanation}</div>}
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}