/// Task data model — a unit of work: (part of) a mission assigned to a vehicle.
///
/// Maps to: GET /api/v1/vehicles/{vehicleId}/tasks
/// The backend populates cargo/weight/volume/times from the parent mission
/// until task-level metadata exists.
class Task {
  final int id;
  final String missionId;
  final String cargoType;
  final DateTime? startTime;
  final DateTime? endTime;
  final String origin;
  final String? originAddress;
  final Map<String, double>? originCoordinates;
  final String destination;
  final String? destinationAddress;
  final Map<String, double>? destinationCoordinates;
  final double weight;
  final double volume;
  final List<String> specialRequirements;
  final int? unloadingWaitMinutes;
  final bool isCurrent;

  const Task({
    required this.id,
    required this.missionId,
    required this.cargoType,
    this.startTime,
    this.endTime,
    required this.origin,
    this.originAddress,
    this.originCoordinates,
    required this.destination,
    this.destinationAddress,
    this.destinationCoordinates,
    required this.weight,
    required this.volume,
    required this.specialRequirements,
    this.unloadingWaitMinutes,
    required this.isCurrent,
  });

  /// Deserialize from backend JSON.
  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as int,
      missionId: json['mission_id'] as String,
      cargoType: json['cargo_type'] as String,
      startTime: json['start_time'] != null
          ? DateTime.parse(json['start_time'] as String)
          : null,
      endTime: json['end_time'] != null
          ? DateTime.parse(json['end_time'] as String)
          : null,
      origin: json['origin'] as String? ?? '',
      originAddress: json['origin_address'] as String?,
      originCoordinates: json['origin_coordinates'] != null
          ? Map<String, double>.from(
              (json['origin_coordinates'] as Map).map(
                  (k, v) => MapEntry(k as String, (v as num).toDouble())))
          : null,
      destination: json['destination'] as String? ?? '',
      destinationAddress: json['destination_address'] as String?,
      destinationCoordinates: json['destination_coordinates'] != null
          ? Map<String, double>.from(
              (json['destination_coordinates'] as Map).map(
                  (k, v) => MapEntry(k as String, (v as num).toDouble())))
          : null,
      weight: (json['weight'] as num?)?.toDouble() ?? 0,
      volume: (json['volume'] as num?)?.toDouble() ?? 0,
      specialRequirements:
          List<String>.from(json['special_requirements'] as List? ?? []),
      unloadingWaitMinutes: json['unloading_wait_minutes'] as int?,
      isCurrent: json['is_current'] as bool? ?? false,
    );
  }
}
