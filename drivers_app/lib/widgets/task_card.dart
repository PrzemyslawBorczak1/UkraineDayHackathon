import 'package:flutter/material.dart';

import '../models/task.dart';
import '../theme/app_theme.dart';

/// A card displaying a single task.
///
/// Active task (`isCurrent`): expanded with horizontal timeline, details, warnings.
/// Upcoming tasks: compact single-row summary.
class TaskCard extends StatelessWidget {
  final Task task;
  final VoidCallback? onFinish;
  final VoidCallback? onMap;

  const TaskCard({
    super.key, 
    required this.task,
    this.onFinish,
    this.onMap,
  });

  String _hh(DateTime t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(AppTheme.r8),
        border: Border.all(
          color: task.isCurrent ? AppTheme.primary.withValues(alpha: 0.4) : AppTheme.border,
        ),
      ),
      child: task.isCurrent ? _buildExpanded() : _buildCollapsed(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  EXPANDED (active task)
  // ═══════════════════════════════════════════════════════════════════════

  Widget _buildExpanded() {
    final waitMin = task.unloadingWaitMinutes ?? 0;
    final endTime = task.endTime;
    final unloadEnd = endTime?.add(Duration(minutes: waitMin));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Header ─────────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppTheme.border)),
          ),
          child: Row(
            children: [
              Text(
                task.cargoType,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textHigh,
                  letterSpacing: -0.3,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppTheme.r4),
                  border: Border.all(color: AppTheme.accent.withValues(alpha: 0.3)),
                ),
                child: const Text(
                  'ACTIVE',
                  style: TextStyle(
                    color: AppTheme.accent,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
            ],
          ),
        ),

        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Horizontal timeline ───────────────────────────────────
              if (task.startTime != null && endTime != null)
                _buildHorizontalTimeline(waitMin, endTime, unloadEnd),
              if (task.startTime != null && endTime != null)
                const SizedBox(height: 20),

              // ── Specs row ─────────────────────────────────────────────
              Row(
                children: [
                  _specBlock('Weight', '${task.weight}T'),
                  const SizedBox(width: 24),
                  _specBlock('Volume', '${task.volume}m³'),
                ],
              ),

              // ── Special requirements strip ────────────────────────────
              if (task.specialRequirements.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildRequirementsStrip(),
              ],

              const SizedBox(height: 24),
              // ── Actions ───────────────────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onMap,
                      icon: const Icon(Icons.map_rounded, size: 18),
                      label: const Text('Map'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.textHigh,
                        side: const BorderSide(color: AppTheme.border),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: onFinish,
                      icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                      label: const Text('Finish Task'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.success,
                        foregroundColor: AppTheme.background,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHorizontalTimeline(int waitMin, DateTime endTime, DateTime? unloadEnd) {
    return Column(
      children: [
        // Times row
        Row(
          children: [
            Text(_hh(task.startTime!),
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textHigh,
                    fontFeatures: [FontFeature.tabularFigures()])),
            const Spacer(),
            if (waitMin > 0 && unloadEnd != null)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text(_hh(endTime),
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMid,
                        fontFeatures: [FontFeature.tabularFigures()])),
              ),
            Text(waitMin > 0 && unloadEnd != null ? _hh(unloadEnd) : _hh(endTime),
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: waitMin > 0 ? AppTheme.caution : AppTheme.textHigh,
                    fontFeatures: const [FontFeature.tabularFigures()])),
          ],
        ),
        const SizedBox(height: 6),

        // Bar
        SizedBox(
          height: 14,
          child: CustomPaint(
            size: const Size(double.infinity, 14),
            painter: _HorizontalTimelinePainter(
              hasWait: waitMin > 0,
              travelRatio: waitMin > 0 ? 0.7 : 1.0,
            ),
          ),
        ),
        const SizedBox(height: 6),

        // Locations row
        Row(
          children: [
            Text(task.origin,
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textMid)),
            const Spacer(),
            if (waitMin > 0)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.hourglass_top_rounded,
                      size: 14, color: AppTheme.caution.withValues(alpha: 0.7)),
                  const SizedBox(width: 3),
                  Text('${waitMin}min',
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.caution)),
                  const SizedBox(width: 12),
                ],
              ),
            Text(task.destination,
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textMid)),
          ],
        ),
      ],
    );
  }

  Widget _specBlock(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(AppTheme.r4),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$label: ',
              style: const TextStyle(
                  fontSize: 14, color: AppTheme.textLow, fontWeight: FontWeight.w500)),
          Text(value,
              style: const TextStyle(
                  fontSize: 14, color: AppTheme.textHigh, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildRequirementsStrip() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.cautionBg,
        borderRadius: BorderRadius.circular(AppTheme.r4),
        border: Border.all(color: AppTheme.caution.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 1),
            child:
                Icon(Icons.warning_rounded, color: AppTheme.caution, size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              task.specialRequirements.join(' · '),
              style: const TextStyle(
                color: AppTheme.caution,
                fontWeight: FontWeight.w600,
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  COLLAPSED (upcoming task)
  // ═══════════════════════════════════════════════════════════════════════

  Widget _buildCollapsed() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(
              task.cargoType,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: AppTheme.textHigh,
              ),
            ),
          ),
          Expanded(
            flex: 5,
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (task.startTime != null)
                      Text(_hh(task.startTime!),
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textHigh,
                              fontFeatures: [FontFeature.tabularFigures()])),
                    const SizedBox(height: 2),
                    if (task.endTime != null)
                      Text(_hh(task.endTime!),
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textHigh,
                              fontFeatures: [FontFeature.tabularFigures()])),
                  ],
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 30,
                  width: 10,
                  child: CustomPaint(
                    painter: _MiniVerticalLine(color: AppTheme.textLow),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(task.origin,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14, color: AppTheme.textMid)),
                      const SizedBox(height: 2),
                      Text(task.destination,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14, color: AppTheme.textMid)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PAINTERS
// ═══════════════════════════════════════════════════════════════════════════

class _HorizontalTimelinePainter extends CustomPainter {
  final bool hasWait;
  final double travelRatio;

  _HorizontalTimelinePainter({required this.hasWait, required this.travelRatio});

  @override
  void paint(Canvas canvas, Size size) {
    final cy = size.height / 2;
    const dotR = 4.0;
    const smallDotR = 3.0;

    final travelEnd = size.width * travelRatio;

    final travelPaint = Paint()
      ..color = AppTheme.primary.withValues(alpha: 0.5)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
        Offset(dotR + 2, cy),
        Offset(hasWait ? travelEnd - 2 : size.width - dotR - 2, cy),
        travelPaint);

    if (hasWait) {
      final waitPaint = Paint()
        ..color = AppTheme.caution.withValues(alpha: 0.5)
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round;

      const dash = 4.0;
      const gap = 3.0;
      double x = travelEnd + 2;
      while (x < size.width - dotR - 2) {
        final end = (x + dash).clamp(x, size.width - dotR - 2);
        canvas.drawLine(Offset(x, cy), Offset(end, cy), waitPaint);
        x += dash + gap;
      }

      canvas.drawCircle(
          Offset(travelEnd, cy), smallDotR, Paint()..color = AppTheme.textMid);
      canvas.drawCircle(
          Offset(size.width - dotR, cy), dotR, Paint()..color = AppTheme.caution);
    } else {
      canvas.drawCircle(
          Offset(size.width - dotR, cy), dotR, Paint()..color = AppTheme.primary);
    }

    canvas.drawCircle(Offset(dotR, cy), dotR, Paint()..color = AppTheme.primary);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _MiniVerticalLine extends CustomPainter {
  final Color color;
  _MiniVerticalLine({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    const r = 2.5;
    final paint = Paint()..color = color;

    canvas.drawCircle(Offset(cx, r), r, paint);
    canvas.drawCircle(Offset(cx, size.height - r), r, paint);

    final linePaint = Paint()
      ..color = color.withValues(alpha: 0.4)
      ..strokeWidth = 1;
    canvas.drawLine(
        Offset(cx, r * 2 + 2), Offset(cx, size.height - r * 2 - 2), linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
