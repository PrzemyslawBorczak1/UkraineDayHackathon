import 'package:flutter/material.dart';

import '../models/incident.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

/// Bottom sheet for reporting an incident (end of mission or delay).
class IncidentBottomSheet extends StatefulWidget {
  final ApiService api;
  final int currentTaskId;

  const IncidentBottomSheet({
    super.key,
    required this.api,
    required this.currentTaskId,
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
      taskId: widget.currentTaskId,
      type: _selectedType!,
      delayMinutes: _selectedType == IncidentType.delay ? _delayMinutes : null,
      description: _descriptionCtrl.text.isNotEmpty
          ? _descriptionCtrl.text
          : null,
      reportedAt: DateTime.now(),
    );

    final success = await widget.api.reportIncident(incident);

    if (!mounted) return;
    setState(() => _isSending = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Incident reported'),
          backgroundColor: AppTheme.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
      );
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Failed to report incident'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(
        bottom: bottomInset + 20,
        top: 12,
        left: 20,
        right: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 32,
              height: 3,
              decoration: BoxDecoration(
                color: AppTheme.textLow,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Icon(Icons.warning_rounded, color: AppTheme.caution, size: 20),
              const SizedBox(width: 10),
              const Text(
                'Report Incident',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textHigh,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          DropdownButtonFormField<IncidentType>(
            decoration: const InputDecoration(labelText: 'Incident Type'),
            dropdownColor: AppTheme.surfaceAlt,
            initialValue: _selectedType,
            items: IncidentType.values.map((type) {
              return DropdownMenuItem(
                value: type,
                child: Text(
                  type.label,
                  style: const TextStyle(
                    color: AppTheme.textHigh,
                    fontSize: 15,
                  ),
                ),
              );
            }).toList(),
            onChanged: (value) => setState(() => _selectedType = value),
          ),

          if (_selectedType == IncidentType.delay) ...[
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              decoration: const InputDecoration(labelText: 'Delay Duration'),
              dropdownColor: AppTheme.surfaceAlt,
              initialValue: _delayMinutes,
              items: _delayOptions.map((m) {
                final label = m >= 60
                    ? '${m ~/ 60}h${m % 60 > 0 ? ' ${m % 60}min' : ''}'
                    : '$m min';
                return DropdownMenuItem(
                  value: m,
                  child: Text(
                    label.trim(),
                    style: const TextStyle(
                      color: AppTheme.textHigh,
                      fontSize: 15,
                    ),
                  ),
                );
              }).toList(),
              onChanged: (value) => setState(() => _delayMinutes = value),
            ),
          ],

          const SizedBox(height: 12),

          TextField(
            controller: _descriptionCtrl,
            maxLines: 3,
            style: const TextStyle(color: AppTheme.textHigh, fontSize: 15),
            decoration: const InputDecoration(
              labelText: 'Description (Optional)',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 20),

          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: _isSending
                      ? null
                      : () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _selectedType == null || _isSending
                      ? null
                      : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.caution,
                    foregroundColor: AppTheme.background,
                    disabledBackgroundColor: AppTheme.surfaceAlt,
                  ),
                  child: _isSending
                      ? const SizedBox(
                          height: 18,
                          width: 18,
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
