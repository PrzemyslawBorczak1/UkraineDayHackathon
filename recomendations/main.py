import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv

# Ładowanie zmiennych środowiskowych (np. OPENAI_API_KEY)
load_dotenv()

app = FastAPI(title="System Rekomendacji Misji - Sztab Kryzysowy")

# Inicjalizacja klienta OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ==========================================
# MODELE DANYCH (Wejście z REST API)
# ==========================================

class Magazyn(BaseModel):
    id: str
    nazwa: str
    miasto: str
    dostepny_ladunek: List[str] = Field(description="Lista dostępnych typów ładunków, np. ['Woda', 'Koce']")

class PunktOdbioru(BaseModel):
    id: str
    nazwa: str
    miasto: str
    severity: str = Field(description="Operational / Medium / Critical - z Crisis_Map")
    zapotrzebowanie: List[str] = Field(description="Czego potrzebują, np. ['Woda', 'Żywność']")

class ZapotrzebowaniePayload(BaseModel):
    magazyny: List[Magazyn]
    punkty_odbioru: List[PunktOdbioru]

# ==========================================
# MODELE DANYCH (Wyjście z LLM)
# ==========================================

class RekomendowanaMisja(BaseModel):
    origin_id: str
    destination_id: str
    ladunek: str
    priorytet: str = Field(description="Critical, Medium, lub Operational")
    uzasadnienie: str = Field(description="Krótkie wyjaśnienie dlaczego taki priorytet i trasa")

class OdpowiedzRekomendacji(BaseModel):
    misje: List[RekomendowanaMisja]

# ==========================================
# LOGIKA LLM I ENDPOINTY
# ==========================================

def generuj_rekomendacje_llm(payload: ZapotrzebowaniePayload) -> OdpowiedzRekomendacji:
    # Przygotowanie kontekstu dla LLM
    dane_wejsciowe = {
        "magazyny": [m.dict() for m in payload.magazyny],
        "punkty_odbioru": [p.dict() for p in payload.punkty_odbioru]
    }
    
    prompt_systemowy = """
    Jesteś Głównym Planistą Logistyki w sztabie kryzysowym. Otrzymujesz dane w formacie JSON zawierające listę magazynów (ich zapasy) oraz punktów odbioru (ich zapotrzebowanie).
    
    TWOJE ZADANIE:
    Musisz dopasować 'dostepny_ladunek' z magazynów do 'zapotrzebowania' w punktach odbioru. 
    
    ZASADY:
    1. Przejrzyj każdy punkt odbioru i jego 'zapotrzebowanie'.
    2. Znajdź magazyn, który ma ten sam towar w 'dostepny_ladunek'.
    3. Jeśli znajdziesz dopasowanie (np. magazyn ma 'Woda', a punkt potrzebuje 'Woda'), MUSISZ wygenerować misję w liście 'misje'.
    4. Priorytet misji (Critical, Medium, Operational) musi bezpośrednio wynikać z pola 'severity' punktu odbioru.
    5. Jeśli zapotrzebowanie obejmuje kilka różnych towarów (np. Leki i Woda), możesz utworzyć jedną misję z ładunkiem 'Leki, Woda' lub dwie osobne misje.
    
    FORMAT WYJŚCIOWY:
    Musisz zwrócić odpowiedź WYŁĄCZNIE w poniższym formacie JSON:
    {
      "misje": [
        {
          "origin_id": "ID magazynu",
          "destination_id": "ID punktu odbioru",
          "ladunek": "nazwa dopasowanego towaru",
          "priorytet": "Critical/Medium/Operational",
          "uzasadnienie": "Dlaczego wybrano ten magazyn, ładunek i priorytet."
        }
      ]
    }
    NIGDY nie zwracaj pustej listy 'misje', jeśli w danych istnieje choć jedno dopasowanie towarów!
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o", # lub gpt-4-turbo
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": prompt_systemowy},
                {"role": "user", "content": f"Dopasuj misje na podstawie tych danych i zwróć format {{'misje': [...] }}: {json.dumps(dane_wejsciowe, ensure_ascii=False)}"}
            ],
            temperature=0.2 # Niska temperatura dla bardziej logicznych i deterministycznych wyników
        )
        
        # Parsowanie odpowiedzi z LLM do naszego modelu Pydantic
        wynik_json = json.loads(response.choices[0].message.content)
        return OdpowiedzRekomendacji(**wynik_json)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd podczas komunikacji z LLM: {str(e)}")

@app.post("/rekomenduj-misje", response_model=OdpowiedzRekomendacji)
async def endpoint_rekomenduj_misje(payload: ZapotrzebowaniePayload):
    """
    Endpoint przyjmujący aktualny stan magazynów i punktów kryzysowych, 
    zwracający wygenerowane przez LLM misje ratunkowe.
    """
    if not payload.magazyny or not payload.punkty_odbioru:
        raise HTTPException(status_code=400, detail="Brakuje magazynów lub punktów odbioru.")
        
    rekomendacje = generuj_rekomendacje_llm(payload)
    return rekomendacje