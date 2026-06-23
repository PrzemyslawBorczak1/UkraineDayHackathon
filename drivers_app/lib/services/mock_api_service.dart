import '../models/auth_result.dart';
import '../models/incident.dart';
import '../models/task.dart';
import '../models/vehicle.dart';
import 'api_service.dart';

/// Mock implementation of [ApiService] for offline development.
///
/// Replace with [HttpApiService] when the backend is running.
class MockApiService implements ApiService {
  static const _delay = Duration(milliseconds: 600);

  @override
  Future<AuthResult> login(String vehicleId) async {
    await Future.delayed(_delay);
    return AuthResult(
      vehicleId: vehicleId.isNotEmpty ? vehicleId : 'V0001',
      success: true,
    );
  }

  @override
  Future<Vehicle> getVehicle(String vehicleId) async {
    await Future.delayed(_delay);
    return Vehicle(
      vehicleID: vehicleId,
      type: 'Refrigerated semi',
      weight: 40,
      payload: 24,
      volume: 90,
      operationalRange: 1200,
      features: ['Temperature control', 'Liftgate'],
      restrictions: ['No city centre'],
    );
  }

  List<Task>? _tasks;

  @override
  Future<List<Task>> getTasks(String vehicleId) async {
    await Future.delayed(_delay);
    if (_tasks == null) {
      final now = DateTime.now();
      _tasks = [
        Task(
          id: 1,
          missionId: 'M0001',
          cargoType: 'Food',
          startTime: now.add(const Duration(hours: 1)),
          endTime: now.add(const Duration(hours: 7)),
          origin: 'Warsaw',
          destination: 'Opole',
          weight: 20,
          volume: 40,
          specialRequirements: ['Temperature 2-8°C required'],
          unloadingWaitMinutes: 45,
          isCurrent: true,
        ),
        Task(
          id: 2,
          missionId: 'M0002',
          cargoType: 'Medicine',
          startTime: DateTime(now.year, now.month, now.day + 1, 7, 0),
          endTime: DateTime(now.year, now.month, now.day + 1, 13, 0),
          origin: 'Lodz',
          destination: 'Nysa',
          weight: 2.5,
          volume: 8,
          specialRequirements: [],
          unloadingWaitMinutes: null,
          isCurrent: false,
        ),
        Task(
          id: 3,
          missionId: 'M0003',
          cargoType: 'Blankets',
          startTime: DateTime(now.year, now.month, now.day + 2, 7, 0),
          endTime: DateTime(now.year, now.month, now.day + 2, 13, 0),
          origin: 'Lodz',
          destination: 'Lviv',
          weight: 5,
          volume: 12,
          specialRequirements: [],
          unloadingWaitMinutes: null,
          isCurrent: false,
        ),
      ];
    }
    return List.from(_tasks!);
  }

  @override
  Future<Task> finishTask(int taskId) async {
    await Future.delayed(_delay);
    if (_tasks != null) {
      final index = _tasks!.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        final finishedTask = _tasks!.removeAt(index);
        
        if (_tasks!.isNotEmpty) {
          final nextTask = _tasks!.first;
          _tasks![0] = Task(
            id: nextTask.id,
            missionId: nextTask.missionId,
            cargoType: nextTask.cargoType,
            startTime: nextTask.startTime,
            endTime: nextTask.endTime,
            origin: nextTask.origin,
            originAddress: nextTask.originAddress,
            originCoordinates: nextTask.originCoordinates,
            destination: nextTask.destination,
            destinationAddress: nextTask.destinationAddress,
            destinationCoordinates: nextTask.destinationCoordinates,
            weight: nextTask.weight,
            volume: nextTask.volume,
            specialRequirements: nextTask.specialRequirements,
            unloadingWaitMinutes: nextTask.unloadingWaitMinutes,
            isCurrent: true,
          );
        }
        
        return finishedTask;
      }
    }
    
    // Fallback if not found
    return Task(
      id: taskId,
      missionId: 'M0001',
      cargoType: 'Food',
      startTime: DateTime.now(),
      endTime: DateTime.now(),
      origin: 'Warsaw',
      destination: 'Opole',
      weight: 20,
      volume: 40,
      specialRequirements: [],
      unloadingWaitMinutes: null,
      isCurrent: false,
    );
  }

  @override
  Future<bool> reportIncident(Incident incident) async {
    await Future.delayed(_delay);
    // ignore: avoid_print
    print('┌──────────────────────────────────────────');
    // ignore: avoid_print
    print('│ 📡  INCIDENT REPORTED (mock)');
    // ignore: avoid_print
    print('│ Task:        ${incident.taskId}');
    // ignore: avoid_print
    print('│ Type:        ${incident.type.label}');
    if (incident.delayMinutes != null) {
      // ignore: avoid_print
      print('│ Delay:       ${incident.delayMinutes} min');
    }
    // ignore: avoid_print
    print('│ Description: ${incident.description ?? '—'}');
    // ignore: avoid_print
    print('└──────────────────────────────────────────');
    return true;
  }
}
