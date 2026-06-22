import 'package:flutter/material.dart';

import '../models/mission.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/incident_bottom_sheet.dart';
import '../widgets/mission_card.dart';
import 'profile_screen.dart';

/// Main screen showing the driver's mission list, profile access, and
/// incident reporting FAB.
class MainScreen extends StatefulWidget {
  final ApiService api;
  final String vehicleId;

  const MainScreen({
    super.key,
    required this.api,
    required this.vehicleId,
  });

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  late Future<List<Mission>> _missionsFuture;

  @override
  void initState() {
    super.initState();
    _missionsFuture = widget.api.getMissions(widget.vehicleId);
  }

  void _refreshMissions() {
    setState(() {
      _missionsFuture = widget.api.getMissions(widget.vehicleId);
    });
  }

  void _openIncidentSheet(String currentMissionId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusLg)),
      ),
      builder: (_) => IncidentBottomSheet(
        api: widget.api,
        currentMissionId: currentMissionId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // ── AppBar ──────────────────────────────────────────────────────
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.only(left: 8),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.surfaceLight,
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
              ),
              child: const Icon(Icons.person_rounded, size: 22),
            ),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ProfileScreen(
                    api: widget.api,
                    vehicleId: widget.vehicleId,
                  ),
                ),
              );
            },
          ),
        ),
        title: const Text('Missions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh missions',
            onPressed: _refreshMissions,
          ),
          const SizedBox(width: 8),
        ],
      ),

      // ── Body ────────────────────────────────────────────────────────
      body: FutureBuilder<List<Mission>>(
        future: _missionsFuture,
        builder: (context, snapshot) {
          // Loading state
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            );
          }

          // Error state
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.cloud_off_rounded,
                      size: 64, color: AppTheme.textMuted),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load missions',
                    style: TextStyle(
                        fontSize: 18, color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: _refreshMissions,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          // Data loaded
          final missions = snapshot.data!;

          if (missions.isEmpty) {
            return const Center(
              child: Text('No missions assigned',
                  style: TextStyle(
                      fontSize: 18, color: AppTheme.textSecondary)),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _refreshMissions(),
            color: AppTheme.primary,
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              itemCount: missions.length,
              itemBuilder: (_, index) => MissionCard(mission: missions[index]),
            ),
          );
        },
      ),

      // ── FAB ─────────────────────────────────────────────────────────
      floatingActionButton: FutureBuilder<List<Mission>>(
        future: _missionsFuture,
        builder: (context, snapshot) {
          final missions = snapshot.data;
          // Find the current mission id for the incident sheet
          String currentMissionId = '';
          if (missions != null) {
            final current = missions.where((m) => m.isCurrent);
            if (current.isNotEmpty) currentMissionId = current.first.id;
          }

          return FloatingActionButton.extended(
            onPressed: () => _openIncidentSheet(currentMissionId),
            backgroundColor: AppTheme.warningAmber,
            foregroundColor: AppTheme.backgroundDark,
            icon: const Icon(Icons.warning_amber_rounded, size: 24),
            label: const Text(
              'Incident',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
          );
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
