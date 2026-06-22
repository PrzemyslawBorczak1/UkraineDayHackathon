import 'package:flutter/material.dart';

import '../models/mission.dart';
import '../theme/app_theme.dart';

/// A card displaying a single mission.
///
/// Active mission: expanded with a horizontal timeline bar, details grid,
/// and a caution strip for special requirements.
/// Upcoming missions: compact single-row summary.
class MissionCard extends StatelessWidget {
  final Mission mission;

  const MissionCard({super.key, required this.mission});

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
          color: mission.isCurrent ? AppTheme.primary.withValues(alpha: 0.4) : AppTheme.border,
        ),
      ),
      child: mission.isCurrent ? _buildExpanded() : _buildCollapsed(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  EXPANDED (active mission)
  // ═══════════════════════════════════════════════════════════════════════

  Widget _buildExpanded() {
    final waitMin = mission.unloadingWaitTime.inMinutes;
    final unloadEnd = mission.endTime.add(mission.unloadingWaitTime);

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
                mission.cargoType,
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
              _buildHorizontalTimeline(waitMin, unloadEnd),
              const SizedBox(height: 20),

              // ── Specs row ─────────────────────────────────────────────
              Row(
                children: [
                  _specBlock('Weight', _formatWeight(mission.weight)),
                  const SizedBox(width: 24),
                  _specBlock('Volume', '${mission.volume.toStringAsFixed(0)}L'),
                ],
              ),

              // ── Special requirements strip ────────────────────────────
              if (mission.specialRequirements.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildRequirementsStrip(),
              ],
            ],
          ),
        ),
      ],
    );
  }

  /// Horizontal timeline bar:  Origin ●────────●────────● Destination
  Widget _buildHorizontalTimeline(int waitMin, DateTime unloadEnd) {
    return Column(
      children: [
        // Times row
        Row(
          children: [
            Text(_hh(mission.startTime),
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textHigh,
                    fontFeatures: [FontFeature.tabularFigures()])),
            const Spacer(),
            if (waitMin > 0)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text(_hh(mission.endTime),
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMid,
                        fontFeatures: [FontFeature.tabularFigures()])),
              ),
            Text(waitMin > 0 ? _hh(unloadEnd) : _hh(mission.endTime),
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
            Text(mission.origin,
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
            Text(mission.destination,
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
              mission.specialRequirements.join(' · '),
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
  //  COLLAPSED (upcoming mission)
  // ═══════════════════════════════════════════════════════════════════════

  Widget _buildCollapsed() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          // Cargo type
          Expanded(
            flex: 3,
            child: Text(
              mission.cargoType,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: AppTheme.textHigh,
              ),
            ),
          ),

          // Compact timeline: time range + route
          Expanded(
            flex: 5,
            child: Row(
              children: [
                // Times column
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(_hh(mission.startTime),
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textHigh,
                            fontFeatures: [FontFeature.tabularFigures()])),
                    const SizedBox(height: 2),
                    Text(_hh(mission.endTime),
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textHigh,
                            fontFeatures: [FontFeature.tabularFigures()])),
                  ],
                ),
                const SizedBox(width: 8),

                // Dots + line
                SizedBox(
                  height: 30,
                  width: 10,
                  child: CustomPaint(
                    painter: _MiniVerticalLine(
                      color: AppTheme.textLow,
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Locations
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(mission.origin,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textMid)),
                      const SizedBox(height: 2),
                      Text(mission.destination,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textMid)),
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

  String _formatWeight(double kg) {
    if (kg >= 1000) return '${(kg / 1000).toStringAsFixed(0)}T';
    return '${kg.toStringAsFixed(0)}kg';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PAINTERS
// ═══════════════════════════════════════════════════════════════════════════

/// Horizontal timeline: ●━━━━━━━━━━━━●╌╌╌╌●
class _HorizontalTimelinePainter extends CustomPainter {
  final bool hasWait;
  final double travelRatio;

  _HorizontalTimelinePainter({
    required this.hasWait,
    required this.travelRatio,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final cy = size.height / 2;
    const dotR = 4.0;
    const smallDotR = 3.0;

    final travelEnd = size.width * travelRatio;

    // Travel line (solid)
    final travelPaint = Paint()
      ..color = AppTheme.primary.withValues(alpha: 0.5)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
        Offset(dotR + 2, cy), Offset(hasWait ? travelEnd - 2 : size.width - dotR - 2, cy), travelPaint);

    // Wait line (dashed) if present
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

      // Middle dot (arrival)
      canvas.drawCircle(
          Offset(travelEnd, cy), smallDotR, Paint()..color = AppTheme.textMid);

      // End dot (unload done)
      canvas.drawCircle(
          Offset(size.width - dotR, cy), dotR, Paint()..color = AppTheme.caution);
    } else {
      // End dot
      canvas.drawCircle(
          Offset(size.width - dotR, cy), dotR, Paint()..color = AppTheme.primary);
    }

    // Start dot
    canvas.drawCircle(Offset(dotR, cy), dotR, Paint()..color = AppTheme.primary);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Tiny vertical two-dot connector for collapsed cards.
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
