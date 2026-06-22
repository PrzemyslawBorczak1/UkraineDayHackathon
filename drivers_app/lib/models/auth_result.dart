/// Authentication result returned by the login endpoint.
///
/// Maps to: POST /api/v1/auth/login
class AuthResult {
  final String token;
  final String vehicleId;
  final bool success;
  final String? errorMessage;

  const AuthResult({
    required this.token,
    required this.vehicleId,
    required this.success,
    this.errorMessage,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      token: json['token'] as String? ?? '',
      vehicleId: json['vehicle_id'] as String? ?? '',
      success: json['success'] as bool? ?? false,
      errorMessage: json['error_message'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'vehicle_id': vehicleId,
      'success': success,
      if (errorMessage != null) 'error_message': errorMessage,
    };
  }
}
