import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/login_screen.dart';
import 'services/mock_api_service.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait — better for driving scenarios.
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  // Dark status bar for the dark theme.
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AppTheme.background,
  ));

  runApp(const CrisisLogisticsApp());
}

/// Root widget.
///
/// The [ApiService] instance is created here and passed down via constructors.
/// When the real backend is ready, swap [MockApiService] with an
/// `HttpApiService` implementation (or use a DI framework like `provider`).
class CrisisLogisticsApp extends StatelessWidget {
  const CrisisLogisticsApp({super.key});

  @override
  Widget build(BuildContext context) {
    // ── Single source of truth for the API layer ──────────────────────
    final api = MockApiService();

    return MaterialApp(
      title: 'Crisis Logistics',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: LoginScreen(api: api),
    );
  }
}
