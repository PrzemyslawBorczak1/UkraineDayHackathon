import os
import json
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Mission Recommendation System - Crisis Command Center")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates straight-line distance (in km) using the Haversine formula."""
    R = 6371.0
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# ==========================================
# INPUT DATA MODELS (Mapped to data_dictionary.csv)
# ==========================================

class Warehouse(BaseModel):
    id: str = Field(alias="Warehouse ID")
    name: str = Field(alias="Warehouse Name")
    city: str = Field(alias="City")
    latitude: float = Field(alias="Latitude")
    longitude: float = Field(alias="Longitude")
    warehouse_type: str = Field(alias="Warehouse Type") # e.g., Emergency hub, Cold storage
    cold_storage: str = Field(alias="Cold Storage") # Yes/No
    availability_status: str = Field(alias="Availability Status")
    available_capacity_pct: int = Field(alias="Available Capacity (%)")

class MapObject(BaseModel):
    id: str = Field(alias="Map Object ID")
    name: str = Field(alias="Name")
    city: str = Field(alias="City")
    latitude: float = Field(alias="Latitude")
    longitude: float = Field(alias="Longitude")
    object_type: str = Field(alias="Object Type") # e.g., Crisis hub, Collection point
    severity: str = Field(alias="Severity") # Operational / Medium / Critical
    status: str = Field(alias="Status") # Active / Monitoring / Escalating
    operational_note: str = Field(alias="Operational Note", description="Context for planners")

class CrisisPayload(BaseModel):
    warehouses: List[Warehouse]
    map_objects: List[MapObject]

# ==========================================
# OUTPUT DATA MODELS (LLM Output)
# ==========================================

class RecommendedMission(BaseModel):
    origin_id: str
    destination_id: str
    proposed_cargo_type: str = Field(description="Cargo type deduced by LLM")
    required_vehicle_type: str = Field(description="Van, Rigid truck, Standard semi, Refrigerated semi, BDF swap body")
    priority: str = Field(description="Critical, High, Medium, Low")
    estimated_distance_km: float
    justification: str

class RecommendationResponse(BaseModel):
    missions: List[RecommendedMission]

# ==========================================
# LLM LOGIC & ENDPOINTS
# ==========================================

def generate_llm_recommendations(payload: CrisisPayload) -> RecommendationResponse:
    
    llm_data = {
        "warehouses": [w.dict(by_alias=True) for w in payload.warehouses],
        "map_objects": [m.dict(by_alias=True) for m in payload.map_objects],
        "available_routes": []
    }

    # Calculate distance matrix
    for warehouse in payload.warehouses:
        for map_obj in payload.map_objects:
            distance = calculate_distance(
                warehouse.latitude, warehouse.longitude,
                map_obj.latitude, map_obj.longitude
            )
            llm_data["available_routes"].append({
                "warehouse_id": warehouse.id,
                "map_object_id": map_obj.id,
                "distance_km": distance
            })

    system_prompt = """
    You are the Chief Logistics Planner in a crisis command center. You create mission recommendations (Missions).
    You do not have strict lists of specific goods. You must use deduction based on facility types and notes.
    
    RULES:
    1. Analyze 'Object Type' and 'Operational Note' from the delivery points (Crisis Map) to UNDERSTAND what they might need.
    2. Match this demand to the appropriate 'Warehouse Type' and 'Cold Storage' parameter. E.g., if a point needs vaccines, assign it a warehouse with 'Cold Storage: Yes'.
    3. Ignore warehouses where 'Availability Status' is "Reserved for mission" or "Unavailable". Only consider available ones with free capacity.
    4. Minimize 'distance_km'. Choose the closest reasonable warehouse for a given point.
    5. Based on deduction, propose a logical 'proposed_cargo_type' (e.g., "Medical supplies", "Rescue equipment", "Food", "Fuel").
    6. Propose an adequate 'required_vehicle_type' from the list: Van, Rigid truck, Standard semi, Refrigerated semi, BDF swap body. If it's cold cargo, use Refrigerated semi.
    7. Set the priority (Critical/High/Medium/Low) based on the 'Severity' and 'Status' fields of the crisis point.
    
    Return the response EXCLUSIVELY in this JSON format:
    {
      "missions": [
        {
          "origin_id": "Warehouse ID",
          "destination_id": "Map Object ID",
          "proposed_cargo_type": "e.g., Medical supplies and blankets",
          "required_vehicle_type": "e.g., Refrigerated semi",
          "priority": "Critical",
          "estimated_distance_km": 15.5,
          "justification": "The point requires immediate medical assistance (Status: Escalating). The closest available Cold storage warehouse was selected (15.5 km)."
        }
      ]
    }
    Never return an empty list; create the best possible recommendations based on facility types.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate missions based on this data: {json.dumps(llm_data, ensure_ascii=False)}"}
            ],
            temperature=0.3
        )
        
        json_result = json.loads(response.choices[0].message.content)
        return RecommendationResponse(**json_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

@app.post("/recommend-missions", response_model=RecommendationResponse)
async def recommend_missions_endpoint(payload: CrisisPayload):
    """
    Accepts the current state of warehouses and crisis map objects,
    returns emergency missions generated by the LLM.
    """
    if not payload.warehouses or not payload.map_objects:
        raise HTTPException(status_code=400, detail="Missing input data (warehouses or map objects).")
    
    return generate_llm_recommendations(payload)