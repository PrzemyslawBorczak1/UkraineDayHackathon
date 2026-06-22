/// Mission data model representing a delivery task assigned to a driver.
///
/// Maps to the backend endpoint: GET /api/v1/vehicles/{vehicleId}/missions
class Mission {
  final String id;
  final String cargoType;
  final DateTime startTime;
  final DateTime endTime;
  final String origin;
  final String destination;
  final double weight;
  final double volume;
  final List<String> specialRequirements;
  final Duration unloadingWaitTime;
  final bool isCurrent;

  const Mission({
    required this.id,
    required this.cargoType,
    required this.startTime,
    required this.endTime,
    required this.origin,
    required this.destination,
    required this.weight,
    required this.volume,
    required this.specialRequirements,
    required this.unloadingWaitTime,
    required this.isCurrent,
  });

  /// Deserialize from JSON (backend response).
  factory Mission.fromJson(Map<String, dynamic> json) {
    return Mission(
      id: json['id'] as String,
      cargoType: json['cargo_type'] as String,
      startTime: DateTime.parse(json['start_time'] as String),
      endTime: DateTime.parse(json['end_time'] as String),
      origin: json['origin'] as String,
      destination: json['destination'] as String,
      weight: (json['weight'] as num).toDouble(),
      volume: (json['volume'] as num).toDouble(),
      specialRequirements:
          List<String>.from(json['special_requirements'] as List),
      unloadingWaitTime:
          Duration(minutes: json['unloading_wait_minutes'] as int),
      isCurrent: json['is_current'] as bool,
    );
  }

  /// Serialize to JSON.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'cargo_type': cargoType,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime.toIso8601String(),
      'origin': origin,
      'destination': destination,
      'weight': weight,
      'volume': volume,
      'special_requirements': specialRequirements,
      'unloading_wait_minutes': unloadingWaitTime.inMinutes,
      'is_current': isCurrent,
    };
  }
}
