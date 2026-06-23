import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/login_screen.dart';
import 'services/http_api_service.dart';
import 'theme/app_theme.dart';

/// Optional override, e.g. for a physical device on the same LAN:
///   flutter run --dart-define=BACKEND_URL=http://192.168.1.50:8000
const String _backendFromEnv = String.fromEnvironment('BACKEND_URL');

/// Resolves the backend base URL for the current platform.
///
/// Android emulator reaches the host machine via the special `10.0.2.2` alias;
/// everything else (web, iOS simulator, desktop) reaches it via `localhost`.
String resolveBaseUrl() {
  if (_backendFromEnv.isNotEmpty) return _backendFromEnv;
  if (kIsWeb) return 'http://localhost:8000';
  if (defaultTargetPlatform == TargetPlatform.android) {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppTheme.background,
    ),
  );

  runApp(const CrisisLogisticsApp());
}

/// Root widget.
///
/// Uses [HttpApiService] pointing at the FastAPI backend.
/// Change [baseUrl] depending on your setup:
///   - Android emulator → `http://10.0.2.2:8000`
///   - iOS simulator    → `http://localhost:8000`
///   - Physical device  → `http://<your-lan-ip>:8000`
///   - Web              → `http://localhost:8000`
///
/// To fall back to mock data (offline), swap with:
///   `import 'services/mock_api_service.dart';`
///   `final api = MockApiService();`
class CrisisLogisticsApp extends StatelessWidget {
  const CrisisLogisticsApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = HttpApiService(baseUrl: resolveBaseUrl());

    return MaterialApp(
      title: 'Crisis Logistics',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: LoginScreen(api: api),
    );
  }
}
