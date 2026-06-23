class Warehouse {
  final String name;
  final Map<String, double> coordinates;
  final int availableCapacityPercent;
  final String availabilityHours;
  final int dockDoors;

  const Warehouse({
    required this.name,
    required this.coordinates,
    required this.availableCapacityPercent,
    required this.availabilityHours,
    required this.dockDoors,
  });

  factory Warehouse.fromJson(Map<String, dynamic> json) {
    return Warehouse(
      name: json['name'] as String,
      coordinates: Map<String, double>.from(
        (json['coordinates'] as Map).map(
          (k, v) => MapEntry(k as String, (v as num).toDouble()),
        ),
      ),
      availableCapacityPercent: json['available_capacity_percent'] as int,
      availabilityHours: json['availability_hours'] as String,
      dockDoors: json['dock_doors'] as int,
    );
  }
}
