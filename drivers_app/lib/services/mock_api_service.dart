import '../models/auth_result.dart';
import '../models/incident.dart';
import '../models/mission.dart';
import '../models/vehicle.dart';
import 'api_service.dart';

/// Mock implementation of [ApiService] for development and demos.
///
/// Replace this with [HttpApiService] (backed by `package:http` or `dio`)
/// when the real backend is available.
class MockApiService implements ApiService {
  // Simulate network latency.
  static const _networkDelay = Duration(milliseconds: 600);

  @override
  Future<AuthResult> login(String vehicleId, String password) async {
    await Future.delayed(_networkDelay);
    // Accept any credentials for the MVP.
    return AuthResult(
      token: 'mock-jwt-token-${DateTime.now().millisecondsSinceEpoch}',
      vehicleId: vehicleId.isNotEmpty ? vehicleId : 'TRK-001',
      success: true,
    );
  }

  @override
  Future<Vehicle> getVehicle(String vehicleId) async {
    await Future.delayed(_networkDelay);
    return Vehicle(
      vehicleID: vehicleId,
      type: 'Heavy Truck (Cooler)',
      weight: 8000,
      payload: 50000,
      volume: 7000,
      operationalRange: 10000,
      features: ['Temperature control', 'GPS Tracking'],
      restrictions: ['Can\'t park in public places', 'Can\'t enter Chechia'],
    );
  }

  @override
  Future<List<Mission>> getMissions(String vehicleId) async {
    await Future.delayed(_networkDelay);
    final now = DateTime.now();
    return [
      Mission(
        id: 'M-001',
        cargoType: 'Food',
        startTime: now.add(const Duration(hours: 1)),
        endTime: now.add(const Duration(hours: 7)),
        origin: 'Warszawa',
        destination: 'Kijów',
        weight: 20000,
        volume: 4000,
        specialRequirements: ['Temperature has to be kept at 2-8 °C'],
        unloadingWaitTime: const Duration(minutes: 45),
        isCurrent: true,
      ),
      Mission(
        id: 'M-002',
        cargoType: 'Medicine',
        startTime: DateTime(now.year, now.month, now.day + 1, 7, 0),
        endTime: DateTime(now.year, now.month, now.day + 1, 13, 0),
        origin: 'Łódź',
        destination: 'Lwów',
        weight: 2500,
        volume: 800,
        specialRequirements: ['Dry storage only'],
        unloadingWaitTime: const Duration(hours: 1),
        isCurrent: false,
      ),
      Mission(
        id: 'M-003',
        cargoType: 'Medicine',
        startTime: DateTime(now.year, now.month, now.day + 2, 7, 0),
        endTime: DateTime(now.year, now.month, now.day + 2, 13, 0),
        origin: 'Łódź',
        destination: 'Lwów',
        weight: 3200,
        volume: 1200,
        specialRequirements: [],
        unloadingWaitTime: const Duration(hours: 1, minutes: 30),
        isCurrent: false,
      ),
    ];
  }

  @override
  Future<bool> reportIncident(Incident incident) async {
    await Future.delayed(_networkDelay);
    // ignore: avoid_print
    print('┌──────────────────────────────────────────');
    // ignore: avoid_print
    print('│ 📡  INCIDENT SENT TO BACKEND (mock)');
    // ignore: avoid_print
    print('│ Type:        ${incident.type.label}');
    if (incident.delayDuration != null) {
      // ignore: avoid_print
      print('│ Delay:       ${incident.delayDuration!.inMinutes} min');
    }
    // ignore: avoid_print
    print('│ Description: ${incident.description ?? '—'}');
    // ignore: avoid_print
    print('│ Mission:     ${incident.missionId}');
    // ignore: avoid_print
    print('│ Reported at: ${incident.reportedAt.toIso8601String()}');
    // ignore: avoid_print
    print('└──────────────────────────────────────────');
    return true;
  }
}
