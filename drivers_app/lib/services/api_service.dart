import '../models/auth_result.dart';
import '../models/incident.dart';
import '../models/task.dart';
import '../models/vehicle.dart';
import '../models/warehouse.dart';

/// Abstract API service interface.
///
/// Endpoints (matching backend routers/driver.py):
///
/// ```
/// POST   /api/v1/auth/login                    → AuthResult
/// GET    /api/v1/vehicles/{vehicleId}           → Vehicle
/// GET    /api/v1/vehicles/{vehicleId}/tasks     → List<Task>
/// PATCH  /api/v1/tasks/{taskId}                 → Task  (mark delivered)
/// POST   /api/v1/tasks/{taskId}/incidents       → bool
/// ```
abstract class ApiService {
  /// POST /api/v1/auth/login
  Future<AuthResult> login(String vehicleId);

  /// GET /api/v1/vehicles/{vehicleId}
  Future<Vehicle> getVehicle(String vehicleId);

  /// GET /api/v1/warehouses/{name}
  Future<Warehouse> getWarehouse(String name);

  /// GET /api/v1/vehicles/{vehicleId}/tasks
  Future<List<Task>> getTasks(String vehicleId);

  /// PATCH /api/v1/tasks/{taskId}  — mark as delivered
  Future<Task> finishTask(int taskId);

  /// POST /api/v1/tasks/{taskId}/incidents
  Future<bool> reportIncident(Incident incident);
}
