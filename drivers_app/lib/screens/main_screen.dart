import 'package:flutter/material.dart';

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

  void _openIncidentSheet(int taskId) {
    showModalBottomSheet(
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
              itemBuilder: (_, i) => TaskCard(task: tasks[i]),
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
