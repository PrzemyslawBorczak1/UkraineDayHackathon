import '../models/auth_result.dart';
import '../models/incident.dart';
import '../models/mission.dart';
import '../models/vehicle.dart';

/// Abstract API service interface.
///
/// Swap [MockApiService] for a real [HttpApiService] implementation
/// when the backend is ready. All endpoints follow the REST scheme:
///
/// ```
/// POST   /api/v1/auth/login                         → AuthResult
/// GET    /api/v1/vehicles/{vehicleId}                → Vehicle
/// GET    /api/v1/vehicles/{vehicleId}/missions       → List<Mission>
/// POST   /api/v1/missions/{missionId}/incidents      → Incident
/// ```
abstract class ApiService {
  /// POST /api/v1/auth/login
  /// Body: { "vehicle_id": "...", "password": "..." }
  Future<AuthResult> login(String vehicleId, String password);

  /// GET /api/v1/vehicles/{vehicleId}
  Future<Vehicle> getVehicle(String vehicleId);

  /// GET /api/v1/vehicles/{vehicleId}/missions
  Future<List<Mission>> getMissions(String vehicleId);

  /// POST /api/v1/missions/{missionId}/incidents
  Future<bool> reportIncident(Incident incident);
}
