import os
import json
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="System Rekomendacji Misji - Sztab Kryzysowy")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ==========================================
# FUNKCJE POMOCNICZE
# ==========================================

def oblicz_dystans(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# ==========================================
# MODELE DANYCH (Zgodne w 100% z data_dictionary.csv)
# ==========================================

class Magazyn(BaseModel):
    id: str = Field(alias="Warehouse ID")
    nazwa: str = Field(alias="Warehouse Name")
    miasto: str = Field(alias="City")
    latitude: float = Field(alias="Latitude")
    longitude: float = Field(alias="Longitude")
    warehouse_type: str = Field(alias="Warehouse Type") # np. Emergency hub, Cold storage
    cold_storage: str = Field(alias="Cold Storage") # Yes/No
    availability_status: str = Field(alias="Availability Status")
    available_capacity_pct: int = Field(alias="Available Capacity (%)")

class PunktOdbioru(BaseModel):
    id: str = Field(alias="Map Object ID")
    nazwa: str = Field(alias="Name")
    miasto: str = Field(alias="City")
    latitude: float = Field(alias="Latitude")
    longitude: float = Field(alias="Longitude")
    object_type: str = Field(alias="Object Type") # np. Crisis hub, Collection point
    severity: str = Field(alias="Severity") # Operational / Medium / Critical
    status: str = Field(alias="Status") # Active / Monitoring / Escalating
    operational_note: str = Field(alias="Operational Note", description="Kontekst dla planistów")

class ZapotrzebowaniePayload(BaseModel):
    magazyny: List[Magazyn]
    punkty_odbioru: List[PunktOdbioru]

# ==========================================
# MODELE DANYCH (Wyjście z LLM)
# ==========================================

class RekomendowanaMisja(BaseModel):
    origin_id: str
    destination_id: str
    proponowany_typ_ladunku: str = Field(description="Wywnioskowany przez LLM typ ładunku")
    wymagany_typ_pojazdu: str = Field(description="Van, Rigid truck, Standard semi, Refrigerated semi, BDF swap body")
    priorytet: str = Field(description="Critical, High, Medium, Low")
    szacowany_dystans_km: float
    uzasadnienie: str

class OdpowiedzRekomendacji(BaseModel):
    misje: List[RekomendowanaMisja]

# ==========================================
# LOGIKA LLM I ENDPOINTY
# ==========================================

def generuj_rekomendacje_llm(payload: ZapotrzebowaniePayload) -> OdpowiedzRekomendacji:
    
    dane_dla_llm = {
        "magazyny": [m.dict(by_alias=True) for m in payload.magazyny],
        "punkty_odbioru": [p.dict(by_alias=True) for p in payload.punkty_odbioru],
        "dostepne_trasy": []
    }

    for magazyn in payload.magazyny:
        for punkt in payload.punkty_odbioru:
            dystans = oblicz_dystans(
                magazyn.latitude, magazyn.longitude,
                punkt.latitude, punkt.longitude
            )
            dane_dla_llm["dostepne_trasy"].append({
                "magazyn_id": magazyn.id,
                "punkt_id": punkt.id,
                "odleglosc_km": dystans
            })

    prompt_systemowy = """
    Jesteś Głównym Planistą Logistyki w sztabie kryzysowym. Tworzysz rekomendacje misji (Missions).
    Nie posiadasz list konkretnych towarów. Musisz wykazać się dedukcją.
    
    ZASADY:
    1. Przeanalizuj 'Object Type' oraz 'Operational Note' z punktów odbioru (Crisis Map), aby ZROZUMIEĆ, czego mogą potrzebować.
    2. Dopasuj to zapotrzebowanie do odpowiedniego 'Warehouse Type' i parametru 'Cold Storage'. Np. jeśli punkt potrzebuje szczepionek, przypisz mu magazyn z 'Cold Storage: Yes'.
    3. Ignoruj magazyny, których 'Availability Status' to "Reserved for mission" lub "Unavailable". Bierz pod uwagę tylko te dostępne i posiadające wolną pojemność.
    4. Minimalizuj 'odleglosc_km'. Wybieraj najbliższy sensowny magazyn dla danego punktu.
    5. Na podstawie dedukcji zaproponuj logiczny 'proponowany_typ_ladunku' (np. "Środki medyczne", "Sprzęt ratunkowy", "Żywność", "Paliwo").
    6. Zaproponuj adekwatny 'wymagany_typ_pojazdu' z listy: Van, Rigid truck, Standard semi, Refrigerated semi, BDF swap body. Jeśli to ładunek chłodniczy, użyj Refrigerated semi.
    7. Ustal priorytet (Critical/High/Medium/Low) na podstawie pola 'Severity' i 'Status' punktu kryzysowego.
    
    Zwróć odpowiedź WYŁĄCZNIE w tym formacie JSON:
    {
      "misje": [
        {
          "origin_id": "Warehouse ID",
          "destination_id": "Map Object ID",
          "proponowany_typ_ladunku": "np. Środki medyczne i koce",
          "wymagany_typ_pojazdu": "np. Refrigerated semi",
          "priorytet": "Critical",
          "szacowany_dystans_km": 15.5,
          "uzasadnienie": "Punkt wymaga natychmiastowej pomocy medycznej (Status: Escalating). Wybrano najbliższy magazyn typu Cold storage z dostępnością (15.5 km)."
        }
      ]
    }
    Nigdy nie zwracaj pustej listy, stwórz najlepsze możliwe rekomendacje opierając się na typach placówek.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": prompt_systemowy},
                {"role": "user", "content": f"Wygeneruj misje na podstawie tych danych: {json.dumps(dane_dla_llm, ensure_ascii=False)}"}
            ],
            temperature=0.3
        )
        
        wynik_json = json.loads(response.choices[0].message.content)
        return OdpowiedzRekomendacji(**wynik_json)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd LLM: {str(e)}")

@app.post("/rekomenduj-misje", response_model=OdpowiedzRekomendacji)
async def endpoint_rekomenduj_misje(payload: ZapotrzebowaniePayload):
    if not payload.magazyny or not payload.punkty_odbioru:
        raise HTTPException(status_code=400, detail="Brak danych wejściowych.")
    return generuj_rekomendacje_llm(payload)