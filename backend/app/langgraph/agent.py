import os
from typing import Literal, TypedDict
from datetime import datetime, timedelta
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from app.core.supabase_client import supabase
import json
import requests

load_dotenv()

# Initialize
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

class WorkflowState(TypedDict): 
    entries: list
    classified: list
    notifications: list

def fetch_entries(state: WorkflowState):
    print("Fetching entries...")

    provided_entries = state.get("entries", [])
    
    if provided_entries:  # If entries exist
        print("Using provided entries")
        return {"entries": provided_entries}  # Return them as-is
    
    # Fetch entries with GDPR or AI Act topics directly from Supabase
    response = supabase.table("legislative_files") \
        .select("*") \
        .or_("topics.cs.{GDPR},topics.cs.{AI Act}") \
        .execute()
    
    if not response.data:
        print("No entries found with GDPR or AI Act topics")
        return {"entries": []}
    
    print(f"Found {len(response.data)} entries with GDPR or AI Act topics")
    return {"entries": response.data}

def classify_entries(state: WorkflowState):
    entries = state.get("entries", [])
    
    if not entries:
        print("No entries to classify")
        return {"classified": []}
    
    print(f"Classifying {len(entries)} entries...")
    
    # Build a single prompt for all entries
    entries_text = "\n\n".join([
        f"Entry {i+1}:\nTitle: {e.get('title')}\nCommittee: {e.get('committee')}\nSubjects: {e.get('subjects')}"
        for i, e in enumerate(entries)
    ])
    
    prompt = f"""
    Classify each of these documents as 'minor', 'medium', or 'major' importance based on their impact on AI regulation and data protection.
    
    {entries_text}
    
    Respond with only a JSON array like: ["major", "medium", "minor", ...]
    """
    
    response = llm.invoke(prompt)
    # Safer JSON parsing
    try:
        content = response.content.strip()
        # Remove potential markdown code blocks
        content = content.replace("```json", "").replace("```", "").strip()
        severities = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"Failed to parse response: {response.content}")
        print(f"Error: {e}")
        # Fallback: classify all as minor
        severities = ["minor"] * len(entries)
    
    classified = []
    for entry, severity in zip(entries, severities):
        severity = severity.lower()
        if severity not in ["minor", "medium", "major"]:
            severity = "minor"
        
        classified.append({
            "id": entry.get("id"),
            "title": entry.get("title"),
            "link": entry.get("link"),
            "severity": severity,
        })
        
        print(f"  [{severity.upper()}] {entry.get('title', '')[:60]}")
    
    return {"classified": classified}

def route_severity(state: WorkflowState) -> Literal["notify", "end"]:
    classified = state.get("classified", [])
    needs_notification = any(e["severity"] in ["medium", "major"] for e in classified)
    return "notify" if needs_notification else "end"

def send_notifications(state: WorkflowState):
    classified = state["classified"]
    notifications = []

    WEBHOOK_URL = "https://troyrivera.app.n8n.cloud/webhook/0b700423-d9d4-4788-82c6-1d89ec91c7c0"
    
    for item in classified:
        if item["severity"] == "major":
            # Send notification via webhook
            payload = {
                "severity": item["severity"],
                "meeting_notes": item["title"],
            }
            response = requests.post(WEBHOOK_URL, json=payload)
            print(f"Webhook response status: {response.status_code}")
            print(f"Sending notification for {item['severity']} item: {item['title'][:60]}")
            notifications.append({"type": "urgent" if item["severity"] == "major" else "standard", "item": item})
            break
    
    print(f"{len(notifications)} notifications sent")
    return {"notifications": notifications}

# Build graph
workflow = StateGraph(WorkflowState)
workflow.add_node("fetch", fetch_entries)
workflow.add_node("classify", classify_entries)
workflow.add_node("notify", send_notifications)

workflow.add_edge("__start__", "fetch")
workflow.add_edge("fetch", "classify")
workflow.add_conditional_edges("classify", route_severity, {"notify": "notify", "end": END})
workflow.add_edge("notify", END)

app = workflow.compile()

if __name__ == "__main__":
    print("Starting workflow\n")

    sample_entries = [
        {
            "id": "entry-001",
            "title": "EU Artificial Intelligence Act - Final Implementation Guidelines",
            "link": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021PC0206",
            "committee": "European Parliament - Committee on Civil Liberties",
            "subjects": ["artificial intelligence", "regulation", "high-risk AI systems", "fundamental rights"],
            "embedding_input": "The European Union's comprehensive framework for regulating artificial intelligence systems, establishing requirements for high-risk AI applications and ensuring protection of fundamental rights",
            "scraped_at": datetime.now().isoformat()
        },
        {
            "id": "entry-002",
            "title": "GDPR Enforcement Report 2024 - Data Protection Authorities",
            "link": "https://edpb.europa.eu/news/news/2024",
            "committee": "European Data Protection Board",
            "subjects": ["data protection", "GDPR", "privacy", "enforcement"],
            "embedding_input": "Annual report on General Data Protection Regulation enforcement activities, including fines issued and compliance trends across EU member states",
            "scraped_at": datetime.now().isoformat()
        },

        {
            "id": "entry-003",
            "title": "Local Municipality Parking Fee Adjustment",
            "link": "https://example.com/parking",
            "committee": "City Council Transportation Committee",
            "subjects": ["parking", "municipal fees", "transportation"],
            "embedding_input": "Proposal to increase parking fees in downtown area to fund public transportation improvements",
            "scraped_at": datetime.now().isoformat()
        },
        {
            "id": "entry-004",
            "title": "Algorithmic Transparency in Public Services - Policy Framework",
            "link": "https://example.gov/algorithmic-transparency",
            "committee": "National Digital Affairs Committee",
            "subjects": ["algorithms", "transparency", "public services", "accountability"],
            "embedding_input": "Framework requiring government agencies to disclose how automated decision-making systems are used in public services",
            "scraped_at": datetime.now().isoformat()
        },
        {
            "id": "entry-005",
            "title": "Machine Learning in Healthcare: Regulatory Considerations",
            "link": "https://example.com/ml-healthcare",
            "committee": "Health Technology Assessment Board",
            "subjects": ["machine learning", "healthcare", "medical devices", "patient safety"],
            "embedding_input": "Guidelines for evaluating and approving machine learning models used in medical diagnosis and treatment decisions",
            "scraped_at": datetime.now().isoformat()
        }
    ]
    
    result = app.invoke({
        "entries": [],
        "classified": [],
        "notifications": []
    })
    
    print(f"\nComplete:")
    print(f"  Entries: {len(result.get('entries', []))}")
    print(f"  Classified: {len(result.get('classified', []))}")
    print(f"  Notifications: {len(result.get('notifications', []))}")
