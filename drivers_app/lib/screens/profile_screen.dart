import 'package:flutter/material.dart';

import '../models/vehicle.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

/// Profile screen displaying the vehicle's specs, features, and restrictions.
class ProfileScreen extends StatefulWidget {
  final ApiService api;
  final String vehicleId;

  const ProfileScreen({
    super.key,
    required this.api,
    required this.vehicleId,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<Vehicle> _vehicleFuture;

  @override
  void initState() {
    super.initState();
    _vehicleFuture = widget.api.getVehicle(widget.vehicleId);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Vehicle>(
      future: _vehicleFuture,
      builder: (context, snapshot) {
        final vehicle = snapshot.data;

        return Scaffold(
          appBar: AppBar(
            title: Text(vehicle?.type ?? 'Vehicle Profile'),
          ),
          body: _buildBody(snapshot),
        );
      },
    );
  }

  Widget _buildBody(AsyncSnapshot<Vehicle> snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (snapshot.hasError) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded,
                size: 64, color: AppTheme.textMuted),
            const SizedBox(height: 16),
            const Text('Failed to load vehicle data',
                style:
                    TextStyle(fontSize: 18, color: AppTheme.textSecondary)),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () => setState(
                  () => _vehicleFuture = widget.api.getVehicle(widget.vehicleId)),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final vehicle = snapshot.data!;
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Vehicle icon
          Center(
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.primary.withValues(alpha: 0.15),
                    AppTheme.accent.withValues(alpha: 0.08),
                  ],
                ),
                borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              ),
              child: const Icon(Icons.fire_truck_rounded,
                  size: 80, color: AppTheme.primary),
            ),
          ),
          const SizedBox(height: 28),

          // Features chips
          _sectionTitle('Features'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: vehicle.features
                .map((f) => Chip(label: Text(f)))
                .toList(),
          ),
          const SizedBox(height: 28),

          // Specifications
          _sectionTitle('Specifications'),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.cardDark,
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              border: Border.all(color: AppTheme.divider),
            ),
            child: Column(
              children: [
                _specRow('Weight', '${_formatNumber(vehicle.weight)} kg'),
                _divider(),
                _specRow('Payload', '${_formatNumber(vehicle.payload)} kg'),
                _divider(),
                _specRow('Volume', '${_formatNumber(vehicle.volume)} L'),
                _divider(),
                _specRow(
                    'Op. Range', '${_formatNumber(vehicle.operationalRange)} km'),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Restrictions
          if (vehicle.restrictions.isNotEmpty) ...[
            _sectionTitle('Restrictions', isCaution: true),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.warningOrange.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                border: Border.all(color: AppTheme.warningOrange.withValues(alpha: 0.4), width: 1.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: vehicle.restrictions.map((r) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 2),
                          child: Icon(Icons.remove_circle_outline_rounded,
                              color: AppTheme.warningOrange, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            r,
                            style: const TextStyle(
                              color: AppTheme.warningOrange,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ─── Helper widgets ────────────────────────────────────────────────

  Widget _sectionTitle(String text, {bool isCaution = false}) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: isCaution ? AppTheme.warningOrange : AppTheme.textPrimary,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _specRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 15, color: AppTheme.textSecondary)),
          Text(value,
              style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary)),
        ],
      ),
    );
  }

  Widget _divider() => Divider(color: AppTheme.divider, height: 1);

  String _formatNumber(double n) {
    if (n == n.toInt().toDouble()) return n.toInt().toString();
    return n.toStringAsFixed(1);
  }
}
