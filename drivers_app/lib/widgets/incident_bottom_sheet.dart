import 'package:flutter/material.dart';

import '../models/incident.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

/// Bottom sheet for reporting an incident (end of mission or delay).
class IncidentBottomSheet extends StatefulWidget {
  final ApiService api;
  final String currentMissionId;

  const IncidentBottomSheet({
    super.key,
    required this.api,
    required this.currentMissionId,
  });

  @override
  State<IncidentBottomSheet> createState() => _IncidentBottomSheetState();
}

class _IncidentBottomSheetState extends State<IncidentBottomSheet> {
  IncidentType? _selectedType;
  int? _delayMinutes;
  final TextEditingController _descriptionCtrl = TextEditingController();
  bool _isSending = false;

  final List<int> _delayOptions = [15, 30, 60, 120, 180];

  Future<void> _submit() async {
    if (_selectedType == null) return;

    setState(() => _isSending = true);

    final incident = Incident(
      missionId: widget.currentMissionId,
      type: _selectedType!,
      delayDuration: _selectedType == IncidentType.delay && _delayMinutes != null
          ? Duration(minutes: _delayMinutes!)
          : null,
      description: _descriptionCtrl.text.isNotEmpty ? _descriptionCtrl.text : null,
      reportedAt: DateTime.now(),
    );

    final success = await widget.api.reportIncident(incident);

    if (!mounted) return;
    setState(() => _isSending = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Incident reported successfully'),
          backgroundColor: AppTheme.successGreen,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(
        bottom: bottomInset + 24,
        top: 16,
        left: 24,
        right: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.textMuted,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Title
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.warningAmber.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: const Icon(Icons.warning_amber_rounded,
                    color: AppTheme.warningAmber, size: 26),
              ),
              const SizedBox(width: 14),
              const Text(
                'Report Incident',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Incident type dropdown
          DropdownButtonFormField<IncidentType>(
            decoration: const InputDecoration(labelText: 'Incident Type'),
            dropdownColor: AppTheme.surfaceLight,
            initialValue: _selectedType,
            items: IncidentType.values.map((type) {
              return DropdownMenuItem(
                value: type,
                child: Text(type.label,
                    style: const TextStyle(color: AppTheme.textPrimary)),
              );
            }).toList(),
            onChanged: (value) => setState(() => _selectedType = value),
          ),

          // Delay duration – only when "Opóźnienie" is selected
          if (_selectedType == IncidentType.delay) ...[
            const SizedBox(height: 16),
            DropdownButtonFormField<int>(
              decoration: const InputDecoration(labelText: 'Delay Duration'),
              dropdownColor: AppTheme.surfaceLight,
              initialValue: _delayMinutes,
              items: _delayOptions.map((m) {
                final label =
                    m >= 60 ? '${m ~/ 60}h ${m % 60 > 0 ? '${m % 60}min' : ''}' : '$m min';
                return DropdownMenuItem(
                  value: m,
                  child: Text(label.trim(),
                      style: const TextStyle(color: AppTheme.textPrimary)),
                );
              }).toList(),
              onChanged: (value) => setState(() => _delayMinutes = value),
            ),
          ],

          const SizedBox(height: 16),

          // Description
          TextField(
            controller: _descriptionCtrl,
            maxLines: 3,
            style: const TextStyle(color: AppTheme.textPrimary),
            decoration: const InputDecoration(
              labelText: 'Opis (Optional)',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 28),

          // Action buttons
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: _isSending ? null : () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _selectedType == null || _isSending ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.warningAmber,
                    foregroundColor: AppTheme.backgroundDark,
                    disabledBackgroundColor: AppTheme.surfaceLight,
                  ),
                  child: _isSending
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
