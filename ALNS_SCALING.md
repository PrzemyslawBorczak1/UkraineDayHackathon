# One-Pager: Scaling & Deploying ALNS for Crisis Fleet Management

## Overview

Our platform coordinates a truck fleet during crises, where demand points, road conditions, priorities, budgets, and vehicle availability change rapidly. At its core runs an **Adaptive Large Neighborhood Search (ALNS)** engine (`DailyALNSScheduler`) that assigns missions (cargo origin → destination, with deadlines, weight/volume, and temperature/ADR/liftgate constraints) to vehicles and carriers, day by day, under a daily/weekly/monthly budget. A GPT-4o recommendation service proposes new missions from warehouse stock and crisis-map demand. This document outlines how to scale and harden that engine for production.

## How ALNS Works in Our System

1. **Input** — missions, vehicles (capacity/type/features), carriers (cost-per-km, reliability, verification), warehouses (hours, cold storage, activation time), and crisis-map demand.
2. **Initial solution** — `create_initial_solution` greedily assigns missions per day, urgent and capacity-fitting first, respecting warehouse hours and budget.
3. **ALNS loop** — `run_alns` repeatedly calls `destroy_worst_assignments` (removes the lowest-scoring assignments via the weighted `calculate_score`) then `repair_greedy`, keeping improvements.
4. **Output** — vehicle schedules, routes, ETAs, costs, and priority decisions returned to the platform.
5. **Re-optimization** — `handle_vehicle_breakdown` spins up temporary warehouses at the disruption point and re-runs ALNS so blocked roads, breakdowns, or new urgent demand are absorbed live.

## Scalability

### Vertical Scaling
Give a single scheduler instance more headroom for large, complex scenarios:
- more CPU/RAM and a higher optimization time budget,
- more `run_alns` iterations and larger destroy ratios,
- richer destroy/repair operators and tuned `calculate_score` weights for the instance size.

Best when one crisis spans hundreds–thousands of missions across the whole fleet.

### Horizontal Scaling
Run many schedulers in parallel:
- partition by **region / depot / operational zone** and optimize independently,
- run **multiple ALNS configurations** at once and keep the best result,
- process **several crisis scenarios** concurrently,
- separate **real-time re-optimization** (breakdowns, new demand) from **strategic planning**.

Reference architecture: **API Gateway** → **job queue** → **ALNS worker pool** → **results service** (stores/returns best plans) → **monitoring** (runtime, solution quality, failures).

## Data Collection & AI Improvement

ALNS and the LLM both improve with more operational data. Logging real outcomes lets us learn which routes are usually delayed, which zones become inaccessible per crisis type, how carriers/vehicles actually perform, and which operators work best per scenario. This feeds better **demand prediction, travel-time estimation, risk and priority scoring, route feasibility,** and **automatic ALNS parameter tuning** — closing the loop: ALNS decides, the system observes outcomes, models improve future runs.

## Deployment Roadmap

1. **Prototype** — run the existing engine on historical scenarios as a standalone module.
2. **Integration** — expose ALNS as a service behind the platform API (alongside the recommendations service).
3. **Pilot** — run in shadow mode next to current planning; compare solution quality, response time, and outcomes.
4. **Production** — make ALNS the primary engine for crisis routing and assignment.
5. **Continuous improvement** — collect data, monitor, tune operators, retrain models.

## Key Benefits

Faster re-optimization, higher truck utilization, resilient response to disruptions, scalable handling of large fleets and simultaneous crises, lower cost, and better prioritization of urgent deliveries — combining into more reliable decisions during emergencies.
