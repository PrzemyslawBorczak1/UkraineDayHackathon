/// Incident types that a driver can report.
enum IncidentType {
  endMission('Koniec misji'),
  delay('Opóźnienie');

  final String label;
  const IncidentType(this.label);
}

/// Incident data model for reporting issues during a task.
///
/// Maps to: POST /api/v1/tasks/{taskId}/incidents
class Incident {
  final int taskId;
  final IncidentType type;
  final int? delayMinutes;
  final String? description;
  final DateTime reportedAt;

  const Incident({
    required this.taskId,
    required this.type,
    this.delayMinutes,
    this.description,
    required this.reportedAt,
  });

  /// Serialize to JSON (POST body) — taskId is in the URL, not the body.
  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      if (delayMinutes != null) 'delay_minutes': delayMinutes,
      if (description != null && description!.isNotEmpty)
        'description': description,
      'reported_at': reportedAt.toUtc().toIso8601String().replaceAll('+00:00', 'Z'),
    };
  }
}
