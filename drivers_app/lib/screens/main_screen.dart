import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/task.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/incident_bottom_sheet.dart';
import '../widgets/task_card.dart';
import 'profile_screen.dart';

/// Main screen showing the driver's task list.
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
  late Future<List<Task>> _tasksFuture;

  @override
  void initState() {
    super.initState();
    _tasksFuture = widget.api.getTasks(widget.vehicleId);
  }

  void _refresh() {
    setState(() {
      _tasksFuture = widget.api.getTasks(widget.vehicleId);
    });
  }

  Future<void> _openIncidentSheet(int taskId) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppTheme.r12)),
      ),
      builder: (_) => IncidentBottomSheet(
        api: widget.api,
        currentTaskId: taskId,
      ),
    );

    if (result == true) {
      _refresh();
    }
  }

  void _showWarehousePopup(String name) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: Text(name, style: const TextStyle(color: AppTheme.textHigh)),
        content: FutureBuilder(
          future: widget.api.getWarehouse(name),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox(
                height: 100,
                child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
              );
            }
            if (snapshot.hasError) {
              return const Text('Failed to load warehouse data', style: TextStyle(color: AppTheme.danger));
            }
            
            final w = snapshot.data!;
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _infoRow('Capacity', '${w.availableCapacityPercent}% available'),
                const SizedBox(height: 8),
                _infoRow('Hours', w.availabilityHours),
                const SizedBox(height: 8),
                _infoRow('Dock Doors', '${w.dockDoors} available'),
                const SizedBox(height: 8),
                _infoRow('Coords', '${w.coordinates['lat']}, ${w.coordinates['lng']}'),
              ],
            );
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(label, style: const TextStyle(color: AppTheme.textLow, fontSize: 13)),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(color: AppTheme.textHigh, fontSize: 14, fontWeight: FontWeight.w500)),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: IconButton(
            icon: const Icon(Icons.person_rounded, size: 20),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.surfaceAlt,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.r6),
                side: const BorderSide(color: AppTheme.border),
              ),
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
        title: const Text('Tasks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'Refresh',
            onPressed: _refresh,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: FutureBuilder<List<Task>>(
        future: _tasksFuture,
        builder: (context, snapshot) {
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
                      size: 40, color: AppTheme.textLow),
                  const SizedBox(height: 12),
                  const Text('Failed to load tasks',
                      style:
                          TextStyle(color: AppTheme.textMid, fontSize: 15)),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: _refresh,
                    icon: const Icon(Icons.refresh_rounded, size: 16),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final tasks = snapshot.data!;

          if (tasks.isEmpty) {
            return const Center(
              child: Text('No tasks assigned',
                  style: TextStyle(color: AppTheme.textMid, fontSize: 15)),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _refresh(),
            color: AppTheme.primary,
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
              itemCount: tasks.length,
              itemBuilder: (_, i) {
                final task = tasks[i];
                return TaskCard(
                  task: task,
                  onFinish: task.isCurrent
                      ? () async {
                          await widget.api.finishTask(task.id);
                          _refresh();
                        }
                      : null,
                  onMap: task.isCurrent
                      ? () async {
                          final uri = Uri.parse(
                            'https://www.google.com/maps/dir/?api=1'
                            '&origin=${Uri.encodeComponent(task.origin)}'
                            '&destination=${Uri.encodeComponent(task.destination)}',
                          );
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri,
                                mode: LaunchMode.externalApplication);
                          }
                        }
                      : null,
                  onWarehouseClick: _showWarehousePopup,
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FutureBuilder<List<Task>>(
        future: _tasksFuture,
        builder: (context, snapshot) {
          final tasks = snapshot.data;
          int currentTaskId = 0;
          if (tasks != null) {
            final c = tasks.where((t) => t.isCurrent);
            if (c.isNotEmpty) currentTaskId = c.first.id;
          }

          return FloatingActionButton.extended(
            onPressed: currentTaskId > 0
                ? () => _openIncidentSheet(currentTaskId)
                : null,
            backgroundColor: AppTheme.caution,
            foregroundColor: AppTheme.background,
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.r8),
            ),
            icon: const Icon(Icons.warning_rounded, size: 18),
            label: const Text(
              'Incident',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
          );
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
