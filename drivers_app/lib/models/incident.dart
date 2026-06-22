/// Incident types that a driver can report.
enum IncidentType {
  endMission('Koniec misji'),
  delay('Opóźnienie');

  final String label;
  const IncidentType(this.label);

  /// Deserialize from backend string.
  static IncidentType fromString(String value) {
    return IncidentType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => IncidentType.endMission,
    );
  }
}

/// Incident data model for reporting issues during a mission.
///
/// Maps to the backend endpoint: POST /api/v1/missions/{missionId}/incidents
class Incident {
  final String? id;
  final String missionId;
  final IncidentType type;
  final Duration? delayDuration;
  final String? description;
  final DateTime reportedAt;

  const Incident({
    this.id,
    required this.missionId,
    required this.type,
    this.delayDuration,
    this.description,
    required this.reportedAt,
  });

  /// Deserialize from JSON (backend response).
  factory Incident.fromJson(Map<String, dynamic> json) {
    return Incident(
      id: json['id'] as String?,
      missionId: json['mission_id'] as String,
      type: IncidentType.fromString(json['type'] as String),
      delayDuration: json['delay_minutes'] != null
          ? Duration(minutes: json['delay_minutes'] as int)
          : null,
      description: json['description'] as String?,
      reportedAt: DateTime.parse(json['reported_at'] as String),
    );
  }

  /// Serialize to JSON (POST body).
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'mission_id': missionId,
      'type': type.name,
      if (delayDuration != null) 'delay_minutes': delayDuration!.inMinutes,
      if (description != null && description!.isNotEmpty)
        'description': description,
      'reported_at': reportedAt.toIso8601String(),
    };
  }
}
