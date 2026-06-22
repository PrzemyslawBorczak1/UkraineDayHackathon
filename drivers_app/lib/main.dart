import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/login_screen.dart';
import 'services/http_api_service.dart';
import 'theme/app_theme.dart';

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
    final api = HttpApiService(baseUrl: 'http://10.0.2.2:8000');

    return MaterialApp(
      title: 'Crisis Logistics',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: LoginScreen(api: api),
    );
  }
}
