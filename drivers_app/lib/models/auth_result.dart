/// Authentication result returned by the login endpoint.
///
/// POST /api/v1/auth/login
/// MVP: no password, no JWT token — just vehicle_id existence check.
class AuthResult {
  final String vehicleId;
  final bool success;
  final String? errorMessage;

  const AuthResult({
    required this.vehicleId,
    required this.success,
    this.errorMessage,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      vehicleId: json['vehicle_id'] as String? ?? '',
      success: json['success'] as bool? ?? false,
      errorMessage: json['error_message'] as String?,
    );
  }
}
