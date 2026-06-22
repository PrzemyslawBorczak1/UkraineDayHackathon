import 'package:flutter/material.dart';

import '../models/mission.dart';
import '../theme/app_theme.dart';

/// A card displaying a single mission.
///
/// When [mission.isCurrent] is `true` the card is expanded with a timeline,
/// cargo details, and a special-requirements warning box.
/// Otherwise it shows a compact summary row.
class MissionCard extends StatelessWidget {
  final Mission mission;

  const MissionCard({super.key, required this.mission});

  // ─── Helpers ─────────────────────────────────────────────────────────

  String _hhmm(DateTime t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  IconData _cargoIcon(String cargoType) {
    switch (cargoType.toLowerCase()) {
      case 'food':
        return Icons.restaurant_rounded;
      case 'medicine':
        return Icons.medication_rounded;
      default:
        return Icons.inventory_2_rounded;
    }
  }

  // ─── Build ───────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppTheme.cardDark,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        border: Border.all(
          color:
              mission.isCurrent ? AppTheme.primary.withValues(alpha: 0.6) : AppTheme.divider,
          width: mission.isCurrent ? 1.5 : 1,
        ),
        boxShadow: mission.isCurrent ? AppTheme.glowShadow(AppTheme.primary) : [],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(context),
            const SizedBox(height: 16),
            _buildTimeline(),
            if (mission.isCurrent) ...[
              const SizedBox(height: 20),
              _buildDetails(),
              if (mission.specialRequirements.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildWarningBox(),
              ],
            ],
          ],
        ),
      ),
    );
  }

  // ─── Header (cargo type + badge) ────────────────────────────────────

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: mission.isCurrent
                ? AppTheme.primary.withValues(alpha: 0.15)
                : AppTheme.surfaceLight,
            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          ),
          child: Icon(
            _cargoIcon(mission.cargoType),
            color: mission.isCurrent ? AppTheme.primaryLight : AppTheme.textSecondary,
            size: 24,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            mission.cargoType,
            style: TextStyle(
              fontSize: mission.isCurrent ? 22 : 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        if (mission.isCurrent)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.accent, Color(0xFF00B894)],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: AppTheme.glowShadow(AppTheme.accent),
            ),
            child: const Text(
              'ACTIVE',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
          ),
      ],
    );
  }

  // ─── Timeline (origin → destination → unloading) ─────────────────

  Widget _buildTimeline() {
    final arrivalTime = mission.endTime;
    final unloadDoneTime = arrivalTime.add(mission.unloadingWaitTime);
    final showWait = mission.isCurrent && mission.unloadingWaitTime.inMinutes > 0;
    final nodeCount = showWait ? 3 : 2;

    return Row(
      children: [
        // Left side: times
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(_hhmm(mission.startTime),
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary)),
            const SizedBox(height: 20),
            Text(_hhmm(arrivalTime),
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary)),
            if (showWait) ...[
              const SizedBox(height: 20),
              Text(_hhmm(unloadDoneTime),
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.warningAmber)),
            ],
          ],
        ),
        const SizedBox(width: 12),
        // Centre: dots & line
        SizedBox(
          height: showWait ? 92 : 56,
          width: 20,
          child: CustomPaint(
            painter: _TimelinePainter(
              dotColor: AppTheme.primary,
              lineColor: AppTheme.divider,
              nodeCount: nodeCount,
              lastSegmentColor: showWait ? AppTheme.warningAmber : null,
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Right side: locations
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(mission.origin,
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary)),
              const SizedBox(height: 20),
              Text(mission.destination,
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary)),
              if (showWait) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.hourglass_bottom_rounded,
                        size: 16, color: AppTheme.warningAmber),
                    const SizedBox(width: 4),
                    Text(
                      'Unloading · ${mission.unloadingWaitTime.inMinutes} min',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.warningAmber,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  // ─── Details row (weight / volume) ──────────────────────────────────

  Widget _buildDetails() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _detailChip(Icons.scale_rounded, 'Weight: ${_formatWeight(mission.weight)}'),
          _detailChip(Icons.view_in_ar_rounded, 'Volume: ${mission.volume.toStringAsFixed(0)}L'),
        ],
      ),
    );
  }

  String _formatWeight(double kg) {
    if (kg >= 1000) return '${(kg / 1000).toStringAsFixed(0)}T';
    return '${kg.toStringAsFixed(0)} kg';
  }

  Widget _detailChip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Text(text,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary)),
      ],
    );
  }

  // ─── Warning box for special requirements ───────────────────────────

  Widget _buildWarningBox() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.warningOrange.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        border: Border.all(color: AppTheme.warningOrange.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.warning_amber_rounded,
              color: AppTheme.warningOrange, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: mission.specialRequirements
                  .map((r) => Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Text(
                          r,
                          style: const TextStyle(
                            color: AppTheme.warningOrange,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Custom painter for the vertical dot-line-dot timeline ───────────

class _TimelinePainter extends CustomPainter {
  final Color dotColor;
  final Color lineColor;
  final int nodeCount;
  final Color? lastSegmentColor;

  _TimelinePainter({
    required this.dotColor,
    required this.lineColor,
    this.nodeCount = 2,
    this.lastSegmentColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    const dotRadius = 5.0;
    const dashHeight = 4.0;
    const dashGap = 3.0;

    // Calculate node Y positions evenly
    final spacing = (size.height - dotRadius * 2) / (nodeCount - 1);
    final nodeYs = List.generate(nodeCount, (i) => dotRadius + i * spacing);

    // Draw dashed lines between nodes
    for (int seg = 0; seg < nodeCount - 1; seg++) {
      final isLast = seg == nodeCount - 2;
      final segColor = (isLast && lastSegmentColor != null)
          ? lastSegmentColor!
          : lineColor;

      final paint = Paint()
        ..color = segColor
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke;

      double y = nodeYs[seg] + dotRadius + 2;
      final yEnd = nodeYs[seg + 1] - dotRadius - 2;
      while (y < yEnd) {
        final end = (y + dashHeight).clamp(y, yEnd);
        canvas.drawLine(Offset(cx, y), Offset(cx, end), paint);
        y += dashHeight + dashGap;
      }
    }

    // Draw dots
    for (int i = 0; i < nodeCount; i++) {
      final isLast = i == nodeCount - 1;
      final color = (isLast && lastSegmentColor != null)
          ? lastSegmentColor!
          : dotColor;
      canvas.drawCircle(Offset(cx, nodeYs[i]), dotRadius, Paint()..color = color);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

