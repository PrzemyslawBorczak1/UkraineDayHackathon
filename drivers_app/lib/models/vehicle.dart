/// Vehicle data model representing a driver's assigned vehicle.
///
/// Maps to the backend endpoint: GET /api/v1/vehicles/{vehicleId}
class Vehicle {
  final String vehicleID;
  final String type;
  final double weight;
  final double payload;
  final double volume;
  final double operationalRange;
  final List<String> features;
  final List<String> restrictions;

  const Vehicle({
    required this.vehicleID,
    required this.type,
    required this.weight,
    required this.payload,
    required this.volume,
    required this.operationalRange,
    required this.features,
    required this.restrictions,
  });

  /// Deserialize from JSON (backend response).
  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      vehicleID: json['vehicle_id'] as String,
      type: json['type'] as String,
      weight: (json['weight'] as num).toDouble(),
      payload: (json['payload'] as num).toDouble(),
      volume: (json['volume'] as num).toDouble(),
      operationalRange: (json['operational_range'] as num).toDouble(),
      features: List<String>.from(json['features'] as List),
      restrictions: List<String>.from(json['restrictions'] as List),
    );
  }

  /// Serialize to JSON (for potential PUT/PATCH requests).
  Map<String, dynamic> toJson() {
    return {
      'vehicle_id': vehicleID,
      'type': type,
      'weight': weight,
      'payload': payload,
      'volume': volume,
      'operational_range': operationalRange,
      'features': features,
      'restrictions': restrictions,
    };
  }
}
