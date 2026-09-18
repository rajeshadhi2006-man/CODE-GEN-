from typing import Dict, Any, List, Optional
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY
from .models import Employee, Task, Project, AIRecommendation

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    global _supabase_client
    if _supabase_client is None:
        try:
            if SUPABASE_URL and SUPABASE_KEY:
                _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"[Supabase Python] Client init warning: {e}")
            return None
    return _supabase_client

def test_supabase_connection() -> Dict[str, Any]:
    client = get_supabase_client()
    if not client:
        return {"success": False, "error": "Supabase client not initialized (missing credentials)"}
    try:
        res = client.table('employees').select('id').limit(1).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        return {"success": False, "error": str(e)}

def fetch_live_data_from_supabase() -> Dict[str, Any]:
    client = get_supabase_client()
    if not client:
        return {"employees": [], "tasks": [], "projects": [], "error": "No Supabase client"}

    try:
        emp_res = client.table('employees').select('*').execute()
        task_res = client.table('tasks').select('*').execute()
        proj_res = client.table('projects').select('*').execute()

        employees = [Employee.model_validate(e) for e in (emp_res.data or [])]
        tasks = [Task.model_validate(t) for t in (task_res.data or [])]
        projects = [Project.model_validate(p) for p in (proj_res.data or [])]

        return {
            "employees": employees,
            "tasks": tasks,
            "projects": projects
        }
    except Exception as e:
        print(f"[Supabase Python] Fetch error: {e}")
        return {"employees": [], "tasks": [], "projects": [], "error": str(e)}

def save_recommendations_to_supabase(recommendations: List[AIRecommendation]) -> bool:
    client = get_supabase_client()
    if not client or not recommendations:
        return False

    try:
        payload = [r.model_dump() for r in recommendations]
        client.table('recommendations').upsert(payload).execute()
        return True
    except Exception as e:
        print(f"[Supabase Python] Save recommendations error: {e}")
        return False
