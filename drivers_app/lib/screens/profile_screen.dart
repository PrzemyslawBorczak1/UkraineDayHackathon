import 'package:flutter/material.dart';

import '../models/vehicle.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

/// Vehicle profile screen — specs, features, restrictions.
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
        return Scaffold(
          appBar: AppBar(title: Text(snapshot.data?.type ?? 'Vehicle')),
          body: _body(snapshot),
        );
      },
    );
  }

  Widget _body(AsyncSnapshot<Vehicle> snap) {
    if (snap.connectionState == ConnectionState.waiting) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (snap.hasError) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded,
                size: 40, color: AppTheme.textLow),
            const SizedBox(height: 12),
            const Text('Failed to load vehicle data',
                style: TextStyle(color: AppTheme.textMid, fontSize: 14)),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () => setState(() =>
                  _vehicleFuture = widget.api.getVehicle(widget.vehicleId)),
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final v = snap.data!;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Vehicle icon ──────────────────────────────────────────────
          Center(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.surfaceAlt,
                borderRadius: BorderRadius.circular(AppTheme.r12),
                border: Border.all(color: AppTheme.border),
              ),
              child: const Icon(Icons.fire_truck_rounded,
                  size: 56, color: AppTheme.primary),
            ),
          ),
          const SizedBox(height: 24),

          // ── Features ──────────────────────────────────────────────────
          _label('Features'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: v.features.map((f) => Chip(label: Text(f))).toList(),
          ),
          const SizedBox(height: 24),

          // ── Specifications ────────────────────────────────────────────
          _label('Specifications'),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(AppTheme.r8),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              children: [
                _specRow('Weight', '${_fmt(v.weight)} kg', false),
                _specRow('Payload', '${_fmt(v.payload)} kg', true),
                _specRow('Volume', '${_fmt(v.volume)} L', false),
                _specRow('Op. Range', '${_fmt(v.operationalRange)} km', true),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Restrictions ──────────────────────────────────────────────
          if (v.restrictions.isNotEmpty) ...[
            _label('Restrictions'),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.cautionBg,
                borderRadius: BorderRadius.circular(AppTheme.r8),
                border:
                    Border.all(color: AppTheme.caution.withValues(alpha: 0.25)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: v.restrictions.map((r) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 2),
                          child: Icon(Icons.remove_circle_outline_rounded,
                              color: AppTheme.caution, size: 15),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            r,
                            style: const TextStyle(
                              color: AppTheme.caution,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
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
        ],
      ),
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  Widget _label(String text) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: AppTheme.textLow,
        letterSpacing: 1.0,
      ),
    );
  }

  Widget _specRow(String label, String value, bool alt) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: alt ? AppTheme.surfaceAlt : Colors.transparent,
        border: const Border(bottom: BorderSide(color: AppTheme.border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 13, color: AppTheme.textMid)),
          Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textHigh)),
        ],
      ),
    );
  }

  String _fmt(double n) {
    if (n == n.toInt().toDouble()) return n.toInt().toString();
    return n.toStringAsFixed(1);
  }
}
