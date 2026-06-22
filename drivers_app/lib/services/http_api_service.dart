import 'dart:convert';
import 'dart:isolate';
import 'package:http/http.dart' as http;

import '../models/auth_result.dart';
import '../models/incident.dart';
import '../models/task.dart';
import '../models/vehicle.dart';
import 'api_service.dart';

/// HTTP implementation of [ApiService] connecting to the FastAPI backend.
///
/// JSON decoding + model construction runs in isolates via [Isolate.run]
/// to keep the UI thread free.
class HttpApiService implements ApiService {
  final String baseUrl;
  final http.Client _client;

  HttpApiService({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  String get _api => '$baseUrl/api/v1';

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  // ─── Auth ──────────────────────────────────────────────────────────

  @override
  Future<AuthResult> login(String vehicleId) async {
    final response = await _client.post(
      Uri.parse('$_api/auth/login'),
      headers: _headers,
      body: jsonEncode({'vehicle_id': vehicleId}),
    );
    final raw = response.body;
    return Isolate.run(() =>
        AuthResult.fromJson(jsonDecode(raw) as Map<String, dynamic>));
  }

  // ─── Vehicles ──────────────────────────────────────────────────────

  @override
  Future<Vehicle> getVehicle(String vehicleId) async {
    final response = await _client.get(
      Uri.parse('$_api/vehicles/$vehicleId'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to load vehicle: ${response.statusCode}');
    }
    final raw = response.body;
    return Isolate.run(() =>
        Vehicle.fromJson(jsonDecode(raw) as Map<String, dynamic>));
  }

  // ─── Tasks ─────────────────────────────────────────────────────────

  @override
  Future<List<Task>> getTasks(String vehicleId) async {
    final response = await _client.get(
      Uri.parse('$_api/vehicles/$vehicleId/tasks'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to load tasks: ${response.statusCode}');
    }
    final raw = response.body;
    return Isolate.run(() {
      final list = jsonDecode(raw) as List;
      return list
          .map((json) => Task.fromJson(json as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Task> finishTask(int taskId) async {
    final response = await _client.patch(
      Uri.parse('$_api/tasks/$taskId'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to finish task: ${response.statusCode}');
    }
    final raw = response.body;
    return Isolate.run(() =>
        Task.fromJson(jsonDecode(raw) as Map<String, dynamic>));
  }

  // ─── Incidents ─────────────────────────────────────────────────────

  @override
  Future<bool> reportIncident(Incident incident) async {
    final body = jsonEncode(incident.toJson());
    final response = await _client.post(
      Uri.parse('$_api/tasks/${incident.taskId}/incidents'),
      headers: _headers,
      body: body,
    );
    return response.statusCode == 201;
  }
}
